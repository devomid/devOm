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

/*
 * ----------------------------------------------------
 * WORK / CLOUD TIMING
 * ----------------------------------------------------
 *
 * Local progress inside one work cycle.
 *
 * 0.00 → text
 * 0.50 → cloud peak
 * 0.53 → card handoff
 * 1.00 → next cycle
 * ----------------------------------------------------
 */

const CARD_SWITCH_PROGRESS = 0.53

const WorksTilesContainer = ({
    progress,
    onCardLayout,
}) => {
    const cardCount =
        works.length

    const cycleLength =
        1 /
        cardCount

    const cyclePosition =
        progress /
        cycleLength

    /*
     * The card changes only when the current cloud
     * has passed its peak.
     */
    const activeIndex =
        clamp(
            Math.floor(
                cyclePosition +
                (
                    1 -
                    CARD_SWITCH_PROGRESS
                ),
            ) - 1,
            0,
            cardCount - 1,
        )

    /*
     * The first card should not appear until the first
     * cloud reaches its handoff point.
     */
    const firstCardVisible =
        progress >=
        cycleLength *
        CARD_SWITCH_PROGRESS

    const activeWork =
        works[
        activeIndex
        ]

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
                    onCardLayout={
                        onCardLayout
                    }
                />
            </Box>
        </Box>
    )
}

export default WorksTilesContainer