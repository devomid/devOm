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

    const cardCount =
        works.length

    const cycleLength =
        1 /
        Math.max(
            1,
            cardCount,
        )

    /*
     * The card is ALWAYS visible.
     *
     * The cloud is responsible for hiding
     * the card while we change from one work
     * to the next.
     *
     * We switch the card around the middle
     * of each cycle, where the cloud is at
     * its strongest.
     */

    const activeIndex =
        Math.min(
            cardCount - 1,
            Math.floor(
                progress /
                cycleLength,
            ),
        )

    const activeWork =
        works[
        activeIndex
        ]

    const cycleStart =
        activeIndex *
        cycleLength

    const local =
        clamp(
            (
                progress -
                cycleStart
            ) /
            cycleLength,
        )

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
                <WorkTile
                    key={
                        activeWork.id
                    }
                    work={
                        activeWork
                    }
                    index={
                        activeIndex
                    }
                    progress={
                        local
                    }
                    opacity={1}
                    scale={1}
                    translateY={0}
                />
            </Box>
        </Box>
    )
}

export default WorksTilesContainer