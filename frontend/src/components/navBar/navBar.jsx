import { Box, Typography } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'
import {
    motion,
    LayoutGroup,
    useMotionTemplate,
    useTransform,
    useMotionValueEvent,
} from 'framer-motion'
import { useState } from 'react'

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

const NavBar = ({ scrollProgress }) => {
    const location = useLocation()

    const [homeSection, setHomeSection] = useState(() =>
        getHomeSection(scrollProgress.get()),
    )

    useMotionValueEvent(
        scrollProgress,
        'change',
        (latest) => {
            const nextSection = getHomeSection(latest)

            setHomeSection((currentSection) =>
                currentSection === nextSection
                    ? currentSection
                    : nextSection,
            )
        },
    )

    const activeIndex =
        location.pathname === '/'
            ? homeSection
            : navItems.findIndex(
                (item) =>
                    item.path === location.pathname,
            )

    const navbarOpacity = useTransform(
        scrollProgress,
        [0, 0.25],
        [
            motionTokens.opacity.visible,
            motionTokens.opacity.hidden,
        ],
    )

    const navbarBlur = useTransform(
        scrollProgress,
        [0, 0.25],
        [28, 32],
    )

    const navbarSaturate = useTransform(
        scrollProgress,
        [0, 0.25],
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
        scrollProgress,
        [0, 0.25],
        [
            layout.header.heightDesktop,
            layout.header.heightMobile,
        ],
    )

    const navbarTop = useTransform(
        scrollProgress,
        [0, 0.25],
        [
            spacing[0],
            spacing.lg,
        ],
    )

    const navbarSide = useTransform(
        scrollProgress,
        [0, 0.25],
        [
            spacing[0],
            spacing.colossal,
        ],
    )

    const navbarRadius = useTransform(
        scrollProgress,
        [0, 0.25],
        [
            radius.none,
            radius.lg,
        ],
    )

    const navbarGap = useTransform(
        scrollProgress,
        [0, 0.25],
        [
            spacing.xxl,
            spacing.colossal,
        ],
    )

    const navFontSize = useTransform(
        scrollProgress,
        [0, 0.25],
        [
            typography.size.sm,
            typography.size.xs,
        ],
    )

    const navFontColor = useTransform(
        scrollProgress,
        [0, 0.25],
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
                    background: navbarBackground,
                    backdropFilter:
                        navbarBackdropFilter,
                    WebkitBackdropFilter:
                        navbarBackdropFilter,

                    top: navbarTop,
                    left: navbarSide,
                    right: navbarSide,

                    height: navbarHeight,

                    borderRadius: navbarRadius,
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
                    justifyContent: 'center',
                    alignItems: 'center',

                    boxSizing: 'border-box',
                    marginInline: 'auto',

                    color: colors.text.primary,

                    zIndex: 1000,
                }}
            >
                {navItems.map((item, index) => {
                    const isActive =
                        index === activeIndex

                    return (
                        <Box
                            key={item.path}
                            component={Link}
                            to={item.path}
                            sx={{
                                position:
                                    'relative',
                                display: 'flex',
                                alignItems:
                                    'center',
                                height: '100%',
                                textDecoration:
                                    'none',
                                color: 'inherit',
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
                                {item.label}
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
                                        stiffness: 500,
                                        damping: 28,
                                        mass: 0.7,
                                    }}
                                />
                            )}
                        </Box>
                    )
                })}
            </MotionBox>
        </LayoutGroup>
    )
}

export default NavBar