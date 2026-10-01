import { useEffect, useRef, useState } from 'react'
import { Box, } from '@mui/material'
import { useMotionValueEvent, useScroll, useSpring } from 'framer-motion'
import HomeIntro from '../components/homeComps/HomeIntro'
import WhyYouNeedMe from '../components/homeComps/WhyYouNeedMe'
import HomeContactCard from '../components/homeComps/contactCard/HomeContactCard'
import { ArrowDown } from 'lucide-react';
import { colors } from '../design/colors';
import { glass } from '../design/glass';
import { spacing } from '../design/spacing';
import { motion } from 'framer-motion'

const Home = ({ homeRef, scrollProgress, }) => {

    const [introComplete, setIntroComplete] =
        useState(false);

    const [cardsMounted, setCardsMounted] =
        useState(false);

    const [showScrollIndicator, setShowScrollIndicator] =
        useState(false);

    const { scrollYProgress, } = useScroll({
        target: homeRef,
        offset: [
            'start start',
            'end end',
        ],
    });

    const lazyScrollProgress =
        useSpring(
            scrollYProgress,
            {
                stiffness: 35,
                damping: 24,
                mass: 1.8,
            }
        )

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
                {showScrollIndicator && (
                    <Box
                        component={motion.div}
                        initial={{
                            y: 30,
                            opacity: 0,
                            scale: 0.9,
                        }}
                        animate={{
                            y: 0,
                            opacity: 1,
                            scale: 1,
                        }}
                        transition={{
                            duration: 0.35,
                            ease: [0.22, 1.2, 0.36, 1],
                        }}
                        sx={{
                            position: 'absolute',
                            bottom: 15,
                            left: '50%',
                            transform: 'translateX(-50%)',

                            width: 40,
                            height: 40,

                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',

                            borderRadius: spacing.md,
                            background: glass.floating.background,
                            border: glass.floating.border,
                            backdropFilter: glass.floating.backdropFilter,
                            boxShadow: glass.floating.shadow,

                            overflow: 'hidden',
                        }}
                    >
                        <motion.div
                            animate={{
                                y: [0, -10, 5, -4, 0],
                            }}
                            transition={{
                                duration: 0.9,
                                ease: [0.22, 1.4, 0.36, 1],
                                repeat: Infinity,
                                repeatDelay: 0.4,
                            }}
                        >
                            <ArrowDown
                                size={25}
                                strokeWidth={1.8}
                                color={colors.accent.primary}
                            />
                        </motion.div>
                    </Box>
                )}

                <HomeIntro
                    onIntroComplete={() => {
                        setIntroComplete(true);
                    }}
                    onScrollIndicatorReady={() => {
                        setShowScrollIndicator(true);
                    }}
                    scrollProgress={lazyScrollProgress}
                    introComplete={introComplete}
                />

                {cardsMounted && (
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: 2,
                            pointerEvents: 'none',
                        }}
                    >
                        <WhyYouNeedMe
                            scrollProgress={lazyScrollProgress}
                            introComplete={introComplete}
                        />

                        <HomeContactCard
                            scrollProgress={lazyScrollProgress}
                            introComplete={introComplete}
                        />
                    </Box>
                )}
            </Box>
        </Box>
    )
}

export default Home