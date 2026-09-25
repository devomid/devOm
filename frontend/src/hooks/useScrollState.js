import { useEffect, useRef } from 'react'

const clamp = (value, min = 0, max = 1) =>
    Math.min(
        max,
        Math.max(min, value),
    )

const useScrollState = (
    scrollProgress,
    enabled = true,
) => {
    const stateRef = useRef({
        progress: 0,
        previousProgress: 0,
        velocity: 0,
        direction: 0,
        isScrolling: false,
        lastChangeTime: 0,
    })

    const scrollStopTimerRef = useRef(null)

    useEffect(() => {
        if (!scrollProgress || !enabled) {
            return undefined
        }

        const state = stateRef.current

        const handleChange = (latest) => {
            const now = performance.now()

            const progress = clamp(
                Number.isFinite(latest)
                    ? latest
                    : 0,
            )

            const previous =
                state.progress

            const delta =
                progress - previous

            const deltaTime =
                Math.max(
                    now -
                    state.lastChangeTime,
                    1,
                )

            state.previousProgress =
                previous

            state.progress =
                progress

            state.velocity =
                delta / deltaTime

            state.direction =
                delta > 0
                    ? 1
                    : delta < 0
                        ? -1
                        : 0

            state.isScrolling = true
            state.lastChangeTime = now

            if (
                scrollStopTimerRef.current
            ) {
                clearTimeout(
                    scrollStopTimerRef.current,
                )
            }

            scrollStopTimerRef.current =
                window.setTimeout(() => {
                    state.isScrolling =
                        false

                    state.velocity = 0
                    state.direction = 0
                }, 90)
        }

        state.progress =
            clamp(
                scrollProgress.get(),
            )

        state.previousProgress =
            state.progress

        state.lastChangeTime =
            performance.now()

        const unsubscribe =
            scrollProgress.on(
                'change',
                handleChange,
            )

        return () => {
            unsubscribe()

            if (
                scrollStopTimerRef.current
            ) {
                clearTimeout(
                    scrollStopTimerRef.current,
                )
            }

            state.isScrolling = false
            state.velocity = 0
            state.direction = 0
        }
    }, [
        scrollProgress,
        enabled,
    ])

    return stateRef
}

export default useScrollState