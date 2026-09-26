import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box } from '@mui/material'
import BuildTile from './cards/BuildTile'
import builds from '../../db/builds'

const TILE_SIZE = 220
const GRID_GAP = 24

const GRID_MARGIN_LEFT = 72
const GRID_MARGIN_RIGHT = 24

const NAVBAR_HEIGHT = 80
const GRID_MARGIN_TOP = 24

const ENTRANCE_PHASE = 0.6

const easeInOutSine = (value) => {
    return -(Math.cos(Math.PI * value) - 1) / 2
}

const shuffle = (array) => {
    const result = [...array]

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(
            Math.random() * (i + 1)
        )

            ;[result[i], result[j]] =
                [result[j], result[i]]
    }

    return result
}

const BuildTiles = () => {
    const scrollRef = useRef(null)

    const [progress, setProgress] = useState(0)

    const [viewport, setViewport] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    })

    const directionsRef = useRef(
        builds.map(() =>
            Math.random() < 0.5
                ? -1
                : 1
        )
    )

    const gridOrderRef = useRef(null)

    useEffect(() => {
        const scrollElement =
            scrollRef.current

        if (!scrollElement) {
            return
        }

        const handleScroll = () => {
            const scrollable =
                scrollElement.scrollHeight -
                scrollElement.clientHeight

            if (scrollable <= 0) {
                setProgress(0)
                return
            }

            setProgress(
                Math.min(
                    1,
                    Math.max(
                        0,
                        scrollElement.scrollTop /
                        scrollable
                    )
                )
            )
        }

        const handleResize = () => {
            setViewport({
                width: window.innerWidth,
                height: window.innerHeight,
            })
        }

        scrollElement.addEventListener(
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
            scrollElement.removeEventListener(
                'scroll',
                handleScroll
            )

            window.removeEventListener(
                'resize',
                handleResize
            )
        }
    }, [])

    const grid = useMemo(() => {
        const availableWidth =
            viewport.width -
            GRID_MARGIN_LEFT -
            GRID_MARGIN_RIGHT

        const columns = Math.max(
            1,
            Math.floor(
                (
                    availableWidth +
                    GRID_GAP
                ) /
                (
                    TILE_SIZE +
                    GRID_GAP
                )
            )
        )

        const rows = Math.ceil(
            builds.length / columns
        )

        if (
            !gridOrderRef.current ||
            gridOrderRef.current.columns !==
            columns
        ) {
            const orders = []

            for (
                let row = 0;
                row < rows;
                row++
            ) {
                const rowStart =
                    row * columns

                const count =
                    Math.min(
                        columns,
                        builds.length -
                        rowStart
                    )

                const centerColumn =
                    Math.floor(count / 2)

                const randomColumns =
                    shuffle(
                        Array.from(
                            {
                                length: count,
                            },
                            (_, index) =>
                                index
                        ).filter(
                            (column) =>
                                column !==
                                centerColumn
                        )
                    )

                const order = [
                    ...randomColumns,
                    centerColumn,
                ]

                orders.push(order)
            }

            gridOrderRef.current = {
                columns,
                orders,
            }
        }

        const positions = []

        for (
            let row = 0;
            row < rows;
            row++
        ) {
            const rowStart =
                row * columns

            const count =
                Math.min(
                    columns,
                    builds.length -
                    rowStart
                )

            const rowWidth =
                count * TILE_SIZE +
                (count - 1) *
                GRID_GAP

            const rowStartX =
                GRID_MARGIN_LEFT +
                (
                    availableWidth -
                    rowWidth
                ) / 2

            const rowY =
                NAVBAR_HEIGHT +
                GRID_MARGIN_TOP +
                row *
                (
                    TILE_SIZE +
                    GRID_GAP
                )

            const order =
                gridOrderRef.current
                    .orders[row]

            for (
                let position = 0;
                position < count;
                position++
            ) {
                const buildIndex =
                    rowStart +
                    position

                const column =
                    order[position]

                positions[buildIndex] = {
                    x:
                        rowStartX +
                        column *
                        (
                            TILE_SIZE +
                            GRID_GAP
                        ),
                    y: rowY,
                }
            }
        }

        return {
            positions,
            columns,
            rows,
        }
    }, [viewport])

    const getRowStagingPosition = (row) => {
        return {
            x:
                viewport.width / 2 -
                TILE_SIZE / 2,

            y:
                NAVBAR_HEIGHT +
                GRID_MARGIN_TOP +
                row *
                (
                    TILE_SIZE +
                    GRID_GAP
                ),
        }
    }

    const entranceX =
        viewport.width / 2 -
        TILE_SIZE / 2

    const entranceY =
        viewport.height +
        TILE_SIZE

    const getTilePosition = (index) => {
        const tileDuration =
            1 / builds.length

        const start =
            index *
            tileDuration

        const localProgress =
            Math.min(
                1,
                Math.max(
                    0,
                    (
                        progress -
                        start
                    ) /
                    tileDuration
                )
            )

        const target =
            grid.positions[index]

        const row =
            Math.floor(
                index /
                grid.columns
            )

        const staging =
            getRowStagingPosition(
                row
            )

        const entranceProgress =
            Math.min(
                localProgress /
                ENTRANCE_PHASE,
                1
            )

        const smoothEntrance =
            easeInOutSine(
                entranceProgress
            )

        if (
            localProgress <=
            ENTRANCE_PHASE
        ) {
            return {
                x: entranceX,
                y:
                    entranceY +
                    (
                        staging.y -
                        entranceY
                    ) *
                    smoothEntrance,
            }
        }

        const moveProgress =
            Math.min(
                (
                    localProgress -
                    ENTRANCE_PHASE
                ) /
                (
                    1 -
                    ENTRANCE_PHASE
                ),
                1
            )

        const smoothMove =
            easeInOutSine(
                moveProgress
            )

        const direction =
            directionsRef.current[index]

        const horizontalDistance =
            Math.abs(
                target.x -
                staging.x
            )

        const curveStrength =
            Math.min(
                28,
                horizontalDistance *
                0.08
            )

        const x =
            staging.x +
            (
                target.x -
                staging.x
            ) *
            smoothMove +
            (
                Math.sin(
                    Math.PI *
                    smoothMove
                ) *
                curveStrength *
                direction
            )

        const y =
            staging.y +
            (
                target.y -
                staging.y
            ) *
            smoothMove

        return {
            x,
            y,
        }
    }

    /*
     * One viewport of scroll distance is
     * reserved for each row.
     *
     * The extra viewport guarantees that
     * even a single row has a finite scroll
     * range and can complete its animation.
     */
    const scrollHeight =
        (
            grid.rows + 1
        ) *
        viewport.height

    return (
        <Box
            ref={scrollRef}
            sx={{
                position: 'absolute',
                inset: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                overscrollBehavior: 'contain',
                scrollbarWidth: 'none',
                
                '&::-webkit-scrollbar': {
                    display: 'none',
                },
            }}
            >
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    height: `${scrollHeight}px`,
                }}
                >
                <Box
                    sx={{
                        position: 'sticky',
                        top: 0,
                        width: '100%',
                        height: '100vh',
                        overflow: 'hidden',
                        pointerEvents: 'none',
                    }}
                >
                    {builds.map(
                        (build, index) => {
                            const {
                                x,
                                y,
                            } =
                                getTilePosition(
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
            </Box>
        </Box>
    )
}

export default BuildTiles