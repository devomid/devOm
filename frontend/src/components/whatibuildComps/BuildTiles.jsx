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
        const handleScroll = () => {
            const scrollable =
                document.documentElement.scrollHeight -
                window.innerHeight

            if (scrollable <= 0) {
                setProgress(0)
                return
            }

            setProgress(
                Math.min(
                    1,
                    Math.max(
                        0,
                        window.scrollY /
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

                /*
                 * Keep the center grid position
                 * empty until the final tile
                 * assigned to this row arrives.
                 */
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

                /*
                 * The last tile of the row
                 * always receives the center.
                 */
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
        }
    }, [viewport])

    /*
     * This is the temporary staging position.
     * It is NOT a grid position.
     */
    const stagingX =
        viewport.width / 2 -
        TILE_SIZE / 2

    const stagingY =
        NAVBAR_HEIGHT +
        GRID_MARGIN_TOP

    /*
     * Every tile enters from bottom-center.
     */
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

        /*
         * Phase 1:
         * bottom-center -> top-center staging.
         */
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
                x: stagingX,
                y:
                    entranceY +
                    (
                        stagingY -
                        entranceY
                    ) *
                    smoothEntrance,
            }
        }

        /*
         * Phase 2:
         * top-center staging -> final grid position.
         */
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
                stagingX
            )

        const curveStrength =
            Math.min(
                120,
                horizontalDistance *
                0.35
            )

        const x =
            stagingX +
            (
                target.x -
                stagingX
            ) *
            smoothMove

        const baseY =
            stagingY +
            (
                target.y -
                stagingY
            ) *
            smoothMove

        const curve =
            Math.sin(
                Math.PI *
                smoothMove
            ) *
            curveStrength *
            direction

        const y =
            baseY +
            curve

        return {
            x,
            y,
        }
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
    )
}

export default BuildTiles