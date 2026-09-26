import React from 'react'

import {
    Box,
    Typography,
} from '@mui/material'

import { useNavigate } from 'react-router-dom'

const clamp = (
    value,
    min = 0,
    max = 1,
) => {
    return Math.min(
        max,
        Math.max(min, value),
    )
}

const WorkTile = ({
    work,
    index,
    revealProgress,
}) => {
    const navigate =
        useNavigate()

    const progress =
        clamp(
            revealProgress,
        )

    /*
     * ------------------------------------------------
     * CARD APPEARANCE
     * ------------------------------------------------
     *
     * The card does not simply fade in.
     *
     * It starts:
     *
     *      tiny
     *      compressed
     *      slightly rotated
     *
     * and expands into its real rectangular form.
     *
     * This makes it feel as if the vortex has
     * materialized the card.
     */

    const eased =
        1 -
        Math.pow(
            1 - progress,
            4,
        )

    const scale =
        0.72 +
        eased * 0.28

    const translateY =
        35 -
        eased * 35

    const rotate =
        index % 2 === 0
            ? -3 +
            eased * 3
            : 3 -
            eased * 3

    const opacity =
        Math.min(
            1,
            progress * 1.8,
        )

    const blur =
        Math.max(
            0,
            (1 - progress) * 10,
        )

    const handleClick =
        () => {
            navigate(
                work.path,
            )
        }

    return (
        <Box
            component="button"
            type="button"
            onClick={
                handleClick
            }
            aria-label={`Open ${work.title}`}
            sx={{
                width:
                    '100%',

                height:
                    'clamp(92px, 14vh, 150px)',

                minHeight:
                    '92px',

                border:
                    '1px solid rgba(255,255,255,0.13)',

                borderRadius:
                    '28px',

                background:
                    'rgba(10, 9, 8, 0.78)',

                backdropFilter:
                    'blur(18px)',

                WebkitBackdropFilter:
                    'blur(18px)',

                color:
                    '#ffffff',

                display:
                    'flex',

                alignItems:
                    'center',

                justifyContent:
                    'space-between',

                textAlign:
                    'left',

                px:
                {
                    xs: 2.5,
                    sm: 3.5,
                    md: 5,
                },

                cursor:
                    progress >
                        0.35
                        ? 'pointer'
                        : 'default',

                pointerEvents:
                    progress >
                        0.35
                        ? 'auto'
                        : 'none',

                opacity,

                transform:
                    `translate3d(0, ${translateY}px, 0) scale(${scale}) rotate(${rotate}deg)`,

                filter:
                    `blur(${blur}px)`,

                transformOrigin:
                    'center center',

                transition:
                    'box-shadow 180ms ease, border-color 180ms ease, background 180ms ease',

                '&:hover':
                {
                    borderColor:
                        'rgba(255,255,255,0.30)',

                    background:
                        'rgba(20, 18, 15, 0.86)',

                    boxShadow:
                        '0 20px 70px rgba(0,0,0,0.32)',
                },

                '&:active':
                {
                    transform:
                        `translate3d(0, ${translateY}px, 0) scale(${scale * 0.985}) rotate(${rotate}deg)`,
                },
            }}
        >
            <Box
                sx={{
                    minWidth:
                        0,
                }}
            >
                <Typography
                    sx={{
                        fontSize:
                        {
                            xs:
                                '1.15rem',
                            sm:
                                '1.45rem',
                            md:
                                '1.8rem',
                        },

                        lineHeight:
                            1.1,

                        fontWeight:
                            600,

                        letterSpacing:
                            '-0.025em',

                        color:
                            'rgba(255,255,255,0.94)',

                        mb:
                            0.8,

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

                <Typography
                    sx={{
                        fontSize:
                        {
                            xs:
                                '0.72rem',
                            sm:
                                '0.8rem',
                            md:
                                '0.88rem',
                        },

                        lineHeight:
                            1.35,

                        color:
                            'rgba(255,255,255,0.48)',

                        whiteSpace:
                            'nowrap',

                        overflow:
                            'hidden',

                        textOverflow:
                            'ellipsis',
                    }}
                >
                    {
                        work.description
                    }
                </Typography>
            </Box>

            <Box
                sx={{
                    flexShrink: 0,

                    ml: 3,

                    width:
                    {
                        xs: 34,
                        sm: 40,
                        md: 46,
                    },

                    height:
                    {
                        xs: 34,
                        sm: 40,
                        md: 46,
                    },

                    borderRadius:
                        '50%',

                    border:
                        '1px solid rgba(255,255,255,0.18)',

                    display:
                        'flex',

                    alignItems:
                        'center',

                    justifyContent:
                        'center',

                    color:
                        'rgba(255,255,255,0.72)',

                    fontSize:
                    {
                        xs:
                            '0.8rem',
                        md:
                            '0.95rem',
                    },

                    transition:
                        'transform 180ms ease, background 180ms ease',

                    '.MuiButtonBase-root:hover &':
                    {
                        transform:
                            'translateX(3px)',
                    },
                }}
            >
                →
            </Box>
        </Box>
    )
}

export default WorkTile