import {
    useEffect,
    useRef,
} from "react";
import {
    useLocation,
    useNavigate,
} from "react-router-dom";
import * as THREE from "three";

import {
    setGlobalNavTargetTexture,
} from "../nebula/nebula";

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

const NAV_EVENT = "devom-nav-nebula";

function getParticleTextureSize() {
    if (typeof window === "undefined") {
        return 512;
    }

    const width = window.innerWidth;

    if (width < 768) {
        return 256;
    }

    if (width < 1024) {
        return 384;
    }

    return 512;
}

const CANVAS_WIDTH = 1800;
const CANVAS_HEIGHT = 700;

const CAMERA_Z = 10.0;
const CAMERA_FOV = 60.0;

function getWorldHeight() {
    return (
        2 *
        CAMERA_Z *
        Math.tan(
            THREE.MathUtils.degToRad(
                CAMERA_FOV / 2,
            ),
        )
    );
}

function getWorldWidth() {
    if (typeof window === "undefined") {
        return getWorldHeight();
    }

    return (
        getWorldHeight() *
        (
            window.innerWidth /
            Math.max(
                window.innerHeight,
                1,
            )
        )
    );
}

const FONT_FAMILY =
    '"Helvetica Neue", Helvetica, Arial, sans-serif';

const FONT_WEIGHT = 300;

/*
 * Nav-bar sized typography.
 *
 * These are deliberately much smaller than the previous
 * headline-like values.
 */
const BASE_FONT_SIZE = 30;

function getResponsiveFontSize() {
    if (typeof window === "undefined") {
        return BASE_FONT_SIZE;
    }

    const width = window.innerWidth;

    if (width < 400) {
        return 17;
    }

    if (width < 600) {
        return 20;
    }

    if (width < 768) {
        return 22;
    }

    if (width < 1024) {
        return 24;
    }

    if (width < 1440) {
        return 27;
    }

    return BASE_FONT_SIZE;
}

/*
 * Desktop keeps the requested 0.85 density.
 *
 * Smaller screens use less density because their particle
 * texture is also smaller. The letters still remain dense,
 * but we avoid wasting particles on tiny nav text.
 */
const PARTICLE_DENSITY = 0.85;

function getResponsiveParticleDensity() {
    if (typeof window === "undefined") {
        return PARTICLE_DENSITY;
    }

    const width = window.innerWidth;

    if (width < 400) {
        return 0.70;
    }

    if (width < 600) {
        return 0.74;
    }

    if (width < 768) {
        return 0.78;
    }

    if (width < 1024) {
        return 0.82;
    }

    return PARTICLE_DENSITY;
}

/*
 * The navigation occupies approximately the middle 70%
 * of the available canvas.
 *
 * The vertical position is intentionally unchanged.
 */
const NAV_LAYOUT = [
    {
        x: 0.20,
        y: 0.055,
        align: "center",
    },
    {
        x: 0.35,
        y: 0.055,
        align: "center",
    },
    {
        x: 0.50,
        y: 0.055,
        align: "center",
    },
    {
        x: 0.65,
        y: 0.055,
        align: "center",
    },
    {
        x: 0.80,
        y: 0.055,
        align: "center",
    },
];

function drawNavText(
    context,
    item,
    index,
    fontSize,
) {
    const layout =
        NAV_LAYOUT[index];

    context.font =
        `${FONT_WEIGHT} ${fontSize}px ${FONT_FAMILY}`;

    context.textAlign =
        layout.align;

    context.textBaseline =
        "middle";

    const x =
        CANVAS_WIDTH *
        layout.x;

    const y =
        CANVAS_HEIGHT *
        layout.y;

    context.fillText(
        item.label,
        x,
        y,
    );
}

