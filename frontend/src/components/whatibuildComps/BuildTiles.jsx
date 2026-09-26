import React, { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import BuildTile from './cards/1st'

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

    const startX = window.innerWidth / 2 - 90
    const startY = window.innerHeight - window.innerHeight * 0.08 - 180

    const entranceY = window.innerHeight + 40

    const endX = window.innerWidth * 0.08
    const endY = window.innerHeight * 0.08

    const entranceProgress = Math.min(progress / 0.2, 1)

    const movementProgress =
        progress <= 0.2
            ? 0
            : (progress - 0.2) / 0.8

    const currentX =
        startX + (endX - startX) * movementProgress

    const currentY =
        entranceY + (startY - entranceY) * entranceProgress

    const x =
        progress <= 0.2
            ? startX
            : currentX

    const y =
        progress <= 0.2
            ? currentY
            : startY + (endY - startY) * movementProgress

    return (
        <Box
            sx={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
            }}
        >
            <BuildTile x={x} y={y} />
        </Box>
    )
}

export default BuildTiles