import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'

import HOW_I_BUILD_STAGES
    from '../../db/how'

import HowIBuildCircle
    from './cards/HowIBuildCircle'

const REVEAL_DELAY =
    400

const BLOW_DURATION =
    180

export default function HowIBuildContainer({
    interactionRef,
}) {
    const containerRef =
        useRef(null)

const stageRefs =
    useRef([])

const blowTimerRefs =
    useRef([])

const [
    visibleStages,
    setVisibleStages,
] = useState(() => [])

const [
    activeStage,
    setActiveStage,
] = useState(null)


/*
 * --------------------------------------------------------
 * TRIGGER PARTICLE BLOW
 * --------------------------------------------------------
 *
 * The coordinates are calculated from the actual DOM
 * position of the circle.
 *
 * This means the interaction stays aligned with the
 * particle ring even after resize.
 */
const triggerBlow = useCallback(
    (stageIndex) => {
        const container =
            containerRef.current

        const element =
            stageRefs.current[
                stageIndex
            ]

        if (
            !container ||
            !element ||
            !interactionRef
        ) {
            return
        }

        const containerRect =
            container.getBoundingClientRect()

        const elementRect =
            element.getBoundingClientRect()

        const x =
            elementRect.left -
            containerRect.left +
            elementRect.width /
                2

        const y =
            elementRect.top -
            containerRect.top +
            elementRect.height /
                2

        interactionRef.current = {
            x,
            y,
            active: true,
            strength: 1,
        }

        if (
            blowTimerRefs.current[
                stageIndex
            ]
        ) {
            window.clearTimeout(
                blowTimerRefs.current[
                    stageIndex
                ],
            )
        }

        blowTimerRefs.current[
            stageIndex
        ] =
            window.setTimeout(
                () => {
                    if (
                        !interactionRef.current
                    ) {
                        return
                    }

                    interactionRef.current = {
                        x,
                        y,
                        active: false,
                        strength: 0,
                    }
                },
                BLOW_DURATION,
            )
    },
    [
        interactionRef,
    ],
)


/*
 * --------------------------------------------------------
 * REVEAL STAGES
 * --------------------------------------------------------
 *
 * One component appears every 400ms.
 *
 * After the component becomes visible, the particle blow
 * is triggered against its ring.
 */
useEffect(() => {
    const timers = []

    HOW_I_BUILD_STAGES.forEach(
        (
            stage,
            index,
        ) => {
            const timer =
                window.setTimeout(
                    () => {
                        setVisibleStages(
                            (
                                current,
                            ) => [
                                ...current,
                                stage.id,
                            ],
                        )

                        /*
                         * Wait until React has painted
                         * the component so its DOM position
                         * can be measured.
                         */
                        window.requestAnimationFrame(
                            () => {
                                triggerBlow(
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
            (timer) => {
                window.clearTimeout(
                    timer,
                )
            },
        )

        blowTimerRefs.current.forEach(
            (timer) => {
                if (timer) {
                    window.clearTimeout(
                        timer,
                    )
                }
            },
        )
    }
}, [
    triggerBlow,
])


/*
 * --------------------------------------------------------
 * POINTER INTERACTION
 * --------------------------------------------------------
 */
const handlePointerDown =
    useCallback(
        (
            index,
        ) => {
            triggerBlow(
                index,
            )
        },
        [
            triggerBlow,
        ],
    )


/*
 * --------------------------------------------------------
 * CLEANUP
 * --------------------------------------------------------
 */
useEffect(() => {
    return () => {
        if (
            interactionRef?.current
        ) {
            interactionRef.current = {
                x: 0,
                y: 0,
                active: false,
                strength: 0,
            }
        }
    }
}, [
    interactionRef,
])


return (
    <div
        ref={
            containerRef
        }
        className="how-i-build-container"
    >
        <div
            className="how-i-build-stages"
        >
            {
                HOW_I_BUILD_STAGES.map(
                    (
                        stage,
                        index,
                    ) => {
                        const visible =
                            visibleStages.includes(
                                stage.id,
                            )

                        const active =
                            activeStage ===
                            stage.id

                        return (
                            <HowIBuildCircle
                                key={
                                    stage.id
                                }
                                ref={
                                    (
                                        element,
                                    ) => {
                                        stageRefs.current[
                                            index
                                        ] =
                                            element
                                    }
                                }
                                stage={
                                    stage
                                }
                                visible={
                                    visible
                                }
                                active={
                                    active
                                }
                                onPointerEnter={
                                    () =>
                                        setActiveStage(
                                            stage.id,
                                        )
                                }
                                onPointerLeave={
                                    () =>
                                        setActiveStage(
                                            null,
                                        )
                                }
                                onFocus={
                                    () =>
                                        setActiveStage(
                                            stage.id,
                                        )
                                }
                                onBlur={
                                    () =>
                                        setActiveStage(
                                            null,
                                        )
                                }
                                onPointerDown={
                                    () =>
                                        handlePointerDown(
                                            index,
                                        )
                                }
                            />
                        )
                    },
                )
            }
        </div>
    </div>
)

}
