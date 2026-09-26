import React from 'react'
import { Box } from '@mui/material'
import { colors, typography, spacing, radius, glass, layout, } from '../../../design'
import { Smartphone, Globe, Server, SquareDashedMousePointer, MapPinned, Cpu, } from 'lucide-react'

const BuildTile = ({ x, y, size, build }) => {

    const Icon = build.icon

    return (
        <Box
            sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: radius.xxl,
                background: glass.floating.background,
                backdropFilter: glass.floating.backdropFilter,
                boxShadow: glass.floating.shadow,
                border: glass.floating.border,
                pointerEvents: 'auto',
                transform: `translate(${x}px, ${y}px)`,
                padding: spacing.lg
            }}
        >
            <Box>
                <Icon />
            </Box>
        </Box>
    )
}

export default BuildTile