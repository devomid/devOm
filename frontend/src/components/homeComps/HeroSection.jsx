import { Box, Typography } from '@mui/material'
import {
    colors,
    typography,
    spacing,
    radius,
    shadows,
    glass,
    layout,
} from '../../design'

const HeroSection = () => {
    return (
        <Box
            sx={{
                minHeight: '100svh',
                color: colors.text.primary,
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    maxWidth: layout.container.maxWidth,
                    mx: 'auto',
                    px: {
                        xs: spacing.container.horizontal,
                        md: layout.container.paddingTablet,
                        lg: layout.container.paddingDesktop,
                    },
                }}
            >
                <Box
                    sx={{
                        minHeight: layout.hero.minHeight,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        py: spacing.section.lg,
                    }}
                >
                    <Box
                        sx={{
                            ...glass.medium,
                            borderRadius: radius.xxl,
                            boxShadow: shadows.glass,
                            p: {
                                xs: spacing.xl,
                                md: spacing.xxxl,
                            },
                            maxWidth: '900px',
                        }}
                    >
                        <Typography
                            component="h1"
                            sx={{
                                ...typography.display.hero,
                                color: colors.text.primary,
                                mb: spacing.xl,
                            }}
                        >
                            Hero Section
                        </Typography>

                        <Typography
                            sx={{
                                ...typography.body.lg,
                                color: colors.text.secondary,
                                maxWidth: '680px',
                                mx: 'auto',
                            }}
                        >
                            Independent developer building thoughtful digital products.
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}

export default HeroSection