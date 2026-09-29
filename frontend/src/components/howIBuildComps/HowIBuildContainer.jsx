import {
    useCallback,
    useEffect,
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

const RING_Y =
    -2.05

const RING_SPACING =
    1.95

const RING_COUNT =
    6

const CAMERA_Z =
    10

const CAMERA_FOV =
    60


export default function HowIBuildContainer({
    interactionRef,
    ringReady,
}) {
    const blowTimerRef =
        useRef(null)

    const [
        visibleCount,
        setVisibleCount,
    ] = useState(0)


    /*
     * ========================================================
     * PARTICLE RING -> SCREEN POSITION
     * ========================================================
     *
     * This is ONLY used for the particle blow.
     *
     * The DOM circles themselves are positioned by CSS.
     */

    const getRingScreenPosition =
        useCallback(
            (
                index,
            ) => {
                const width =
                    window.innerWidth

                const height =
                    window.innerHeight

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

                return {
                    x:
                        (
                            0.5 +
                            worldX /
                            worldWidth
                        ) *
                        width,

                    y:
                        (
                            0.5 -
                            RING_Y /
                            worldHeight
                        ) *
                        height,
                }
            },
            [],
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
                    getRingScreenPosition(
                        index,
                    )

                if (
                    !position
                ) {
                    return
                }

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
                getRingScreenPosition,
                interactionRef,
            ],
        )


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
                            setVisibleCount(
                                index + 1,
                            )

                            /*
                             * Blow the matching particle
                             * ring when the DOM circle appears.
                             */

                            window.requestAnimationFrame(
                                () => {
                                    blowCircle(
                                        index,
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

                display:
                    'flex',

                flexDirection:
                    'column',

                alignItems:
                    'center',

                /*
                 * The nebula text occupies the upper part
                 * of the page. Put the six DOM circles below it.
                 */

                justifyContent:
                    'flex-start',

                paddingTop:
                    '42vh',

                boxSizing:
                    'border-box',
            }}
        >
            <Box
                sx={{
                    width:
                        '100%',

                    display:
                        'grid',

                    gridTemplateColumns:
                        'repeat(6, 1fr)',

                    alignItems:
                        'center',

                    justifyItems:
                        'center',

                    pointerEvents:
                        'none',

                    padding:
                        '0 4vw',

                    boxSizing:
                        'border-box',
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
        </Box>
    )
}