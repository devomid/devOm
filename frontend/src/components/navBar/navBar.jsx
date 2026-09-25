import { Box, Typography } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'
import {
    animate,
    motion,
    useMotionTemplate,
    useMotionValue,
    useMotionValueEvent,
    useTransform,
} from 'framer-motion'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

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

const getRouteIndex = (pathname) => {
    const index = navItems.findIndex(
        (item) => item.path === pathname,
    )

    return index === -1 ? 0 : index
}

const getNavbarProgress = (scrollProgress) => {
    return Math.min(
        Math.max(scrollProgress / 0.25, 0),
        1,
    )
}

const NavBar = ({ scrollProgress }) => {
    const location = useLocation()
    const isHome = location.pathname === '/'

    /*
     * ------------------------------------------------------------------
     * ROUTE
     * ------------------------------------------------------------------
     */

    const pathnameRef = useRef(location.pathname)
    pathnameRef.current = location.pathname

    /*
     * ------------------------------------------------------------------
     * HOME SECTION
     * ------------------------------------------------------------------
     */

    const [homeSection, setHomeSection] = useState(() =>
        getHomeSection(scrollProgress.get()),
    )

    /*
     * ------------------------------------------------------------------
     * NAVBAR VISUAL STATE
     *
     * 0 = Home expanded state
     * 1 = compact floating state
     *
     * This MotionValue belongs to NavBar and therefore survives
     * Home being mounted/unmounted.
     * ------------------------------------------------------------------
     */

    const navbarProgress = useMotionValue(
        isHome
            ? getNavbarProgress(scrollProgress.get())
            : 1,
    )

    /*
     * ------------------------------------------------------------------
     * HOME SCROLL -> NAVBAR
     * ------------------------------------------------------------------
     */

    useMotionValueEvent(
        scrollProgress,
        'change',
        (latest) => {
            /*
             * Once we leave Home, the old Home MotionValue is no
             * longer allowed to control the navbar.
             */
            if (pathnameRef.current !== '/') {
                return
            }

            const nextSection = getHomeSection(latest)

            setHomeSection((currentSection) => {
                if (currentSection === nextSection) {
                    return currentSection
                }

                return nextSection
            })

            /*
             * While actually on Home, navbar follows scroll directly.
             */
            navbarProgress.set(
                getNavbarProgress(latest),
            )
        },
    )

    /*
     * ------------------------------------------------------------------
     * ROUTE -> NAVBAR VISUAL STATE
     * ------------------------------------------------------------------
     *
     * Home:
     *   reconnect to Home's current scroll position.
     *
     * Other routes:
     *   always compact.
     * ------------------------------------------------------------------
     */

    useEffect(() => {
        const target = isHome
            ? getNavbarProgress(scrollProgress.get())
            : 1

        const controls = animate(
            navbarProgress,
            target,
            {
                type: 'spring',
                stiffness: 260,
                damping: 30,
                mass: 0.8,
            },
        )

        return () => {
            controls.stop()
        }
    }, [
        isHome,
        location.pathname,
        navbarProgress,
        scrollProgress,
    ])

    /*
     * ------------------------------------------------------------------
     * ACTIVE ITEM
     * ------------------------------------------------------------------
     */

    const activeIndex = isHome
        ? homeSection
        : getRouteIndex(location.pathname)

    /*
     * ------------------------------------------------------------------
     * NAVBAR VISUAL TRANSFORMS
     * ------------------------------------------------------------------
     */

    const navbarOpacity = useTransform(
        navbarProgress,
        [0, 1],
        [
            motionTokens.opacity.visible,
            motionTokens.opacity.hidden,
        ],
    )

    const navbarBlur = useTransform(
        navbarProgress,
        [0, 1],
        [28, 32],
    )

    const navbarSaturate = useTransform(
        navbarProgress,
        [0, 1],
        [170, 160],
    )

    const navbarBackground = useTransform(
        navbarOpacity,
        (opacity) => `rgba(0, 0, 0, ${opacity})`,
    )

    const navbarBackdropFilter = useMotionTemplate`
        blur(${navbarBlur}px)
        saturate(${navbarSaturate}%)
    `

    const navbarHeight = useTransform(
        navbarProgress,
        [0, 1],
        [
            layout.header.heightDesktop,
            layout.header.heightMobile,
        ],
    )

    const navbarTop = useTransform(
        navbarProgress,
        [0, 1],
        [
            spacing[0],
            spacing.lg,
        ],
    )

    const navbarSide = useTransform(
        navbarProgress,
        [0, 1],
        [
            spacing[0],
            spacing.colossal,
        ],
    )

    const navbarRadius = useTransform(
        navbarProgress,
        [0, 1],
        [
            radius.none,
            radius.lg,
        ],
    )

    const navbarGap = useTransform(
        navbarProgress,
        [0, 1],
        [
            spacing.xxl,
            spacing.colossal,
        ],
    )

    const navFontSize = useTransform(
        navbarProgress,
        [0, 1],
        [
            typography.size.sm,
            typography.size.xs,
        ],
    )

    const navFontColor = useTransform(
        navbarProgress,
        [0, 1],
        [
            colors.accent.primary,
            colors.text.primary,
        ],
    )

    /*
     * ------------------------------------------------------------------
     * UNDERLINE
     *
     * There is ONE underline for the entire navbar.
     *
     * No layoutId.
     * No conditional underline mounting/unmounting.
     * No second underline.
     * ------------------------------------------------------------------
     */

    const navRef = useRef(null)

    const itemRefs = useRef([])

    const underlineX = useMotionValue(0)
    const underlineWidth = useMotionValue(0)

    const underlineAnimation = useRef(null)

    const measureActiveItem = (animateToTarget) => {
        const nav = navRef.current
        const item = itemRefs.current[activeIndex]

        if (!nav || !item) {
            return
        }

        const navRect = nav.getBoundingClientRect()
        const itemRect = item.getBoundingClientRect()

        const targetX =
            itemRect.left - navRect.left

        const targetWidth = itemRect.width

        if (animateToTarget) {
            underlineAnimation.current?.stop()

            underlineAnimation.current = animate(
                underlineX,
                targetX,
                {
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                    mass: 0.7,
                },
            )

            animate(
                underlineWidth,
                targetWidth,
                {
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                    mass: 0.7,
                },
            )
        } else {
            underlineX.set(targetX)
            underlineWidth.set(targetWidth)
        }
    }

    /*
     * Route changes / Home section changes:
     * move the ONE underline to the new item.
     */
    useLayoutEffect(() => {
        /*
         * Wait one frame so the navbar's current geometry has
         * already been applied before measuring the target.
         */
        const frame = requestAnimationFrame(() => {
            measureActiveItem(true)
        })

        return () => {
            cancelAnimationFrame(frame)
        }
    }, [activeIndex])

    /*
     * Home scrolling changes navbar gap/font/position.
     *
     * The underline must remain physically attached to its item.
     */
    useMotionValueEvent(
        navbarProgress,
        'change',
        () => {
            if (!isHome) {
                return
            }

            requestAnimationFrame(() => {
                measureActiveItem(false)
            })
        },
    )

    /*
     * Window resize.
     */
    useEffect(() => {
        const handleResize = () => {
            measureActiveItem(false)
        }

        window.addEventListener(
            'resize',
            handleResize,
        )

        return () => {
            window.removeEventListener(
                'resize',
                handleResize,
            )
        }
    }, [activeIndex])

    return (
        <MotionBox
            ref={navRef}
            component="nav"
            style={{
                background: navbarBackground,
                backdropFilter: navbarBackdropFilter,
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
                maxWidth: layout.container.maxWidth,

                borderBottom: glass.floating.border,
                boxShadow: glass.floating.shadow,

                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',

                boxSizing: 'border-box',
                marginInline: 'auto',

                color: colors.text.primary,

                zIndex: 1000,
            }}
        >
            {navItems.map((item, index) => (
                <Box
                    key={item.path}
                    ref={(element) => {
                        itemRefs.current[index] = element
                    }}
                    component={Link}
                    to={item.path}
                    sx={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        height: '100%',
                        textDecoration: 'none',
                        color: 'inherit',
                        flexShrink: 0,
                    }}
                >
                    <MotionTypography
                        style={{
                            fontSize: navFontSize,
                            color: navFontColor,
                        }}
                        sx={{
                            fontFamily:
                                typography.fontFamily.sans,
                            fontWeight:
                                typography.weight.medium,
                            lineHeight:
                                typography.lineHeight.normal,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {item.label}
                    </MotionTypography>
                </Box>
            ))}

            /*
            * ONE and ONLY ONE red underline.
            */
            <motion.div
                style={{
                    position: 'absolute',
                    left: 0,
                    bottom: 0,

                    width: underlineWidth,
                    height: '4px',

                    x: underlineX,

                    backgroundColor: 'red',
                    borderRadius: radius.pill,
                }}
            />
        </MotionBox>
    )
}

export default NavBar