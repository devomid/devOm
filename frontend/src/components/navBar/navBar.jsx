import { Box, Typography } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'
import {
    motion,
    LayoutGroup,
    animate,
    useMotionTemplate,
    useMotionValue,
    useTransform,
    useMotionValueEvent,
} from 'framer-motion'
import { useEffect, useState } from 'react'

import {
    colors,
    typography,
    spacing,
    radius,
    glass,
    motion as motionTokens,
    layout,
} from '../../design'

const navItems = [
    { label: 'Home', path: '/' },
    { label: 'What I build', path: '/whatibuild' },
    { label: 'Works', path: '/works' },
    { label: 'How I build', path: '/howibuild' },
    { label: 'Contacts', path: '/contacts' },
]

const MotionBox = motion(Box)
const MotionTypography = motion(Typography)

const getHomeSection = (progress) => {
    if (progress < 0.2) return 0
    if (progress < 0.4) return 1
    if (progress < 0.6) return 2
    if (progress < 0.8) return 3

    return 4
}

const NAVBAR_END_PROGRESS = 0.25

const NavBar = ({ scrollProgress }) => {
    const location = useLocation()

    const isHome = location.pathname === '/'

    /*
     * This MotionValue controls ONLY the navbar's visual state.
     *
     * On Home:
     *     it follows the real Home scroll.
     *
     * On standalone pages:
     *     it animates to the end-of-Home state.
     */
    const navbarProgress = useMotionValue(
        isHome
            ? scrollProgress.get()
            : NAVBAR_END_PROGRESS,
    )

    const [homeSection, setHomeSection] = useState(() =>
        getHomeSection(scrollProgress.get()),
    )

    /*
     * Home scroll controls navbar visual state while Home
     * is actually mounted.
     *
     * Direct MotionValue updates avoid React renders on every
     * scroll frame.
     */
    useMotionValueEvent(
        scrollProgress,
        'change',
        (latest) => {
            if (!isHome) return

            navbarProgress.set(latest)
        },
    )

    /*
     * The active Home section is discrete state, so React
     * only renders when crossing one of the five section
     * boundaries.
     */
    useMotionValueEvent(
        scrollProgress,
        'change',
        (latest) => {
            if (!isHome) return

            const nextSection =
                getHomeSection(latest)

            setHomeSection(
                (currentSection) =>
                    currentSection ===
                        nextSection
                        ? currentSection
                        : nextSection,
            )
        },
    )

    /*
     * Route changes control the navbar's visual destination.
     *
     * Standalone pages always use the visual state that
     * represents the END of Home's navbar transition.
     *
     * Home uses whatever scroll position Home currently has.
     */
    useEffect(() => {
        if (isHome) {
            animate(
                navbarProgress,
                scrollProgress.get(),
                {
                    duration: 0.28,
                    ease: [0.22, 1, 0.36, 1],
                },
            )

            return
        }

        animate(
            navbarProgress,
            NAVBAR_END_PROGRESS,
            {
                duration: 0.32,
                ease: [0.22, 1, 0.36, 1],
            },
        )
    }, [
        isHome,
        location.pathname,
        navbarProgress,
        scrollProgress,
    ])

    const activeIndex =
        isHome
            ? homeSection
            : navItems.findIndex(
                (item) =>
                    item.path ===
                    location.pathname,
            )

    const navbarOpacity = useTransform(
        navbarProgress,
        [0, NAVBAR_END_PROGRESS],
        [
            motionTokens.opacity.visible,
            motionTokens.opacity.hidden,
        ],
    )

    const navbarBlur = useTransform(
        navbarProgress,
        [0, NAVBAR_END_PROGRESS],
        [28, 32],
    )

    const navbarSaturate = useTransform(
        navbarProgress,
        [0, NAVBAR_END_PROGRESS],
        [170, 160],
    )

    const navbarBackground = useTransform(
        navbarOpacity,
        (opacity) =>
            `rgba(0, 0, 0, ${opacity})`,
    )

    const navbarBackdropFilter =
        useMotionTemplate`
            blur(${navbarBlur}px)
            saturate(${navbarSaturate}%)
        `

    const navbarHeight = useTransform(
        navbarProgress,
        [0, NAVBAR_END_PROGRESS],
        [
            layout.header.heightDesktop,
            layout.header.heightMobile,
        ],
    )

    const navbarTop = useTransform(
        navbarProgress,
        [0, NAVBAR_END_PROGRESS],
        [
            spacing[0],
            spacing.lg,
        ],
    )

    const navbarSide = useTransform(
        navbarProgress,
        [0, NAVBAR_END_PROGRESS],
        [
            spacing[0],
            spacing.colossal,
        ],
    )

    const navbarRadius = useTransform(
        navbarProgress,
        [0, NAVBAR_END_PROGRESS],
        [
            radius.none,
            radius.lg,
        ],
    )

    const navbarGap = useTransform(
        navbarProgress,
        [0, NAVBAR_END_PROGRESS],
        [
            spacing.xxl,
            spacing.colossal,
        ],
    )

    const navFontSize = useTransform(
        navbarProgress,
        [0, NAVBAR_END_PROGRESS],
        [
            typography.size.sm,
            typography.size.xs,
        ],
    )

    const navFontColor = useTransform(
        navbarProgress,
        [0, NAVBAR_END_PROGRESS],
        [
            colors.accent.primary,
            colors.text.primary,
        ],
    )

    const navFontWeight =
        typography.weight.medium

    return (
        <LayoutGroup id="devom-navbar">
            <MotionBox
                component="nav"
                style={{
                    background:
                        navbarBackground,

                    backdropFilter:
                        navbarBackdropFilter,

                    WebkitBackdropFilter:
                        navbarBackdropFilter,

                    top: navbarTop,
                    left: navbarSide,
                    right: navbarSide,

                    height: navbarHeight,

                    borderRadius:
                        navbarRadius,

                    gap: navbarGap,
                }}
                sx={{
                    position: 'fixed',

                    width: 'auto',
                    maxWidth:
                        layout.container.maxWidth,

                    borderBottom:
                        glass.floating.border,

                    boxShadow:
                        glass.floating.shadow,

                    display: 'flex',
                    justifyContent:
                        'center',
                    alignItems: 'center',

                    boxSizing: 'border-box',

                    marginInline: 'auto',

                    color:
                        colors.text.primary,

                    zIndex: 1000,
                }}
            >
                {navItems.map(
                    (item, index) => {
                        const isActive =
                            index ===
                            activeIndex

                        return (
                            <Box
                                key={item.path}
                                component={Link}
                                to={item.path}
                                sx={{
                                    position:
                                        'relative',

                                    display:
                                        'flex',

                                    alignItems:
                                        'center',

                                    height: '100%',

                                    textDecoration:
                                        'none',

                                    color:
                                        'inherit',

                                    flexShrink: 0,
                                }}
                            >
                                <MotionTypography
                                    style={{
                                        fontSize:
                                            navFontSize,

                                        color:
                                            navFontColor,
                                    }}
                                    sx={{
                                        fontFamily:
                                            typography
                                                .fontFamily
                                                .sans,

                                        fontWeight:
                                            navFontWeight,

                                        lineHeight:
                                            typography
                                                .lineHeight
                                                .normal,

                                        whiteSpace:
                                            'nowrap',
                                    }}
                                >
                                    {
                                        item.label
                                    }
                                </MotionTypography>

                                {isActive && (
                                    <Box
                                        component={
                                            motion.div
                                        }
                                        layoutId="nav-indicator"
                                        sx={{
                                            position:
                                                'absolute',

                                            left: 0,
                                            right: 0,
                                            bottom: 0,

                                            height: '4px',

                                            backgroundColor:
                                                'red',

                                            borderRadius:
                                                radius.pill,
                                        }}
                                        transition={{
                                            type: 'spring',

                                            stiffness:
                                                500,

                                            damping:
                                                28,

                                            mass: 0.7,
                                        }}
                                    />
                                )}
                            </Box>
                        )
                    },
                )}
            </MotionBox>
        </LayoutGroup>
    )
}

export default NavBar