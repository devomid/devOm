import React, { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'
import firstTile from './cards/1st'

const TILE_SIZE = 220
const GRID_GAP = 24
const GRID_PADDING = 48

const BuildTiles = () => {
    const [progress, setProgress] = useState(0)

    const directionRef = useRef(
        Math.random() < 0.5 ? -1 : 1
    )

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

    const topX =
        window.innerWidth / 2 - TILE_SIZE / 2

    const topY =
        GRID_PADDING

    const destinationX =
        topX +
        directionRef.current * (TILE_SIZE + GRID_GAP)

    const entranceProgress =
        Math.min(progress / 0.2, 1)

    const lateralProgress =
        progress <= 0.2
            ? 0
            : Math.min(
                (progress - 0.2) / 0.8,
                1
            )

    const x =
        progress <= 0.2
            ? entranceX
            : topX +
            (destinationX - topX) * lateralProgress

    const y =
        entranceY +
        (topY - entranceY) * entranceProgress

    return (
        <Box
            sx={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
            }}
        >
            <firstTile
                x={x}
                y={y}
                size={TILE_SIZE}
            />
        </Box>
    )
}

export default BuildTiles