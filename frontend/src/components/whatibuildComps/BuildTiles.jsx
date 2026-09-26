import React, { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'
import BuildTile from './cards/BuildTile'
import builds from '../../db/builds'

const TILE_SIZE = 220
const GRID_GAP = 24
const GRID_PADDING = 48

const TILE_DURATION = 1 / builds.length

const BuildTiles = () => {
    const [progress, setProgress] = useState(0)

    const directionsRef = useRef(
        builds.map(() => Math.random() < 0.5 ? -1 : 1)
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

    const getTilePosition = (index) => {
        const start = index * TILE_DURATION
        const localProgress = Math.min(
            Math.max(
                (progress - start) / TILE_DURATION,
                0
            ),
            1
        )

        const entranceProgress =
            Math.min(localProgress / 0.2, 1)

        const lateralProgress =
            localProgress <= 0.2
                ? 0
                : Math.min(
                    (localProgress - 0.2) / 0.8,
                    1
                )

        const direction =
            directionsRef.current[index]

        const destinationX =
            topX +
            direction * (TILE_SIZE + GRID_GAP)

        const x =
            localProgress <= 0
                ? entranceX
                : topX +
                (destinationX - topX) * lateralProgress

        const y =
            entranceY +
            (topY - entranceY) * entranceProgress

        return { x, y }
    }

    return (
        <Box
            sx={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
            }}
        >
            {builds.map((build, index) => {
                const { x, y } = getTilePosition(index)

                return (
                    <BuildTile
                        key={build.id}
                        x={x}
                        y={y}
                        size={TILE_SIZE}
                        build={build}
                    />
                )
            })}
        </Box>
    )
}

export default BuildTiles