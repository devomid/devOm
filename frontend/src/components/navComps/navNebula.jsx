import { useEffect, useMemo, useRef, useState } from "react";
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

const NAV_EVENT = "devom:navigation-nebula";

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

function getLayout(width) {
    if (width < 600) {
        return {
            mode: "phone",
            fontSize: 38,
            gap: 34,
        };
    }

    if (width < 900) {
        return {
            mode: "tablet",
            fontSize: 46,
            gap: 42,
        };
    }

    if (width < 1200) {
        return {
            mode: "smallDesktop",
            fontSize: 52,
            gap: 48,
        };
    }

    return {
        mode: "desktop",
        fontSize: 58,
        gap: 56,
    };
}

function createTargets(width, height) {
    const layout = getLayout(width);

    const horizontal =
        layout.mode === "desktop" ||
        layout.mode === "smallDesktop";

    const centerX = width * 0.5;
    const centerY = height * 0.5;

    if (horizontal) {
        const estimatedWidths = NAV_ITEMS.map((item) => {
            return Math.max(
                layout.fontSize * 2.2,
                item.label.length * layout.fontSize * 0.55,
            );
        });

        const totalWidth =
            estimatedWidths.reduce((sum, value) => {
                return sum + value;
            }, 0) +
            layout.gap * (NAV_ITEMS.length - 1);

        let cursor = centerX - totalWidth * 0.5;

        return NAV_ITEMS.map((item, index) => {
            const itemWidth = estimatedWidths[index];

            const target = {
                ...item,
                index,
                x: cursor + itemWidth * 0.5,
                y: centerY,
                fontSize: layout.fontSize,
                width: itemWidth,
            };

            cursor += itemWidth + layout.gap;

            return target;
        });
    }

    const verticalGap = layout.fontSize * 0.9 + layout.gap;

    const totalHeight =
        verticalGap * (NAV_ITEMS.length - 1);

    const startY = centerY - totalHeight * 0.5;

    return NAV_ITEMS.map((item, index) => {
        return {
            ...item,
            index,
            x: centerX,
            y: startY + index * verticalGap,
            fontSize: layout.fontSize,
            width: Math.min(
                width * 0.82,
                Math.max(
                    layout.fontSize * 2.2,
                    item.label.length * layout.fontSize * 0.55,
                ),
            ),
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

    const activeId = getCurrentNavId(location.pathname);

    const [viewport, setViewport] = useState(() => {
        if (typeof window === "undefined") {
            return {
                width: 1440,
                height: 900,
            };
        }

        return {
            width: window.innerWidth,
            height: window.innerHeight,
        };
    });

    const [hoveredId, setHoveredId] = useState(null);

    const pointerStateRef = useRef({
        hoveredId: null,
        x: 0,
        y: 0,
    });

    useEffect(() => {
        const handleResize = () => {
            setViewport({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const targets = useMemo(() => {
        return createTargets(
            viewport.width,
            viewport.height,
        );
    }, [viewport]);

    const navState = useMemo(() => {
        return targets.map((item) => {
            return {
                ...item,
                active: item.id === activeId,
                hovered: item.id === hoveredId,
            };
        });
    }, [targets, activeId, hoveredId]);

    useEffect(() => {
        const detail = {
            type: "targets",
            activeId,
            hoveredId,
            items: navState,
        };

        window.dispatchEvent(
            new CustomEvent(NAV_EVENT, {
                detail,
            }),
        );

        if (typeof onNavigationChange === "function") {
            onNavigationChange(detail);
        }

        if (typeof onTargetChange === "function") {
            onTargetChange(detail);
        }
    }, [
        activeId,
        hoveredId,
        navState,
        onNavigationChange,
        onTargetChange,
    ]);

    const handlePointerMove = (event) => {
        pointerStateRef.current.x = event.clientX;
        pointerStateRef.current.y = event.clientY;

        window.dispatchEvent(
            new CustomEvent(NAV_EVENT, {
                detail: {
                    type: "pointer",
                    x: event.clientX,
                    y: event.clientY,
                    hoveredId: pointerStateRef.current.hoveredId,
                },
            }),
        );
    };

    const handlePointerEnter = (id) => {
        pointerStateRef.current.hoveredId = id;
        setHoveredId(id);

        const detail = {
            type: "enter",
            id,
        };

        window.dispatchEvent(
            new CustomEvent(NAV_EVENT, {
                detail,
            }),
        );

        if (typeof onInteractionChange === "function") {
            onInteractionChange(detail);
        }
    };

    const handlePointerLeave = (id) => {
        pointerStateRef.current.hoveredId = null;

        setHoveredId((current) => {
            return current === id ? null : current;
        });

        const detail = {
            type: "leave",
            id,
        };

        window.dispatchEvent(
            new CustomEvent(NAV_EVENT, {
                detail,
            }),
        );

        if (typeof onInteractionChange === "function") {
            onInteractionChange(detail);
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
            aria-label="Primary navigation"
            onPointerMove={handlePointerMove}
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
                        aria-current={
                            item.active
                                ? "page"
                                : undefined
                        }
                        onClick={() =>
                            handleNavigation(item)
                        }
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
                            width: `${Math.max(
                                item.width,
                                100,
                            )}px`,
                            height: `${Math.max(
                                item.fontSize * 1.8,
                                64,
                            )}px`,
                            transform:
                                "translate(-50%, -50%)",
                            padding: 0,
                            margin: 0,
                            border: 0,
                            outline: "none",
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

export { NAV_ITEMS, NAV_EVENT };