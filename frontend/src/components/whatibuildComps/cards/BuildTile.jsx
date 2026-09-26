import React from 'react'
import { Box, Typography } from '@mui/material'
import { colors, typography, spacing, radius, glass, layout, } from '../../../design'
import { Smartphone, Globe, Server, SquareDashedMousePointer, MapPinned, Cpu, } from 'lucide-react'
const icons = { Smartphone, Globe, Server, SquareDashedMousePointer, MapPinned, Cpu, }

const BuildTile = ({ x, y, size, build }) => {

    const Icon = icons[build.icon]
    const projects = build.projects

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


            <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                
            }}>
                <Box
                    sx={{
                        marginLeft: spacing.md,
                        backgroundColor: colors.background.secondary + '9',
                        backdropFilter: glass.floating.backdropFilter,
                        width: '40px',
                        height: '40px',
                        borderRadius: spacing.md,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: spacing.md,
                    }}>
                    <Icon
                        size={21}
                        strokeWidth={1.3}
                    />
                </Box>
                <Typography sx={{
                    marginLeft: spacing.lg,
                    marginTop:spacing.sm,
                    fontSize: typography.size.md,
                    fontWeight: typography.weight.semibold
                }}>
                    {build.title}
                </Typography>
            </Box>

            <Box
                sx={{
                    display: 'inline-flex',
                    border: glass.floating.border,
                    borderRadius: radius.md,
                    width: 'fit-content',
                    padding: '6px 10px',
                    alignItems: 'center',
                    margin: 1,
                    boxShadow: glass.floating.shadow
                }}>
                <Typography sx={{
                    fontSize: typography.size.sm,
                    color: colors.text.muted
                }}>
                    {build.type}
                </Typography>
            </Box>

            <Box sx={{
                marginTop: 3
            }}>
                <Typography sx={{
                    fontSize: typography.size.xs,
                    color: colors.text.inverse + '80'
                }}>
                    {build.description}
                </Typography>
            </Box>
        </Box>
    )
}

export default BuildTile