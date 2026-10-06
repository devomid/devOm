import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    useLocation,
    useNavigate,
} from "react-router-dom";
import * as THREE from "three";

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

const NAV_EVENT =
    "devom:navigation-nebula";

const TEXTURE_SIZE = 512;

const NAV_CANVAS_WIDTH = 1800;
const NAV_CANVAS_HEIGHT = 620;

const NAV_WORLD_WIDTH = 10.5;
const NAV_WORLD_HEIGHT = 3.6;

const NAV_PARTICLE_RATIO = 0.28;

const NAV_FONT_FAMILY =
    '"Codec Pro", "Helvetica Neue", Arial, sans-serif';

const NAV_FONT_WEIGHT = 400;

const NAV_LETTER_SPACING = 2.0;

function getCurrentNavId(pathname) {
    if (pathname === "/") {
        return "home";
    }

    if (
        pathname.startsWith(
            "/whatibuild",
        )
    ) {
        return "whatibuild";
    }

    if (
        pathname.startsWith(
            "/howibuild",
        )
    ) {
        return "howibuild";
    }

    if (
        pathname.startsWith("/works")
    ) {
        return "works";
    }

    if (
        pathname.startsWith("/contacts")
    ) {
        return "contacts";
    }

    return "home";
}

function getLayout(width) {
    if (width < 600) {
        return {
            mode: "phone",
            fontSize: 74,
            gap: 72,
        };
    }

    if (width < 900) {
        return {
            mode: "tablet",
            fontSize: 88,
            gap: 84,
        };
    }

    if (width < 1200) {
        return {
            mode: "smallDesktop",
            fontSize: 96,
            gap: 92,
        };
    }

    return {
        mode: "desktop",
        fontSize: 104,
        gap: 100,
    };
}

function drawLetterSpacedText(
    ctx,
    text,
    centerX,
    baselineY,
    font,
    letterSpacing,
) {
    ctx.font = font;

    ctx.textAlign =
        "left";

    ctx.textBaseline =
        "alphabetic";

    const characters =
        [...text];

    const widths =
        characters.map(
            (character) =>
                ctx.measureText(
                    character,
                ).width,
        );

    const totalWidth =
        widths.reduce(
            (
                sum,
                width,
            ) =>
                sum + width,
            0,
        ) +
        Math.max(
            0,
            characters.length - 1,
        ) *
        letterSpacing;

    let x =
        centerX -
        totalWidth / 2;

    characters.forEach(
        (
            character,
            index,
        ) => {
            ctx.fillText(
                character,
                x,
                baselineY,
            );

            x +=
                widths[index] +
                letterSpacing;
        },
    );
}

