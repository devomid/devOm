import React, {useEffect, useRef} from 'react'

import {
    Box,
    Paper,
    Typography,
} from '@mui/material'

const WorkTile = ({
    work,
    index,
    progress,
    opacity = 1,
    scale = 1,
    translateY = 0,
}) => {
    const cardRef = useRef(null)

    return (
        <Box
            sx={{
                // backgroundColor:'green',
                position: 'absolute',
                inset: 0,

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                pointerEvents:
                    opacity > 0.05
                        ? 'auto'
                        : 'none',

                opacity,

                transform:
                    `translateY(${translateY}px) scale(${scale})`,

                // transition:
                //     'opacity 120ms linear, transform 120ms linear',

                px: {
                    xs: 2,
                    sm: 4,
                    md: 8,
                },
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    width: '80%',
                    // backgroundColor:'red'
                }}
            >
                {/* --------------------------------
                    MAIN PROJECT SURFACE
                --------------------------------- */}

                <Paper
                    ref={cardRef}
                    elevation={0}
                    sx={{
                        position: 'relative',

                        minHeight: {
                            xs: 310,
                            md: 370,
                        },

                        borderRadius: {
                            xs: 4,
                            md: 6,
                        },

                        overflow: 'hidden',

                        p: {
                            xs: 3,
                            md: 6,
                        },

                        // background:
                        //     'rgba(255, 11, 11, 0.98)',
                        background:
                            'rgba(255,255,255,0.055)',

                        backdropFilter:
                            'blur(22px)',

                        WebkitBackdropFilter:
                            'blur(22px)',

                        border:
                            '1px solid rgba(255,255,255,0.12)',

                        boxShadow:
                            '0 30px 100px rgba(0,0,0,0.35)',

                        color: '#fff',
                    }}
                >
                    <Typography
                        variant="overline"
                        sx={{
                            opacity: 0.55,
                            letterSpacing: 3,
                        }}
                    >
                        WORK {String(
                            index + 1,
                        ).padStart(
                            2,
                            '0',
                        )}
                    </Typography>

                    {/* <Typography
                        sx={{
                            mt: 2,

                            fontSize: {
                                xs: '2.5rem',
                                sm: '4rem',
                                md: '6rem',
                            },

                            fontWeight: 700,

                            lineHeight: 0.95,

                            letterSpacing:
                                '-0.05em',
                        }}
                    >
                        {work.title}
                    </Typography> */}

                    <Box
                        sx={{
                            position:
                                'absolute',

                            left: {
                                xs: 24,
                                md: 48,
                            },

                            right: {
                                xs: 24,
                                md: 48,
                            },

                            bottom: {
                                xs: 24,
                                md: 48,
                            },

                            display: 'flex',
                            justifyContent:
                                'space-between',
                            alignItems: 'flex-end',
                        }}
                    >
                        <Typography
                            sx={{
                                opacity: 0.5,
                                maxWidth: 420,
                            }}
                        >
                            {work.path}
                        </Typography>

                        <Typography
                            sx={{
                                opacity: 0.45,
                                fontSize:
                                    '0.8rem',
                            }}
                        >
                            {index + 1}
                            {' / '}
                            {5}
                        </Typography>
                    </Box>
                </Paper>

                {/* --------------------------------
                    FLOATING GLASS CARD
                --------------------------------- */}

                <Paper
                    elevation={0}
                    sx={{
                        position:
                            'absolute',

                        top: 0,
                        left: '25%',

                        transform:
                            'translate(-50%, -50%)',

                        width: {
                            xs: '25%',
                            sm: 100,
                            md: 350,
                        },

                        minHeight: {
                            xs: 150,
                            md: 190,
                        },

                        p: {
                            xs: 2.5,
                            md: 3.5,
                        },

                        borderRadius: 4,

                        background:
                            'rgba(255,255,255,0.09)',

                        backdropFilter:
                            'blur(30px)',

                        WebkitBackdropFilter:
                            'blur(30px)',

                        border:
                            '1px solid rgba(255,255,255,0.16)',

                        boxShadow:
                            '0 25px 70px rgba(0,0,0,0.4)',

                        zIndex: 3,

                        color: '#fff',
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            opacity: 0.45,
                            letterSpacing: 2,
                        }}
                    >
                        PROJECT
                    </Typography>

                    <Typography
                        sx={{
                            mt: 2,

                            fontSize: {
                                xs: '2.5rem',
                                sm: '4rem',
                                md: '6rem',
                            },

                            fontWeight: 700,

                            lineHeight: 0.95,

                            letterSpacing:
                                '-0.05em',
                        }}
                    >
                        {work.title}
                    </Typography>
                </Paper>
            </Box>
        </Box>
    )
}

export default WorkTile