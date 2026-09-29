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


const CARD_START_Z =
    -18

const CARD_END_Z =
    -3

const CARD_START_SCALE =
    0

const CARD_OVERSHOOT_SCALE =
    1.14

const CARD_END_SCALE =
    1

const CARD_ENTRANCE_DURATION =
    1100


const getExplosiveScale =
    (
        progress,
    ) => {
        if (
            progress <
            0.72
        ) {
            const t =
                progress /
                0.72

            const eased =
                1 -
                Math.pow(
                    1 - t,
                    3,
                )

            return (
                CARD_START_SCALE +
                (
                    CARD_OVERSHOOT_SCALE -
                    CARD_START_SCALE
                ) *
                eased
            )
        }

        const t =
            (
                progress -
                0.72
            ) /
            0.28

        const eased =
            1 -
            Math.pow(
                1 - t,
                2,
            )

        return (
            CARD_OVERSHOOT_SCALE -
            (
                CARD_OVERSHOOT_SCALE -
                CARD_END_SCALE
            ) *
            eased
        )
    }


export default function HowIBuildContainer({
    interactionRef,
    ringReady,
}) {
    const containerRef =
        useRef(null)

    const blowTimerRef =
        useRef(null)

    const entranceFrameRefs =
        useRef({})

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


    const animateCardEntrance =
        useCallback(
            (
                element,
            ) => {
                if (!element) {
                    return
                }

                const index =
                    element.dataset
                        .howIBuildCardIndex

                const previousFrame =
                    entranceFrameRefs
                        .current[
                    index
                    ]

                if (
                    previousFrame
                ) {
                    window.cancelAnimationFrame(
                        previousFrame,
                    )
                }

                const startTime =
                    performance.now()


                const animate =
                    (
                        now,
                    ) => {
                        const elapsed =
                            now -
                            startTime

                        const rawProgress =
                            Math.min(
                                1,
                                elapsed /
                                CARD_ENTRANCE_DURATION,
                            )


                        const z =
                            CARD_START_Z +
                            (
                                CARD_END_Z -
                                CARD_START_Z
                            ) *
                            (
                                1 -
                                Math.pow(
                                    1 -
                                    rawProgress,
                                    3,
                                )
                            )


                        const scale =
                            getExplosiveScale(
                                rawProgress,
                            )


                        element.style.transform =
                            `
                                translate3d(
                                    -50%,
                                    -50%,
                                    ${z}px
                                )
                                scale(
                                    ${scale}
                                )
                            `


                        if (
                            rawProgress <
                            1
                        ) {
                            entranceFrameRefs
                                .current[
                                index
                            ] =
                                window.requestAnimationFrame(
                                    animate,
                                )
                        } else {
                            entranceFrameRefs
                                .current[
                                index
                            ] =
                                null

                            element.style.transform =
                                `
                                    translate3d(
                                        -50%,
                                        -50%,
                                        ${CARD_END_Z}px
                                    )
                                    scale(
                                        ${CARD_END_SCALE}
                                    )
                                `
                        }
                    }


                entranceFrameRefs
                    .current[
                    index
                ] =
                    window.requestAnimationFrame(
                        animate,
                    )
            },
            [],
        )


    useEffect(() => {
        if (
            !ringReady ||
            ringPositions.length !==
            HOW_I_BUILD_RING_COUNT
        ) {
            setVisibleCount(
                0,
            )

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
                                    const card =
                                        document.querySelector(
                                            `[data-how-i-build-card-index="${index}"]`,
                                        )

                                    if (
                                        card
                                    ) {
                                        animateCardEntrance(
                                            card,
                                        )
                                    }


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


            Object.values(
                entranceFrameRefs.current,
            ).forEach(
                (
                    frame,
                ) => {
                    if (
                        frame
                    ) {
                        window.cancelAnimationFrame(
                            frame,
                        )
                    }
                },
            )


            entranceFrameRefs.current =
                {}


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
        animateCardEntrance,
    ])


    useEffect(() => {
        return () => {
            if (
                blowTimerRef.current
            ) {
                window.clearTimeout(
                    blowTimerRef.current,
                )
            }


            Object.values(
                entranceFrameRefs.current,
            ).forEach(
                (
                    frame,
                ) => {
                    if (
                        frame
                    ) {
                        window.cancelAnimationFrame(
                            frame,
                        )
                    }
                },
            )


            entranceFrameRefs.current =
                {}


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
            ref={containerRef}
            className="how-i-build-nebula-container"
            sx={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',

                zIndex: 1,

                pointerEvents: 'none',

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
                            <Box
                                key={
                                    stage.id
                                }

                                data-how-i-build-card-index={
                                    index
                                }

                                sx={{
                                    position:
                                        'absolute',

                                    left:
                                        position
                                            ? position.x
                                            : 0,

                                    top:
                                        position
                                            ? position.y
                                            : 0,

                                    width:
                                        'fit-content',

                                    height:
                                        'fit-content',

                                    pointerEvents:
                                        'none',

                                    transform:
                                        `
                                            translate3d(
                                                -50%,
                                                -50%,
                                                ${CARD_START_Z}px
                                            )
                                            scale(
                                                ${CARD_START_SCALE}
                                            )
                                        `,

                                    transformOrigin:
                                        'center center',

                                    transformStyle:
                                        'preserve-3d',

                                    zIndex:
                                        0,
                                }}
                            >
                                <HowIBuildCircle
                                    stage={
                                        stage
                                    }

                                    visible={
                                        index <
                                        visibleCount
                                    }

                                    left={
                                        0
                                    }

                                    top={
                                        0
                                    }

                                    onClick={() => {
                                        blowCircle(
                                            index,
                                        )
                                    }}
                                />
                            </Box>
                        )
                    },
                )
            }
        </Box>
    )
}