function createNavTargetTexture(
    label,
    fontSize,
) {
    const canvas =
        document.createElement(
            "canvas",
        );

    canvas.width =
        NAV_CANVAS_WIDTH;

    canvas.height =
        NAV_CANVAS_HEIGHT;

    const ctx =
        canvas.getContext(
            "2d",
            {
                willReadFrequently:
                    true,
            },
        );

    if (!ctx) {
        return null;
    }

    ctx.clearRect(
        0,
        0,
        NAV_CANVAS_WIDTH,
        NAV_CANVAS_HEIGHT,
    );

    ctx.fillStyle =
        "#ffffff";

    ctx.filter =
        "blur(2.5px)";

    const font =
        `${NAV_FONT_WEIGHT} ${fontSize}px ${NAV_FONT_FAMILY}`;

    const centerX =
        NAV_CANVAS_WIDTH / 2;

    const baselineY =
        NAV_CANVAS_HEIGHT * 0.63;

    drawLetterSpacedText(
        ctx,
        label,
        centerX,
        baselineY,
        font,
        NAV_LETTER_SPACING,
    );

    ctx.filter =
        "none";

    const imageData =
        ctx.getImageData(
            0,
            0,
            NAV_CANVAS_WIDTH,
            NAV_CANVAS_HEIGHT,
        );

    const pixels =
        imageData.data;

    const candidates = [];

    for (
        let y = 0;
        y < NAV_CANVAS_HEIGHT;
        y += 1
    ) {
        for (
            let x = 0;
            x < NAV_CANVAS_WIDTH;
            x += 1
        ) {
            const pixelIndex =
                (
                    y *
                    NAV_CANVAS_WIDTH +
                    x
                ) *
                4;

            const alpha =
                pixels[
                pixelIndex + 3
                ];

            if (
                alpha > 25
            ) {
                candidates.push({
                    x,
                    y,
                    alpha,
                });
            }
        }
    }

    const particleCapacity =
        TEXTURE_SIZE *
        TEXTURE_SIZE;

    const requiredParticles =
        Math.min(
            particleCapacity,
            Math.floor(
                particleCapacity *
                NAV_PARTICLE_RATIO,
            ),
        );

    const targetData =
        new Float32Array(
            particleCapacity * 4,
        );

    for (
        let i = 0;
        i < particleCapacity;
        i += 1
    ) {
        const offset =
            i * 4;

        if (
            i <
            requiredParticles &&
            candidates.length > 0
        ) {
            const candidateIndex =
                (
                    i *
                    7919
                ) %
                candidates.length;

            const particle =
                candidates[
                candidateIndex
                ];

            const normalizedX =
                particle.x /
                NAV_CANVAS_WIDTH;

            const normalizedY =
                particle.y /
                NAV_CANVAS_HEIGHT;

            const worldX =
                (
                    normalizedX -
                    0.5
                ) *
                NAV_WORLD_WIDTH;

            const worldY =
                (
                    0.5 -
                    normalizedY
                ) *
                NAV_WORLD_HEIGHT;

            const variation =
                i *
                0.0137;

            const jitterX =
                Math.sin(
                    variation *
                    1.71,
                ) *
                0.018;

            const jitterY =
                Math.cos(
                    variation *
                    1.43,
                ) *
                0.018;

            const jitterZ =
                Math.sin(
                    variation *
                    0.91,
                ) *
                0.078;

            targetData[
                offset
            ] =
                worldX +
                jitterX;

            targetData[
                offset + 1
            ] =
                worldY +
                jitterY;

            targetData[
                offset + 2
            ] =
                jitterZ;

            targetData[
                offset + 3
            ] =
                1.0;
        } else {
            targetData[
                offset
            ] = 0;

            targetData[
                offset + 1
            ] = 0;

            targetData[
                offset + 2
            ] = 0;

            targetData[
                offset + 3
            ] = 0;
        }
    }

    const texture =
        new THREE.DataTexture(
            targetData,
            TEXTURE_SIZE,
            TEXTURE_SIZE,
            THREE.RGBAFormat,
            THREE.FloatType,
        );

    texture.magFilter =
        THREE.NearestFilter;

    texture.minFilter =
        THREE.NearestFilter;

    texture.wrapS =
        THREE.ClampToEdgeWrapping;

    texture.wrapT =
        THREE.ClampToEdgeWrapping;

    texture.generateMipmaps =
        false;

    texture.needsUpdate =
        true;

    return texture;
}

function createEmptyTargetTexture() {
    const data =
        new Float32Array(
            TEXTURE_SIZE *
            TEXTURE_SIZE *
            4,
        );

    const texture =
        new THREE.DataTexture(
            data,
            TEXTURE_SIZE,
            TEXTURE_SIZE,
            THREE.RGBAFormat,
            THREE.FloatType,
        );

    texture.magFilter =
        THREE.NearestFilter;

    texture.minFilter =
        THREE.NearestFilter;

    texture.wrapS =
        THREE.ClampToEdgeWrapping;

    texture.wrapT =
        THREE.ClampToEdgeWrapping;

    texture.generateMipmaps =
        false;

    texture.needsUpdate =
        true;

    return texture;
}

