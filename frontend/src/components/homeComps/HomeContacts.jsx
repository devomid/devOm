import {
    Box,
    Button,
    Typography,
} from '@mui/material'

import {
    Link,
} from 'react-router-dom'

import {
    colors,
    glass,
    radius,
    shadows,
    typography,
} from '../../design'


const HomeContact = () => {
    return (
        <Box
            sx={{
                minHeight:
                    '100vh',

                width:
                    '100%',

                display:
                    'flex',

                alignItems:
                    'center',

                justifyContent:
                    'center',

                position:
                    'relative',

                px:
                {
                    xs: 2,
                    sm: 4,
                    md: 6,
                },

                py:
                    10,

                zIndex:
                    4,
            }}
        >
            <Box
                sx={{
                    width:
                        'min(900px, 100%)',

                    minHeight:
                    {
                        xs: '420px',
                        md: '500px',
                    },

                    display:
                        'flex',

                    flexDirection:
                        'column',

                    justifyContent:
                        'center',

                    alignItems:
                        'flex-start',

                    p:
                    {
                        xs: 4,
                        sm: 6,
                        md: 8,
                    },

                    borderRadius:
                        radius.xl,

                    border:
                        `1px solid ${colors.border.subtle}`,

                    background:
                        glass.surface,

                    boxShadow:
                        shadows.lg,

                    backdropFilter:
                        'blur(24px)',

                    WebkitBackdropFilter:
                        'blur(24px)',
                }}
            >
                <Typography
                    component="h2"
                    sx={{
                        margin:
                            0,

                        fontFamily:
                            '"Neue Montreal", "Helvetica Neue", Arial, sans-serif',

                        fontSize:
                            'clamp(2.75rem, 6vw, 6rem)',

                        fontWeight:
                            600,

                        lineHeight:
                            0.98,

                        letterSpacing:
                            '-0.05em',

                        color:
                            colors.text.primary,

                        maxWidth:
                            '760px',
                    }}
                >
                    Have Something Worth Building?
                </Typography>

                <Typography
                    component="p"
                    sx={{
                        margin:
                            0,

                        marginTop:
                            3,

                        fontFamily:
                            '"Neue Montreal", "Helvetica Neue", Arial, sans-serif',

                        fontSize:
                            'clamp(1.5rem, 3vw, 3rem)',

                        fontWeight:
                            400,

                        lineHeight:
                            1.15,

                        letterSpacing:
                            '-0.035em',

                        color:
                            colors.text.secondary,
                    }}
                >
                    Let's make it real.
                </Typography>

                <Button
                    component={Link}
                    to="/contacts"
                    variant="contained"
                    sx={{
                        marginTop:
                            5,

                        minHeight:
                            '52px',

                        px:
                            3.5,

                        borderRadius:
                            radius.pill,

                        fontFamily:
                            typography.fontFamily.sans,

                        fontWeight:
                            typography.weight.semibold,

                        fontSize:
                            '1rem',

                        backgroundColor:
                            colors.accent.primary,

                        color:
                            colors.text.inverse,

                        '&:hover': {
                            backgroundColor:
                                colors.accent.secondary,
                        },
                    }}
                >
                    Get in Touch
                </Button>
            </Box>
        </Box>
    )
}

export default HomeContact