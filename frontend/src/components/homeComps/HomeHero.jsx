import {
    Box,
    Typography,
} from '@mui/material'

import {
    motion,
} from 'framer-motion'

import {
    colors,
} from '../../design'


const MotionTypography =
    motion(Typography)


const HomeHero = ({
    identityVisible = false,
    identityPositioned = false,
}) => {
    return (
        <Box
            sx={{
                position:
                    'absolute',

                inset:
                    0,

                width:
                    '100%',

                height:
                    '100%',

                pointerEvents:
                    'none',

                zIndex:
                    5,
            }}
        >
            <MotionTypography
                initial={{
                    opacity: 0,
                    x: 0,
                    y: 0,
                    scale: 1,
                }}

                animate={{
                    opacity:
                        identityVisible
                            ? 1
                            : 0,

                    x:
                        identityPositioned
                            ? '-37vw'
                            : 0,

                    y:
                        identityPositioned
                            ? '-31vh'
                            : 0,

                    scale:
                        identityPositioned
                            ? 0.48
                            : 1,
                }}

                transition={{
                    duration:
                        0.85,

                    ease:
                        [0.16, 1, 0.3, 1],
                }}

                sx={{
                    position:
                        'absolute',

                    left:
                        '50%',

                    top:
                        '50%',

                    margin:
                        0,

                    padding:
                        0,

                    transform:
                        'translate(-50%, -50%)',

                    fontFamily:
                        '"Neue Montreal", "Helvetica Neue", Arial, sans-serif',

                    fontSize:
                        'clamp(4.5rem, 9vw, 9rem)',

                    fontWeight:
                        700,

                    lineHeight:
                        0.95,

                    letterSpacing:
                        '-0.055em',

                    color:
                        colors.text.primary,

                    whiteSpace:
                        'nowrap',

                    transformOrigin:
                        'center center',
                }}
            >
                devOm
            </MotionTypography>
        </Box>
    )
}

export default HomeHero