function getTargetPositions(
    width,
    height,
) {
    const layout =
        getLayout(width);

    const horizontal =
        layout.mode ===
        "desktop" ||
        layout.mode ===
        "smallDesktop";

    if (horizontal) {
        const centerY =
            height * 0.5;

        const estimatedWidths =
            NAV_ITEMS.map(
                (item) =>
                    Math.max(
                        layout.fontSize *
                        1.7,
                        item.label
                            .length *
                        layout.fontSize *
                        0.52,
                    ),
            );

        const totalWidth =
            estimatedWidths.reduce(
                (
                    sum,
                    value,
                ) =>
                    sum + value,
                0,
            ) +
            layout.gap *
            (
                NAV_ITEMS.length -
                1
            );

        let cursor =
            width * 0.5 -
            totalWidth * 0.5;

        return NAV_ITEMS.map(
            (
                item,
                index,
            ) => {
                const itemWidth =
                    estimatedWidths[
                    index
                    ];

                const result = {
                    ...item,
                    x:
                        cursor +
                        itemWidth *
                        0.5,
                    y:
                        centerY,
                    width:
                        itemWidth,
                    height:
                        layout.fontSize *
                        1.5,
                    fontSize:
                        layout.fontSize,
                };

                cursor +=
                    itemWidth +
                    layout.gap;

                return result;
            },
        );
    }

    const centerX =
        width * 0.5;

    const verticalGap =
        layout.fontSize *
        1.15 +
        layout.gap;

    const totalHeight =
        verticalGap *
        (
            NAV_ITEMS.length -
            1
        );

    const startY =
        height * 0.5 -
        totalHeight * 0.5;

    return NAV_ITEMS.map(
        (
            item,
            index,
        ) => ({
            ...item,
            x: centerX,
            y:
                startY +
                index *
                verticalGap,
            width:
                Math.min(
                    width * 0.86,
                    Math.max(
                        layout.fontSize *
                        1.7,
                        item.label
                            .length *
                        layout.fontSize *
                        0.52,
                    ),
                ),
            height:
                layout.fontSize *
                1.5,
            fontSize:
                layout.fontSize,
        }),
    );
}

