import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react'

import Box from '@mui/material/Box'

import HOW_I_BUILD_STAGES
    from '../../db/how'

import HowIBuildCircle
    from './cards/HowIBuildCircle'


const REVEAL_DELAY =
    400

const BLOW_DURATION =
    180

const CAMERA_Z =
    10

const CAMERA_FOV =
    60

const RING_Y =
    -2.05

const RING_SPACING =
    1.95

const RING_COUNT =
    6


export default function HowIBuildContainer({
    interactionRef,
    ringReady,
}) {
    const containerRef =
        useRef(null)

    const circleRefs =
        useRef([])

    const blowTimerRef =
        useRef(null)

    const [
        visibleCount,
        setVisibleCount,
    ] = useState(0)


    /*
     * ========================================================
     * RING WORLD -> DOM POSITION
     * ========================================================
     *
     * The Nebula Canvas and this DOM container occupy the
     * exact same rectangle.
     *
     * Therefore we use the container's actual dimensions,
     * NOT window.innerWidth / window.innerHeight.
     */

    const getRingPosition =
        useCallback(
            (
                index,
            ) => {
                const container =
                    containerRef.current

                if (!container) {
                    return null
                }

                const width =
                    container.clientWidth

                const height =
                    container.clientHeight

                if (
                    width <= 0 ||
                    height <= 0
                ) {
                    return null
                }

                const fovRadians =
                    (
                        CAMERA_FOV *
                        Math.PI
                    ) /
                    180

                const worldHeight =
                    2 *
                    CAMERA_Z *
                    Math.tan(
                        fovRadians /
                        2,
                    )

                const worldWidth =
                    worldHeight *
                    (
                        width /
                        height
                    )

                const totalWidth =
                    (
                        RING_COUNT -
                        1
                    ) *
                    RING_SPACING

                const worldX =
                    index *
                        RING_SPACING -
                    totalWidth /
                        2

                /*
                 * Three.js perspective projection:
                 *
                 * world X = 0
                 * -> screen center
                 *
                 * world Y = 0
                 * -> screen center
                 */

                const x =
                    (
                        0.5 +
                        worldX /
                        worldWidth
                    ) *
                    width

                const y =
                    (
                        0.5 -
                        RING_Y /
                        worldHeight
                    ) *
                    height

                return {
                    x,
                    y,
                }
            },
            [],
        )


    /*
     * ========================================================
     * POSITION DOM CIRCLES
     * ========================================================
     */

    const positionCircles =
        useCallback(
            () => {
                HOW_I_BUILD_STAGES.forEach(
                    (
                        stage,
                        index,
                    ) => {
                        const circle =
                            circleRefs
                                .current[
                                    index
                                ]

                        if (!circle) {
                            return
                        }

                        const position =
                            getRingPosition(
                                index,
                            )

                        if (!position) {
                            return
                        }

                        circle.style.left =
                            `${ position.x } px`

                        circle.style.top =
                            `${ position.y } px`
                    },
                )
            },
            [
                getRingPosition,
            ],
        )


    /*
     * ========================================================
     * BLOW
     * ========================================================
     */

    const blowCircle =
        useCallback(
            (
                index,
            ) => {
                const position =
                    getRingPosition(
                        index,
                    )

                if (
                    !position ||
                    !interactionRef
                ) {
                    return
                }

                /*
                 * IMPORTANT:
                 *
                 * These coordinates are LOCAL to the Nebula
                 * canvas/container.
                 *
                 * That is the same coordinate system used
                 * by NebulaBackground.
                 */

                interactionRef.current = {
                    x:
                        position.x,

                    y:
                        position.y,

                    active:
                        true,

                    strength:
                        1,
                }

                if (
                    blowTimerRef.current
                ) {
                    window.clearTimeout(
                        blowTimerRef.current,
                    )
                }

                blowTimerRef.current =
                    window.setTimeout(
                        () => {
                            interactionRef.current = {
                                x:
                                    position.x,

                                y:
                                    position.y,

                                active:
                                    false,

                                strength:
                                    0,
                            }
                        },
                        BLOW_DURATION,
                    )
            },
            [
                getRingPosition,
                interactionRef,
            ],
        )


    /*
     * ========================================================
     * INITIAL / RESIZE POSITIONING
     * ========================================================
     */

    useLayoutEffect(() => {
        positionCircles()
    }, [
        positionCircles,
    ])


    useEffect(() => {
        const handleResize =
            () => {
                positionCircles()
            }

        window.addEventListener(
            'resize',
            handleResize,
        )

        return () => {
            window.removeEventListener(
                'resize',
                handleResize,
            )
        }
    }, [
        positionCircles,
    ])


    /*
     * ========================================================
     * REVEAL
     * ========================================================
     */

    useEffect(() => {
        if (!ringReady) {
            setVisibleCount(0)

            return undefined
        }

        const timers = []

        HOW_I_BUILD_STAGES.forEach(
            (
                stage,
                index,
            ) => {
                const timer =
                    window.setTimeout(
                        () => {
                            /*
                             * Make the circle visible.
                             */

                            setVisibleCount(
                                index + 1,
                            )

                            /*
                             * Position it against
                             * the actual particle ring.
                             */

                            window.requestAnimationFrame(
                                () => {
                                    positionCircles()

                                    /*
                                     * Then blow the
                                     * corresponding ring.
                                     */

                                    window.requestAnimationFrame(
                                        () => {
                                            blowCircle(
                                                index,
                                            )
                                        },
                                    )
                                },
                            )
                        },
                        index *
                            REVEAL_DELAY,
                    )

                timers.push(
                    timer,
                )
            },
        )

        return () => {
            timers.forEach(
                (
                    timer,
                ) => {
                    window.clearTimeout(
                        timer,
                    )
                },
            )

            if (
                blowTimerRef.current
            ) {
                window.clearTimeout(
                    blowTimerRef.current,
                )
            }
        }
    }, [
        ringReady,
        positionCircles,
        blowCircle,
    ])


    /*
     * ========================================================
     * CLEANUP
     * ========================================================
     */

    useEffect(() => {
        return () => {
            if (
                blowTimerRef.current
            ) {
                window.clearTimeout(
                    blowTimerRef.current,
                )
            }

            interactionRef.current = {
                x: 0,
                y: 0,
                active: false,
                strength: 0,
            }
        }
    }, [
        interactionRef,
    ])


    return (
        <Box
            ref={
                containerRef
            }
            sx={{
                position:
                    'absolute',

                inset:
                    0,

                width:
                    '100%',

                height:
                    '100%',

                pointerEvents:
                    'none',

                zIndex:
                    10,
            }}
        >
            {
                HOW_I_BUILD_STAGES.map(
                    (
                        stage,
                        index,
                    ) => (
                        <HowIBuildCircle
                            key={
                                stage.id
                            }

                            stage={
                                stage
                            }

                            visible={
                                index <
                                visibleCount
                            }

                            circleRef={
                                (
                                    element,
                                ) => {
                                    circleRefs
                                        .current[
                                            index
                                        ] =
                                        element
                                }
                            }

                            onClick={() => {
                                blowCircle(
                                    index,
                                )
                            }}
                        />
                    ),
                )
            }
        </Box>
    )
}