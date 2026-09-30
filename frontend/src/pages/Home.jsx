import { useEffect, useRef, useState } from 'react'
import { Box, } from '@mui/material'
import { useMotionValueEvent, useScroll, } from 'framer-motion'
import HomeIntro from '../components/homeComps/HomeIntro'

const Home = ({ homeRef, scrollProgress, }) => {

    const [introComplete, setIntroComplete] = useState(false);

    const { scrollYProgress, } = useScroll({
        target: homeRef,
        offset: [
            'start start',
            'end end',
        ],
    })

    useMotionValueEvent(scrollYProgress, 'change', latest => {
        scrollProgress.set(
            latest,
        )
    }
    )

    useEffect(() => {
        return () => {
            scrollProgress.set(0)
        }
    }, [scrollProgress])

    return (
        <Box
            ref={homeRef}
            sx={{
                position: 'relative',
                width: '100%',
                height: introComplete
                    ? '300vh'
                    : '100vh',
                minHeight: '100vh',
                overflow: introComplete
                    ? 'auto'
                    : 'hidden',
                overscrollBehavior: 'none',
            }}
        >
            <HomeIntro onIntroComplete={() => {
                setIntroComplete(true);
            }} />
        </Box>
    )
}

export default Home