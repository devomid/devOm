import {
    useEffect,
} from 'react'

import {
    Box,
} from '@mui/material'

import {
    useMotionValueEvent,
    useScroll,
} from 'framer-motion'

import HomeIntro
    from '../components/homeComps/HomeIntro'

import HomeContact
    from '../components/homeComps/HomeContacts'

import NebulaBackground
    from '../components/nebula/nebula'


const Home = ({
    homeRef,
    scrollProgress,
    scrollState,
}) => {
    const {
        scrollYProgress,
    } = useScroll({
        target:
            homeRef,

        offset: [
            'start start',
            'end end',
        ],
    })

    useMotionValueEvent(
        scrollYProgress,
        'change',
        latest => {
            scrollProgress.set(
                latest,
            )
        },
    )

    useEffect(
        () => {
            return () => {
                scrollProgress.set(
                    0,
                )
            }
        },
        [
            scrollProgress,
        ],
    )

    return (
        <Box
            ref={
                homeRef
            }
            sx={{
                position:
                    'relative',

                minHeight:
                    '220vh',

                width:
                    '100%',
            }}
        >
            {/*
             * ------------------------------------------------
             * SHARED NEBULA BACKGROUND
             * ------------------------------------------------
             *
             * This is the exact same shared particle
             * system already used by the project.
             *
             * Nothing inside nebula.jsx is changed for Home.
             * ------------------------------------------------
             */}

            <Box
                sx={{
                    position:
                        'fixed',

                    inset:
                        0,

                    width:
                        '100%',

                    height:
                        '100vh',

                    zIndex:
                        0,

                    pointerEvents:
                        'none',

                    overflow:
                        'hidden',
                }}
            >
                <NebulaBackground
                    scrollState={
                        scrollState
                    }
                />
            </Box>

            {/*
             * ------------------------------------------------
             * INTRO / HERO
             * ------------------------------------------------
             */}

            <Box
                sx={{
                    position:
                        'sticky',

                    top:
                        0,

                    width:
                        '100%',

                    height:
                        '100vh',

                    overflow:
                        'hidden',

                    zIndex:
                        1,
                }}
            >
                <HomeIntro
                    onComplete={
                        () => { }
                    }
                />

                {/*
                 * Scroll indicator.
                 *
                 * It becomes visible only after the intro
                 * has finished in the final implementation.
                 * Kept structurally separate so its animation
                 * can be refined without touching the
                 * particle system.
                 */}

                <Box
                    sx={{
                        position:
                            'absolute',

                        left:
                            '50%',

                        bottom:
                        {
                            xs: 28,
                            md: 36,
                        },

                        transform:
                            'translateX(-50%)',

                        width:
                            28,

                        height:
                            42,

                        display:
                            'flex',

                        alignItems:
                            'center',

                        justifyContent:
                            'center',

                        opacity:
                            1,

                        pointerEvents:
                            'none',

                        zIndex:
                            10,
                    }}
                >
                    <Box
                        sx={{
                            width:
                                1,

                            height:
                                30,

                            backgroundColor:
                                'currentColor',

                            opacity:
                                0.45,

                            position:
                                'relative',

                            '&::after': {
                                content:
                                    '""',

                                position:
                                    'absolute',

                                left:
                                    '50%',

                                bottom:
                                    -2,

                                width:
                                    7,

                                height:
                                    7,

                                borderRight:
                                    '1px solid currentColor',

                                borderBottom:
                                    '1px solid currentColor',

                                transform:
                                    'translateX(-50%) rotate(45deg)',
                            },
                        }}
                    />
                </Box>
            </Box>

            {/*
             * ------------------------------------------------
             * CONTACT
             * ------------------------------------------------
             */}

            <Box
                sx={{
                    position:
                        'relative',

                    zIndex:
                        3,

                    minHeight:
                        '100vh',

                    display:
                        'flex',

                    alignItems:
                        'center',
                }}
            >
                <HomeContact />
            </Box>
        </Box>
    )
}

export default Home