import React, { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'
import BuildTile from './cards/BuildTile'
import builds from '../../db/builds'

const TILE_SIZE = 220
const GRID_GAP = 24

const GRID_MARGIN_LEFT = 72
const GRID_MARGIN_RIGHT = 24

const NAVBAR_HEIGHT = 80
const GRID_MARGIN_TOP = 24
const GRID_MARGIN_BOTTOM = 24

const TILE_DURATION = 1 / builds.length

const BuildTiles = () => {
    const [progress, setProgress] = useState(0)
    const [viewport, setViewport] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    })

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
                Math.max(
                    0,
                    window.scrollY / scrollable
                )
            )

            setProgress(nextProgress)
        }

        const handleResize = () => {
            setViewport({
                width: window.innerWidth,
                height: window.innerHeight,
            })
        }

        window.addEventListener(
            'scroll',
            handleScroll,
            { passive: true }
        )

        window.addEventListener(
            'resize',
            handleResize
        )

        handleScroll()

        return () => {
            window.removeEventListener(
                'scroll',
                handleScroll
            )

            window.removeEventListener(
                'resize',
                handleResize
            )
        }
    }, [])

    const usableWidth =
        viewport.width -
        GRID_MARGIN_LEFT -
        GRID_MARGIN_RIGHT

    const usableHeight =
        viewport.height -
        NAVBAR_HEIGHT -
        GRID_MARGIN_TOP -
        GRID_MARGIN_BOTTOM

    const columns = Math.max(
        1,
        Math.floor(
            (usableWidth + GRID_GAP) /
            (TILE_SIZE + GRID_GAP)
        )
    )

    const rows = Math.ceil(
        builds.length / columns
    )

    const getGridPosition = (index) => {
        const column =
            index % columns

        const row =
            Math.floor(index / columns)

        const x =
            GRID_MARGIN_LEFT +
            column *
            (TILE_SIZE + GRID_GAP)

        const rowHeight =
            rows <= 1
                ? 0
                : (
                    usableHeight -
                    TILE_SIZE
                ) /
                (rows - 1)

        const y =
            NAVBAR_HEIGHT +
            GRID_MARGIN_TOP +
            row * rowHeight

        return { x, y }
    }

    const entranceX =
        viewport.width / 2 -
        TILE_SIZE / 2

    const entranceY =
        viewport.height + TILE_SIZE

    const getTilePosition = (index) => {
        const start =
            index * TILE_DURATION

        const localProgress =
            Math.min(
                Math.max(
                    (progress - start) /
                    TILE_DURATION,
                    0
                ),
                1
            )

        /*
         * Phase 1:
         * straight upward entrance.
         */
        const entranceProgress =
            Math.min(
                localProgress / 0.65,
                1
            )

        /*
         * Phase 2:
         * horizontal movement into
         * the assigned grid cell.
         */
        const lateralProgress =
            localProgress <= 0.65
                ? 0
                : Math.min(
                    (
                        localProgress - 0.65
                    ) / 0.35,
                    1
                )

        const {
            x: gridX,
            y: gridY,
        } = getGridPosition(index)

        const direction =
            directionsRef.current[index]

        const decisionX =
            gridX +
            direction *
            (TILE_SIZE + GRID_GAP)

        const entranceYPosition =
            entranceY +
            (
                gridY -
                entranceY
            ) *
            entranceProgress

        const x =
            localProgress <= 0.65
                ? entranceX
                : decisionX +
                (
                    gridX -
                    decisionX
                ) *
                lateralProgress

        const y =
            entranceYPosition

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
            {builds.map(
                (build, index) => {
                    const {
                        x,
                        y,
                    } = getTilePosition(
                        index
                    )

                    return (
                        <BuildTile
                            key={build.id}
                            x={x}
                            y={y}
                            size={TILE_SIZE}
                            build={build}
                        />
                    )
                }
            )}
        </Box>
    )
}

export default BuildTiles