function collectCandidates(
    canvas,
    density,
) {
    const context =
        canvas.getContext(
            "2d",
            {
                willReadFrequently: true,
            },
        );

    const image =
        context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
        );

    const candidates = [];

    /*
     * IMPORTANT:
     *
     * Scan every pixel.
     *
     * The previous step of 2 skipped a large amount
     * of the actual anti-aliased letter geometry.
     *
     * The density value is applied AFTER this collection.
     */
    for (
        let y = 0;
        y < canvas.height;
        y += 1
    ) {
        for (
            let x = 0;
            x < canvas.width;
            x += 1
        ) {
            const index =
                (
                    y *
                    canvas.width +
                    x
                ) * 4;

            const alpha =
                image.data[
                index + 3
                ];

            if (alpha < 100) {
                continue;
            }

            candidates.push({
                x,
                y,
                alpha:
                    alpha / 255,
            });
        }
    }

    if (!candidates.length) {
        return [];
    }

    const textureSize =
        getParticleTextureSize();

    const targetCount =
        Math.min(
            Math.floor(
                candidates.length *
                density,
            ),
            textureSize *
            textureSize,
        );

    if (
        targetCount >=
        candidates.length
    ) {
        return candidates;
    }

    const selected = [];

    const step =
        candidates.length /
        targetCount;

    for (
        let i = 0;
        i < targetCount;
        i += 1
    ) {
        const index =
            Math.min(
                candidates.length - 1,
                Math.floor(
                    i * step,
                ),
            );

        selected.push(
            candidates[index],
        );
    }

    console.log(
        "[NavNebula] target build",
        {
            textureSize,
            density,
            candidates:
                candidates.length,
            selected:
                selected.length,
            first:
                selected.slice(
                    0,
                    5,
                ),
            last:
                selected.slice(
                    -5,
                ),
        },
    );

    return selected;
}

