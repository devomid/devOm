import { Box, Typography } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'
import {
    motion,
    useMotionTemplate,
    useTransform,
} from 'framer-motion'

import { glass, layout } from '../../design'

const navItems = [
    { label: 'Home', path: '/' },
    { label: 'What I build', path: '/whatibuild' },
    { label: 'Works', path: '/works' },
    { label: 'How I build', path: '/howibuild' },
    { label: 'Contacts', path: '/contacts' },
]

const MotionBox = motion(Box)

const NavBar = ({ scrollProgress }) => {
    const location = useLocation()

    /*
     * Home is 500vh.
     * The actual scrollable distance is 400vh.
     *
     * Therefore:
     *
     * 0.00 → 0.25 = Hero transition
     *
     * We only want the navbar to start changing when
     * roughly 80% of that transition has happened.
     *
     * 0.20 → 0.25 = final 20% of Hero transition.
     */

    const navbarOpacity = useTransform(
        scrollProgress,
        [0, 0.25],
        [1, 0.01],
    )

    const navbarBlur = useTransform(
        scrollProgress,
        [0, 0.4],
        [28, 55],
    )

    const navbarHeight = useTransform(
        scrollProgress,
        [0, 0.25],
        [80, 52],
    )

    const navbarSide = useTransform(
        scrollProgress,
        [0, 0.25],
        [0, 32],
    )

    const navbarTop = useTransform(
        scrollProgress,
        [0, 0.25],
        [0, 24],
    )

    const navbarRadius = useTransform(
        scrollProgress,
        [0, 0.25],
        [0, 28],
    )

    const navbarGap = useTransform(
        scrollProgress,
        [0, 0.25],
        [28, 52],
    )

    const navFontSize = useTransform(
        scrollProgress,
        [0, 0.25],
        [1, 0.2],
    )

    const navbarBackground = useTransform(
        navbarOpacity,
        (opacity) => `rgba(25, 255, 255, ${opacity})`,
    )

    const navbarBackdropFilter = useMotionTemplate`
        blur(${navbarBlur}px)
        saturate(170%)
    `

    return (
        <MotionBox
            component="nav"
            style={{
                background: navbarBackground,
                backdropFilter: navbarBackdropFilter,
                WebkitBackdropFilter: navbarBackdropFilter,
                gap: navbarGap,
                top: navbarTop,
                left: navbarSide,
                right: navbarSide,
                height: navbarHeight,
                borderRadius: navbarRadius,
            }}
            sx={{
                position: 'fixed',
                width: 'auto',
                maxWidth: layout.container.maxWidth,
                borderBottom: glass.floating.border,
                boxShadow: glass.floating.shadow,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000,
            }}
        >
            {navItems.map((item) => {
                const isActive = location.pathname === item.path

                return (
                    <Box
                        key={item.path}
                        component={Link}
                        to={item.path}
                        sx={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            height: '100%',
                            textDecoration: 'none',
                            color: 'inherit',
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: navFontSize
                            }} >
                            {item.label}
                        </Typography>

                        {isActive && (
                            <Box
                                component={motion.div}
                                layoutId="nav-indicator"
                                sx={{
                                    position: 'absolute',
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    height: '4px',
                                    backgroundColor: 'red',
                                    borderRadius: '999px',
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
    )
}

export default NavBar