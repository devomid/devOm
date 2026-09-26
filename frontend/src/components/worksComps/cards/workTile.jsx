import React from 'react'
import {
    Box,
    Typography,
} from '@mui/material'
import {
    useNavigate,
} from 'react-router-dom'

const WorkTile = ({
    work,
    index,
    progress,
}) => {
    const navigate =
        useNavigate()

    const revealStart =
        0.455 +
        index * 0.055

    const revealEnd =
        revealStart +
        0.075

    const rawReveal =
        (
            progress -
            revealStart
        ) /
        (
            revealEnd -
            revealStart
        )

    const reveal =
        Math.max(
            0,
            Math.min(
                1,
                rawReveal,
            ),
        )

    const easedReveal =
        1 -
        Math.pow(
            1 - reveal,
            3,
        )

    const translateY =
        (
            1 -
            easedReveal
        ) * 55

    const scale =
        0.94 +
        easedReveal * 0.06

    const rotate =
        (
            1 -
            easedReveal
        ) *
        (
            index % 2 === 0
                ? -1.8
                : 1.8
        )

    const handleClick =
        () => {
            navigate(
                work.path,
            )
        }

    return (
        <Box
            onClick={
                reveal > 0.05
                    ? handleClick
                    : undefined
            }
            sx={{
                width: {
                    xs: '90vw',
                    sm: '86vw',
                    md: '80vw',
                },

                maxWidth:
                    '1100px',

                minHeight: {
                    xs: '76px',
                    sm: '88px',
                    md: '96px',
                },

                position:
                    'relative',

                display: 'flex',

                alignItems:
                    'center',

                justifyContent:
                    'space-between',

                px: {
                    xs: 2.5,
                    sm: 3.5,
                    md: 4,
                },

                borderRadius:
                    '24px',

                border:
                    '1px solid rgba(255,255,255,0.13)',

                background:
                    'rgba(12,10,8,0.82)',

                backdropFilter:
                    'blur(18px)',

                WebkitBackdropFilter:
                    'blur(18px)',

                boxShadow:
                    '0 20px 70px rgba(0,0,0,0.35)',

                opacity:
                    easedReveal,

                transform:
                    `translate3d(0, ${translateY}px, 0) scale(${scale}) rotate(${rotate}deg)`,

                transformOrigin:
                    'center center',

                transition:
                    'border-color 180ms ease, box-shadow 180ms ease',

                pointerEvents:
                    reveal > 0.05
                        ? 'auto'
                        : 'none',

                cursor:
                    reveal > 0.05
                        ? 'pointer'
                        : 'default',

                '&:hover': {
                    borderColor:
                        'rgba(255,255,255,0.32)',

                    boxShadow:
                        '0 25px 90px rgba(0,0,0,0.55)',

                    transform:
                        `translate3d(0, ${translateY}px, 0) scale(${scale + 0.012}) rotate(0deg)`,
                },
            }}
        >
            <Box
                sx={{
                    display:
                        'flex',

                    alignItems:
                        'center',

                    gap: 2,

                    minWidth: 0,
                }}
            >
                <Typography
                    sx={{
                        fontSize: {
                            xs: '0.68rem',
                            sm: '0.72rem',
                        },

                        fontWeight:
                            700,

                        letterSpacing:
                            '0.12em',

                        opacity:
                            0.42,

                        flexShrink:
                            0,
                    }}
                >
                    {
                        String(
                            index + 1,
                        ).padStart(
                            2,
                            '0',
                        )
                    }
                </Typography>

                <Typography
                    sx={{
                        fontSize: {
                            xs: '1rem',
                            sm: '1.25rem',
                            md: '1.5rem',
                        },

                        fontWeight:
                            600,

                        letterSpacing:
                            '-0.025em',

                        color:
                            '#F4F1EA',

                        whiteSpace:
                            'nowrap',

                        overflow:
                            'hidden',

                        textOverflow:
                            'ellipsis',
                    }}
                >
                    {
                        work.title
                    }
                </Typography>
            </Box>

            <Typography
                sx={{
                    fontSize:
                        '1.35rem',

                    opacity:
                        0.45,

                    ml: 2,

                    flexShrink:
                        0,
                }}
            >
                ↗
            </Typography>
        </Box>
    )
}

export default WorkTile