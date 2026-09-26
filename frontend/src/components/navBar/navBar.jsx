import { Box, Typography } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'
import {
    motion,
    animate,
    useMotionTemplate,
    useMotionValue,
    useTransform,
    useMotionValueEvent,
} from 'framer-motion'
import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react'

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
    { label: 'devOm', path: '/' },
    { label: 'What I build', path: '/whatibuild' },
    { label: `What I've done`, path: '/works' },
    { label: 'How I build', path: '/howibuild' },
    { label: 'Contacts', path: '/contacts' },
]

const MotionBox = motion(Box)
const MotionTypography = motion(Typography)

const NAVBAR_END_PROGRESS = 0.25

const getHomeSection = (progress) => {
    if (progress < 0.2) return 0
    if (progress < 0.4) return 1
    if (progress < 0.6) return 2
    if (progress < 0.8) return 3

    return 4
}

const NavBar = ({ scrollProgress }) => {
    const location = useLocation()

    const isHome = location.pathname === '/'

    const navbarProgress = useMotionValue(
        isHome
            ? scrollProgress.get()
            : NAVBAR_END_PROGRESS,
    )

    const [homeSection, setHomeSection] = useState(
        () =>
            isHome
                ? getHomeSection(
                    scrollProgress.get(),
                )
                : 4,
    )

    const navRef = useRef(null)
    const itemRefs = useRef([])

    const indicatorX = useMotionValue(0)
    const indicatorWidth = useMotionValue(0)

    const activeIndex = isHome
        ? homeSection
        : navItems.findIndex(
            (item) =>
                item.path ===
                location.pathname,
        )

    /*
     * Home scroll controls the navbar directly.
     */
    useMotionValueEvent(
        scrollProgress,
        'change',
        (latest) => {
            if (!isHome) return

            navbarProgress.set(latest)

            const nextSection =
                getHomeSection(latest)

            setHomeSection(
                (current) =>
                    current === nextSection
                        ? current
                        : nextSection,
            )
        },
    )

    /*
     * Route transitions.
     *
     * Home -> standalone:
     * smoothly finish the navbar's transition
     * into its compact state.
     *
     * Standalone -> Home:
     * Home starts from its real top state.
     */
    useEffect(() => {
        if (isHome) {
            navbarProgress.set(
                scrollProgress.get(),
            )

            return
        }

        animate(
            navbarProgress,
            NAVBAR_END_PROGRESS,
            {
                duration: 0.55,
                ease: [0.16, 1, 0.3, 1],
            },
        )
    }, [
        isHome,
        location.pathname,
        navbarProgress,
        scrollProgress,
    ])

    /*
     * Calculate the indicator's actual position
     * from the rendered navigation item.
     */
    const updateIndicator = () => {
        const nav = navRef.current
        const item =
            itemRefs.current[activeIndex]

        if (!nav || !item) return

        const navRect =
            nav.getBoundingClientRect()

        const itemRect =
            item.getBoundingClientRect()

        indicatorX.set(
            itemRect.left -
            navRect.left,
        )

        indicatorWidth.set(
            itemRect.width,
        )
    }

    /*
     * Keep the indicator synchronized with navbar
     * geometry while the navbar itself is transforming.
     */
    useLayoutEffect(() => {
        updateIndicator()

        const nav = navRef.current

        if (!nav) return

        const observer =
            new ResizeObserver(() => {
                updateIndicator()
            })

        observer.observe(nav)

        itemRefs.current.forEach((item) => {
            if (item) {
                observer.observe(item)
            }
        })

        return () => {
            observer.disconnect()
        }
    }, [
        activeIndex,
        isHome,
        location.pathname,
    ])

    /*
     * Animate the red indicator between navigation
     * items.
     *
     * There is only ONE indicator in the DOM.
     * No layoutId means no jump/remount.
     */
    useEffect(() => {
        const nav = navRef.current
        const item =
            itemRefs.current[activeIndex]

        if (!nav || !item) return

        const navRect =
            nav.getBoundingClientRect()

        const itemRect =
            item.getBoundingClientRect()

        animate(
            indicatorX,
            itemRect.left -
                navRect.left,
            {
                duration: 0.42,
                ease: [0.16, 1, 0.3, 1],
            },
        )

        animate(
            indicatorWidth,
            itemRect.width,
            {
                duration: 0.42,
                ease: [0.16, 1, 0.3, 1],
            },
        )
    }, [
        activeIndex,
        location.pathname,
        indicatorX,
        indicatorWidth,
    ])

    /*
     * Navbar visual state.
     */
    const navbarOpacity = useTransform(
        navbarProgress,
        [0, NAVBAR_END_PROGRESS],
        [
            motionTokens.opacity.visible,
            motionTokens.opacity.hidden,
        ],
    )

    const navbarBackground = useTransform(
        navbarOpacity,
        (opacity) =>
            `rgba(0, 0, 0, ${ opacity })`,
    )

    /*
     * Keep the expensive backdrop-filter stable.
     * The navbar still moves smoothly because its
     * geometry remains MotionValue driven.
     */
    const navbarBackdropFilter =
        useMotionTemplate`
blur(30px)
saturate(165 %)
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

    return (
        <MotionBox
            ref={navRef}
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
                (item, index) => (
                    <Box
                        key={item.path}
                        ref={(element) => {
                            itemRefs.current[
                                index
                            ] = element
                        }}
                        component={Link}
                        to={item.path}
                        sx={{
                            position: 'relative',

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
                                    typography
                                        .weight
                                        .medium,

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
                    </Box>
                ),
            )}

            {/* One persistent red indicator. */}
            <MotionBox
                style={{
                    x: indicatorX,
                    width: indicatorWidth,
                }}
                sx={{
                    position: 'absolute',

                    left: 0,
                    bottom: 0,

                    height: '4px',

                    backgroundColor: 'red',

                    borderRadius:
                        radius.pill,

                    pointerEvents: 'none',
                }}
            />
        </MotionBox>
    )
}

export default NavBar