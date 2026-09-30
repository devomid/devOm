import { useEffect, useRef, useState } from 'react'
import { motion, } from 'framer-motion'
import { Box, } from '@mui/material'
import { useMotionValueEvent, useScroll, } from 'framer-motion'
import HomeIntro from '../components/homeComps/HomeIntro'
import WhyYouNeedMe from '../components/homeComps/WhyYouNeedMe'
import HomeContactCard from '../components/homeComps/HomeContactCard'

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

            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 2,
                    pointerEvents: 'none',
                }}
            >
                <motion.div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        y: scrollProgress,
                    }}
                >
                    <WhyYouNeedMe />
                    <HomeContactCard />
                </motion.div>
            </Box>

        </Box>
    )
}

export default Home