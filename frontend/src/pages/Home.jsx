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


const Home = ({
    homeRef,
    scrollProgress,
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

                width:
                    '100%',

                height:
                    '100vh',

                minHeight:
                    '100vh',

                overflow:
                    'hidden',
            }}
        >
            <HomeIntro />
        </Box>
    )
}

export default Home