function createCombinedNavTargetTexture(
    activePath,
) {
    const canvas =
        document.createElement(
            "canvas",
        );

    canvas.width =
        CANVAS_WIDTH;

    canvas.height =
        CANVAS_HEIGHT;

    const context =
        canvas.getContext(
            "2d",
            {
                willReadFrequently: true,
            },
        );

    context.clearRect(
        0,
        0,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
    );

    context.fillStyle =
        "#ffffff";

    const fontSize =
        getResponsiveFontSize();

    NAV_ITEMS.forEach(
        (item, index) => {
            drawNavText(
                context,
                item,
                index,
                fontSize,
            );
        },
    );

    /*
     * Active-page indicator.
     *
     * The dot is drawn into the same canvas as the
     * navigation text, so it becomes part of the
     * exact same particle target texture.
     *
     * Its X coordinate is taken directly from the
     * active word's NAV_LAYOUT entry. This guarantees
     * that the dot is horizontally centered under
     * that word regardless of the label's width.
     */
    const activeIndex =
        NAV_ITEMS.findIndex(
            (item) =>
                item.path === activePath,
        );

    if (activeIndex !== -1) {
        const activeLayout =
            NAV_LAYOUT[activeIndex];

        const dotX =
            CANVAS_WIDTH *
            activeLayout.x;

        const dotY =
            CANVAS_HEIGHT *
            activeLayout.y +
            fontSize * 0.95;

        const dotRadius =
            Math.max(
                2,
                fontSize * 0.10,
            );

        context.beginPath();

        context.arc(
            dotX,
            dotY,
            dotRadius,
            0,
            Math.PI * 2,
        );

        context.fill();
    }

    const candidates =
        collectCandidates(
            canvas,
            getResponsiveParticleDensity(),
        );

    const textureSize =
        getParticleTextureSize();

    const targetData =
        new Float32Array(
            textureSize *
            textureSize *
            4,
        );

    /*
     * Keep the existing world-space mapping.
     *
     * Do NOT change this for the nav-bar sizing work.
     */
    const worldWidth =
        getWorldWidth();

    const worldHeight =
        getWorldHeight();

    const scaleX =
        worldWidth /
        CANVAS_WIDTH;

    const scaleY =
        worldHeight /
        CANVAS_HEIGHT;

    const offsetX =
        -worldWidth / 2;

    const offsetY =
        worldHeight / 2;

    const maxParticles =
        textureSize *
        textureSize;

    const count =
        Math.min(
            candidates.length,
            maxParticles,
        );

    for (
        let i = 0;
        i < count;
        i += 1
    ) {
        const candidate =
            candidates[i];

        const textureIndex =
            i * 4;

        const worldX =
            offsetX +
            candidate.x *
            scaleX;

        const worldY =
            offsetY -
            candidate.y *
            scaleY;

        targetData[
            textureIndex
        ] = worldX;

        targetData[
            textureIndex + 1
        ] = worldY;

        targetData[
            textureIndex + 2
        ] = 0;

        targetData[
            textureIndex + 3
        ] =
            candidate.alpha;
    }

    for (
        let i = count;
        i < maxParticles;
        i += 1
    ) {
        const textureIndex =
            i * 4;

        targetData[
            textureIndex
        ] = 0;

        targetData[
            textureIndex + 1
        ] = 0;

        targetData[
            textureIndex + 2
        ] = 0;

        targetData[
            textureIndex + 3
        ] = 0;
    }

    const texture =
        new THREE.DataTexture(
            targetData,
            textureSize,
            textureSize,
            THREE.RGBAFormat,
            THREE.FloatType,
        );

    texture.minFilter =
        THREE.NearestFilter;

    texture.magFilter =
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

export default function NavNebula() {
    const navigate =
        useNavigate();

    const location =
        useLocation();

    const textureRef =
        useRef(null);

    const rebuildTimerRef =
        useRef(null);

    useEffect(() => {
        const rebuild = () => {
            if (
                rebuildTimerRef.current
            ) {
                clearTimeout(
                    rebuildTimerRef.current,
                );
            }

            rebuildTimerRef.current =
                window.setTimeout(
                    () => {
                        const nextTexture =
                            createCombinedNavTargetTexture(
                                location.pathname,
                            );

                        if (
                            textureRef.current
                        ) {
                            textureRef.current.dispose();
                        }

                        textureRef.current =
                            nextTexture;

                        setGlobalNavTargetTexture(
                            nextTexture,
                        );

                        window.dispatchEvent(
                            new CustomEvent(
                                NAV_EVENT,
                                {
                                    detail: {
                                        activePath:
                                            location.pathname,
                                    },
                                },
                            ),
                        );
                    },
                    80,
                );
        };

        rebuild();

        window.addEventListener(
            "resize",
            rebuild,
        );

        return () => {
            window.removeEventListener(
                "resize",
                rebuild,
            );

            if (
                rebuildTimerRef.current
            ) {
                clearTimeout(
                    rebuildTimerRef.current,
                );
            }

            setGlobalNavTargetTexture(
                null,
            );

            if (
                textureRef.current
            ) {
                textureRef.current.dispose();

                textureRef.current =
                    null;
            }
        };
    }, []);

    useEffect(() => {
        window.dispatchEvent(
            new CustomEvent(
                NAV_EVENT,
                {
                    detail: {
                        activePath:
                            location.pathname,
                    },
                },
            ),
        );
    }, [
        location.pathname,
    ]);

    const handleNavigate = (
        path,
    ) => {
        if (
            location.pathname ===
            path
        ) {
            return;
        }

        navigate(path);
    };

    return (
        <nav
            aria-label="Primary navigation"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100,
                pointerEvents:
                    "auto",
            }}
        >
            {NAV_ITEMS.map(
                (item, index) => (
                    <button
                        key={item.id}
                        type="button"
                        aria-label={
                            item.label
                        }
                        onClick={() =>
                            handleNavigate(
                                item.path,
                            )
                        }
                        style={{
                            position: "absolute",
                            left: `${NAV_LAYOUT[index].x * 100}%`,
                            top: `${NAV_LAYOUT[index].y * 100}%`,
                            transform: "translate(-50%, -50%)",
                            width: `${Math.max(
                                70,
                                getResponsiveFontSize() *
                                (item.label.length * 0.62)
                            )}px`,
                            height: `${Math.max(32, getResponsiveFontSize() * 1.8)}px`,
                            background: "transparent",
                            border: "none",
                            padding: 0,
                            margin: 0,
                            pointerEvents: "auto",
                            cursor: "pointer",
                        }}
                    />
                ),
            )}
        </nav>
    );
}