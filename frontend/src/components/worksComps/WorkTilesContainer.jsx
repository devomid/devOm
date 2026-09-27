import React, {
    useEffect,
    useRef,
    useState,
} from 'react'

import {
    Box,
} from '@mui/material'

import WorkTile from './cards/workTile'
import works from '../../db/works'

const clamp = (
    value,
    min = 0,
    max = 1,
) =>
    Math.max(
        min,
        Math.min(
            max,
            value,
        ),
    )

const smoothstep = (
    edge0,
    edge1,
    value,
) => {
    const t =
        clamp(
            (
                value -
                edge0
            ) /
            (
                edge1 -
                edge0
            ),
        )

    return (
        t *
        t *
        (
            3 -
            2 * t
        )
    )
}

const WorksTilesContainer = () => {
    const [
        progress,
        setProgress,
    ] = useState(0)

    const containerRef =
        useRef(null)

    useEffect(() => {
        const updateProgress = () => {
            const element =
                containerRef.current

            if (!element) {
                return
            }

            const rect =
                element.getBoundingClientRect()

            const total =
                element.offsetHeight -
                window.innerHeight

            if (total <= 0) {
                setProgress(0)
                return
            }

            const travelled =
                -rect.top

            setProgress(
                clamp(
                    travelled /
                    total,
                ),
            )
        }

        updateProgress()

        window.addEventListener(
            'scroll',
            updateProgress,
            {
                passive: true,
            },
        )

        window.addEventListener(
            'resize',
            updateProgress,
        )

        return () => {
            window.removeEventListener(
                'scroll',
                updateProgress,
            )

            window.removeEventListener(
                'resize',
                updateProgress,
            )
        }
    }, [])

    /*
     * ------------------------------------------------
     * ONE COMPLETE CARD CYCLE
     * ------------------------------------------------
     *
     * Every card gets one equal section of the
     * total Works scroll.
     *
     * Card 0:
     *
     * 0.00 → 0.20
     * card appears
     *
     * 0.20 → 0.40
     * nebula text → cloud → text
     *
     * Card 1:
     *
     * 0.40 → 0.60
     * cloud transition + card morph
     *
     * etc.
     *
     * The actual nebula phase is handled by
     * WorkNebulaText.
     * ------------------------------------------------
     */

    const cardCount =
        works.length

    const cycleLength =
        1 /
        Math.max(
            1,
            cardCount,
        )

    /*
     * Keep the first card visible after its
     * entrance and before the next card takes
     * over.
     */
    const getCardState = (
        index,
    ) => {
        const start =
            index *
            cycleLength

        const end =
            (
                index + 1
            ) *
            cycleLength

        const local =
            clamp(
                (
                    progress -
                    start
                ) /
                (
                    end -
                    start
                ),
            )

        const entrance =
            smoothstep(
                0,
                0.10,
                local,
            )

        const exit =
            1 -
            smoothstep(
                0.50,
                0.62,
                local,
            )

        return {
            opacity:
                entrance *
                exit,

            scale:
                0.92 +
                entrance *
                0.08,

            translateY:
                (
                    1 -
                    entrance
                ) *
                80,

            local,
        }
    }

    return (
        <Box
            ref={containerRef}
            sx={{
                position: 'relative',
                zIndex: 15,
                height: '600vh',
                pointerEvents: 'none',
            }}
        >
            <Box
                sx={{
                    position: 'sticky',
                    top: 0,
                    width: '100%',
                    height: '100vh',
                    overflow: 'hidden',
                }}
            >
                {works.map(
                    (
                        work,
                        index,
                    ) => {
                        const {
                            opacity,
                            scale,
                            translateY,
                            local,
                        } =
                            getCardState(
                                index,
                            )

                        return (
                            <WorkTile
                                key={
                                    work.id
                                }
                                work={
                                    work
                                }
                                index={
                                    index
                                }
                                progress={
                                    local
                                }
                                opacity={
                                    opacity
                                }
                                scale={
                                    scale
                                }
                                translateY={
                                    translateY
                                }
                            />
                        )
                    },
                )}
            </Box>
        </Box>
    )
}

export default WorksTilesContainer