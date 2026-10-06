import React, { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
    {
        id: "home",
        label: "Home",
        path: "/",
    },
    {
        id: "whatibuild",
        label: "What I Build",
        path: "/whatibuild",
    },
    {
        id: "howibuild",
        label: "How I Build",
        path: "/howibuild",
    },
    {
        id: "works",
        label: "Works",
        path: "/works",
    },
    {
        id: "contacts",
        label: "Contacts",
        path: "/contacts",
    },
];

const NAV_STATE = {
    idle: "idle",
    hover: "hover",
    active: "active",
};

function getCurrentNavId(pathname) {
    if (pathname === "/") {
        return "home";
    }

    if (pathname.startsWith("/whatibuild")) {
        return "whatibuild";
    }

    if (pathname.startsWith("/howibuild")) {
        return "howibuild";
    }

    if (pathname.startsWith("/works")) {
        return "works";
    }

    if (pathname.startsWith("/contacts")) {
        return "contacts";
    }

    return "home";
}

function getResponsiveLayout(width) {
    if (width < 600) {
        return {
            mode: "phone",
            gap: 34,
            fontScale: 0.62,
            spreadX: 0.78,
            spreadY: 0.78,
        };
    }

    if (width < 900) {
        return {
            mode: "tablet",
            gap: 42,
            fontScale: 0.76,
            spreadX: 0.84,
            spreadY: 0.84,
        };
    }

    if (width < 1200) {
        return {
            mode: "smallDesktop",
            gap: 48,
            fontScale: 0.88,
            spreadX: 0.9,
            spreadY: 0.9,
        };
    }

    return {
        mode: "desktop",
        gap: 56,
        fontScale: 1,
        spreadX: 0.94,
        spreadY: 0.94,
    };
}

function createNavLayout(width, height) {
    const layout = getResponsiveLayout(width);

    const horizontal =
        layout.mode === "desktop" ||
        layout.mode === "smallDesktop";

    const centerX = width * 0.5;
    const centerY = height * 0.5;

    if (horizontal) {
        const totalWidth =
            NAV_ITEMS.reduce((sum, item) => {
                return sum + item.label.length * 15;
            }, 0) +
            layout.gap * (NAV_ITEMS.length - 1);

        const startX = centerX - totalWidth * 0.5;

        return NAV_ITEMS.map((item, index) => {
            const itemWidth = item.label.length * 15;

            const x =
                startX +
                NAV_ITEMS.slice(0, index).reduce((sum, previous) => {
                    return sum + previous.label.length * 15 + layout.gap;
                }, 0) +
                itemWidth * 0.5;

            return {
                ...item,
                index,
                x,
                y: centerY,
                scale: layout.fontScale,
            };
        });
    }

    const totalHeight =
        NAV_ITEMS.length * 34 +
        (NAV_ITEMS.length - 1) * layout.gap;

    const startY = centerY - totalHeight * 0.5;

    return NAV_ITEMS.map((item, index) => {
        const y =
            startY +
            index * (34 + layout.gap) +
            17;

        return {
            ...item,
            index,
            x: centerX,
            y,
            scale: layout.fontScale,
        };
    });
}

export default function NavNebula({
    onNavigationChange,
    onTargetChange,
    onInteractionChange,
}) {
    const navigate = useNavigate();
    const location = useLocation();

    const containerRef = useRef(null);

    const activeId = getCurrentNavId(location.pathname);

    const [layout, setLayout] = React.useState(() => {
        if (typeof window === "undefined") {
            return createNavLayout(1440, 900);
        }

        return createNavLayout(
            window.innerWidth,
            window.innerHeight,
        );
    });

    const [hoveredId, setHoveredId] = React.useState(null);

    useEffect(() => {
        const handleResize = () => {
            setLayout(
                createNavLayout(
                    window.innerWidth,
                    window.innerHeight,
                ),
            );
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const navState = useMemo(() => {
        return layout.map((item) => {
            let state = NAV_STATE.idle;

            if (item.id === activeId) {
                state = NAV_STATE.active;
            }

            if (item.id === hoveredId) {
                state = NAV_STATE.hover;
            }

            return {
                ...item,
                state,
                active: item.id === activeId,
                hovered: item.id === hoveredId,
            };
        });
    }, [layout, activeId, hoveredId]);

    useEffect(() => {
        if (typeof onNavigationChange === "function") {
            onNavigationChange({
                activeId,
                items: navState,
            });
        }
    }, [activeId, navState, onNavigationChange]);

    useEffect(() => {
        if (typeof onTargetChange === "function") {
            onTargetChange({
                items: navState,
                activeId,
            });
        }
    }, [navState, activeId, onTargetChange]);

    const handlePointerEnter = (id) => {
        setHoveredId(id);

        if (typeof onInteractionChange === "function") {
            onInteractionChange({
                type: "enter",
                id,
            });
        }
    };

    const handlePointerLeave = (id) => {
        setHoveredId((current) => {
            return current === id ? null : current;
        });

        if (typeof onInteractionChange === "function") {
            onInteractionChange({
                type: "leave",
                id,
            });
        }
    };

    const handleNavigation = (item) => {
        if (item.path === location.pathname) {
            return;
        }

        navigate(item.path);
    };

    return (
        <nav
            ref={containerRef}
            aria-label="Primary navigation"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100,
                pointerEvents: "none",
            }}
        >
            {navState.map((item) => {
                return (
                    <button
                        key={item.id}
                        type="button"
                        aria-label={item.label}
                        aria-current={item.active ? "page" : undefined}
                        onClick={() => handleNavigation(item)}
                        onPointerEnter={() =>
                            handlePointerEnter(item.id)
                        }
                        onPointerLeave={() =>
                            handlePointerLeave(item.id)
                        }
                        style={{
                            position: "absolute",
                            left: `${item.x}px`,
                            top: `${item.y}px`,
                            transform: "translate(-50%, -50%)",
                            width: `${Math.max(
                                90,
                                item.label.length * 18,
                            )}px`,
                            height: "56px",
                            padding: 0,
                            margin: 0,
                            border: 0,
                            background: "transparent",
                            color: "transparent",
                            fontSize: 0,
                            lineHeight: 0,
                            pointerEvents: "auto",
                            cursor: "pointer",
                            opacity: 0,
                        }}
                    >
                        {item.label}
                    </button>
                );
            })}
        </nav>
    );
}