export default function NavNebula({
    onNavigationChange,
    onTargetChange,
    onInteractionChange,
    onNavTargetTextureChange,
}) {
    const navigate =
        useNavigate();

    const location =
        useLocation();

    const activeId =
        getCurrentNavId(
            location.pathname,
        );

    const [viewport, setViewport] =
        useState(() => {
            if (
                typeof window ===
                "undefined"
            ) {
                return {
                    width: 1440,
                    height: 900,
                };
            }

            return {
                width:
                    window.innerWidth,
                height:
                    window.innerHeight,
            };
        });

    const [
        hoveredId,
        setHoveredId,
    ] = useState(null);

    const textureCacheRef =
        useRef(
            new Map(),
        );

    const activeTextureRef =
        useRef(null);

    useEffect(() => {
        const handleResize =
            () => {
                setViewport({
                    width:
                        window.innerWidth,
                    height:
                        window.innerHeight,
                });
            };

        window.addEventListener(
            "resize",
            handleResize,
        );

        return () => {
            window.removeEventListener(
                "resize",
                handleResize,
            );
        };
    }, []);

    const targets =
        useMemo(
            () =>
                getTargetPositions(
                    viewport.width,
                    viewport.height,
                ),
            [viewport],
        );

    useEffect(() => {
        let cancelled =
            false;

        const createTextures =
            async () => {
                const textures =
                    {};

                for (
                    const item of NAV_ITEMS
                ) {
                    let texture =
                        textureCacheRef
                            .current
                            .get(
                                item.id,
                            );

                    if (
                        !texture
                    ) {
                        texture =
                            createNavTargetTexture(
                                item.label,
                                getLayout(
                                    viewport.width,
                                ).fontSize,
                            );

                        textureCacheRef
                            .current
                            .set(
                                item.id,
                                texture,
                            );
                    }

                    textures[
                        item.id
                    ] =
                        texture;
                }

                if (
                    cancelled
                ) {
                    return;
                }

                const activeTexture =
                    textures[
                    activeId
                    ] ||
                    createEmptyTargetTexture();

                activeTextureRef.current =
                    activeTexture;

                if (
                    typeof onNavTargetTextureChange ===
                    "function"
                ) {
                    onNavTargetTextureChange(
                        activeTexture,
                    );
                }

                window.dispatchEvent(
                    new CustomEvent(
                        NAV_EVENT,
                        {
                            detail: {
                                type:
                                    "texture",
                                activeId,
                                textures,
                                activeTexture,
                            },
                        },
                    ),
                );
            };

        createTextures();

        return () => {
            cancelled = true;
        };
    }, [
        activeId,
        viewport.width,
        onNavTargetTextureChange,
    ]);

    useEffect(() => {
        return () => {
            textureCacheRef.current.forEach(
                (texture) => {
                    texture.dispose();
                },
            );

            textureCacheRef.current.clear();

            if (
                activeTextureRef.current
            ) {
                activeTextureRef.current.dispose();
                activeTextureRef.current =
                    null;
            }
        };
    }, []);

    const navState =
        useMemo(
            () =>
                targets.map(
                    (item) => ({
                        ...item,
                        active:
                            item.id ===
                            activeId,
                        hovered:
                            item.id ===
                            hoveredId,
                    }),
                ),
            [
                targets,
                activeId,
                hoveredId,
            ],
        );

    useEffect(() => {
        const detail = {
            type:
                "targets",
            activeId,
            hoveredId,
            items:
                navState,
        };

        window.dispatchEvent(
            new CustomEvent(
                NAV_EVENT,
                {
                    detail,
                },
            ),
        );

        if (
            typeof onNavigationChange ===
            "function"
        ) {
            onNavigationChange(
                detail,
            );
        }

        if (
            typeof onTargetChange ===
            "function"
        ) {
            onTargetChange(
                detail,
            );
        }
    }, [
        activeId,
        hoveredId,
        navState,
        onNavigationChange,
        onTargetChange,
    ]);

    const handlePointerEnter =
        (id) => {
            setHoveredId(id);

            const detail = {
                type:
                    "enter",
                id,
            };

            window.dispatchEvent(
                new CustomEvent(
                    NAV_EVENT,
                    {
                        detail,
                    },
                ),
            );

            if (
                typeof onInteractionChange ===
                "function"
            ) {
                onInteractionChange(
                    detail,
                );
            }
        };

    const handlePointerLeave =
        (id) => {
            setHoveredId(
                (current) =>
                    current === id
                        ? null
                        : current,
            );

            const detail = {
                type:
                    "leave",
                id,
            };

            window.dispatchEvent(
                new CustomEvent(
                    NAV_EVENT,
                    {
                        detail,
                    },
                ),
            );

            if (
                typeof onInteractionChange ===
                "function"
            ) {
                onInteractionChange(
                    detail,
                );
            }
        };

    const handleNavigation =
        (item) => {
            if (
                item.path ===
                location.pathname
            ) {
                return;
            }

            navigate(
                item.path,
            );
        };

    return (
        <nav
            aria-label="Primary navigation"
            style={{
                position:
                    "fixed",
                inset: 0,
                zIndex: 100,
                pointerEvents:
                    "none",
            }}
        >
            {navState.map(
                (item) => (
                    <button
                        key={
                            item.id
                        }
                        type="button"
                        aria-label={
                            item.label
                        }
                        aria-current={
                            item.active
                                ? "page"
                                : undefined
                        }
                        onClick={() =>
                            handleNavigation(
                                item,
                            )
                        }
                        onPointerEnter={() =>
                            handlePointerEnter(
                                item.id,
                            )
                        }
                        onPointerLeave={() =>
                            handlePointerLeave(
                                item.id,
                            )
                        }
                        style={{
                            position:
                                "absolute",
                            left:
                                `${item.x}px`,
                            top:
                                `${item.y}px`,
                            width:
                                `${Math.max(
                                    item.width,
                                    100,
                                )}px`,
                            height:
                                `${Math.max(
                                    item.height,
                                    64,
                                )}px`,
                            transform:
                                "translate(-50%, -50%)",
                            padding: 0,
                            margin: 0,
                            border: 0,
                            outline:
                                "none",
                            background:
                                "transparent",
                            color:
                                "transparent",
                            fontSize: 0,
                            lineHeight: 0,
                            pointerEvents:
                                "auto",
                            cursor:
                                "pointer",
                            opacity: 0,
                        }}
                    >
                        {item.label}
                    </button>
                ),
            )}
        </nav>
    );
}

export {
    NAV_ITEMS,
    NAV_EVENT,
};