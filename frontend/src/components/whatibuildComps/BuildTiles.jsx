import React, { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import BuildTile from './cards/1st'

const TILE_SIZE = 220
const GRID_GAP = 24
const GRID_PADDING = 48

const BuildTiles = () => {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const handleScroll = () => {
            const scrollable =
                document.documentElement.scrollHeight - window.innerHeight

            if (scrollable <= 0) {
                setProgress(0)
                return
            }

            const nextProgress = Math.min(
                1,
                Math.max(0, window.scrollY / scrollable)
            )

            setProgress(nextProgress)
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        handleScroll()

        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])

    const entranceX =
        window.innerWidth / 2 - TILE_SIZE / 2

    const entranceY =
        window.innerHeight + 40

    const gridX = GRID_PADDING
    const gridY = GRID_PADDING

    const entranceProgress = Math.min(progress / 0.2, 1)

    const movementProgress =
        progress <= 0.2
            ? 0
            : (progress - 0.2) / 0.8

    const x =
        entranceX +
        (gridX - entranceX) * movementProgress

    const y =
        entranceY +
        (gridY - entranceY) * entranceProgress

    return (
        <Box
            sx={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
            }}
        >
            <BuildTile
                x={x}
                y={y}
                size={TILE_SIZE}
            />
        </Box>
    )
}

export default BuildTiles