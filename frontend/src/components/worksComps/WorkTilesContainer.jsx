import React from 'react'

import {
    Box,
} from '@mui/material'

import WorkTile from './cards/workTile'
import works from '../../db/works'

const clamp = (
    value,
    min = 0,
    max = 1,
) => Math.min(
    max,
    Math.max(
        min,
        value,
    ),
)

const WorksTilesContainer = ({
    progress,
}) => {
    const cardCount = works.length

    const cycleLength =
        1 / cardCount

    /*
     * Nebula cloud peaks happen at:
     *
     * 0.1
     * 0.3
     * 0.5
     * 0.7
     * 0.9
     */

    const cyclePosition =
        progress / cycleLength

    const activeIndex = clamp(
        Math.floor(
            cyclePosition + 0.5,
        ) - 1,
        0,
        cardCount - 1,
    )

    const firstCardVisible =
        progress >=
        cycleLength * 0.5

    const activeWork =
        works[activeIndex]

    return (
        <Box
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
                    key={activeWork.id}
                    work={activeWork}
                    index={activeIndex}
                    progress={progress}
                    opacity={
                        firstCardVisible
                            ? 1
                            : 0
                    }
                    scale={1}
                    translateY={0}
                />
            </Box>
        </Box>
    )
}

export default WorksTilesContainer