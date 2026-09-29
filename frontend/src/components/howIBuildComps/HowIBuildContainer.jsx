import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'

import Box from '@mui/material/Box'

import HOW_I_BUILD_STAGES
    from '../../db/how'

import HowIBuildCircle
    from './cards/HowIBuildCircle'

import {
    HOW_I_BUILD_RING_COUNT,
    HOW_I_BUILD_RING_Y,
    getHowIBuildRingCenterX,
} from './howIBuildRingGeometry'


const REVEAL_DELAY =
    700

const BLOW_DURATION =
    180

const CAMERA_Z =
    10

const CAMERA_FOV =
    60


export default function HowIBuildContainer({
    interactionRef,
    ringReady,
}) {
    const containerRef =
        useRef(null)

    const blowTimerRef =
        useRef(null)

    const [
        visibleCount,
        setVisibleCount,
    ] = useState(0)

    const [
        containerSize,
        setContainerSize,
    ] = useState({
        width: 0,
        height: 0,
    })


    /*
     * ========================================================
     * CONTAINER SIZE
     * ========================================================
     */

    useEffect(() => {
        const container =
            containerRef.current

        if (!container) {
            return undefined
        }

        const updateSize =
            () => {
                const rect =
                    container.getBoundingClientRect()

                setContainerSize({
                    width:
                        rect.width,

                    height:
                        rect.height,
                })
            }

        updateSize()

        const observer =
            new ResizeObserver(
                updateSize,
            )

        observer.observe(
            container,
        )

        return () => {
            observer.disconnect()
        }
    }, [])


    /*
     * ========================================================
     * WORLD GEOMETRY
     * ========================================================
     */

    const worldGeometry =
        useMemo(() => {
            if (
                containerSize.width <= 0 ||
                containerSize.height <= 0
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
                    containerSize.width /
                    containerSize.height
                )

            return {
                worldHeight,
                worldWidth,
            }
        }, [
            containerSize.width,
            containerSize.height,
        ])


    /*
     * ========================================================
     * RING POSITIONS
     *
     * IMPORTANT:
     *
     * These are projected directly from the exact same
     * world coordinates used by the nebula ring texture.
     * ========================================================
     */

    const ringPositions =
        useMemo(() => {
            if (!worldGeometry) {
                return []
            }

            return HOW_I_BUILD_STAGES.map(
                (
                    stage,
                    index,
                ) => {
                    const worldX =
                        getHowIBuildRingCenterX(
                            index,
                        )

                    const x =
                        (
                            0.5 +
                            worldX /
                            worldGeometry.worldWidth
                        ) *
                        containerSize.width

                    const y =
                        (
                            0.5 -
                            HOW_I_BUILD_RING_Y /
                            worldGeometry.worldHeight
                        ) *
                        containerSize.height

                    return {
                        x,
                        y,
                    }
                },
            )
        }, [
            worldGeometry,
            containerSize.width,
            containerSize.height,
        ])


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
                    ringPositions[
                    index
                    ]

                if (
                    !position ||
                    !interactionRef
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
                ringPositions,
                interactionRef,
            ],
        )


    /*
     * ========================================================
     * REVEAL
     * ========================================================
     */

    useEffect(() => {
        if (
            !ringReady ||
            ringPositions.length !==
            HOW_I_BUILD_RING_COUNT
        ) {
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
        ringPositions.length,
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

            className="how-i-build-nebula-container"

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
                    ) => {
                        const position =
                            ringPositions[
                            index
                            ]

                        return (
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

                                left={
                                    position
                                        ? position.x
                                        : 0
                                }

                                top={
                                    position
                                        ? position.y
                                        : 0
                                }

                                onClick={() => {
                                    blowCircle(
                                        index,
                                    )
                                }}
                            />
                        )
                    },
                )
            }
        </Box>
    )
}