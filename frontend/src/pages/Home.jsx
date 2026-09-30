import { useEffect, useRef, useState } from 'react'
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
                    ? 'visible'
                    : 'hidden',
                overscrollBehavior: 'none',
            }}
        >
            <Box
                sx={{
                    position: 'sticky',
                    top: 0,
                    width: '100%',
                    height: '100vh',
                    overflow: 'hidden',
                }}
            >
                <HomeIntro
                    onIntroComplete={() => {
                        setIntroComplete(true);
                    }}
                    scrollProgress={scrollProgress}
                    introComplete={introComplete}
                />

                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 2,
                        pointerEvents: 'none',
                    }}
                >
                    <WhyYouNeedMe
                        scrollProgress={scrollProgress}
                        introComplete={introComplete}
                    />

                    <HomeContactCard
                        scrollProgress={scrollProgress}
                        introComplete={introComplete}
                    />
                </Box>
            </Box>
        </Box>
    )
}

export default Home