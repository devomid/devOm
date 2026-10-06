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

const WORLD_WIDTH = 12.0;
const WORLD_HEIGHT = 4.6666667;

const FONT_FAMILY =
    '"Helvetica Neue", Helvetica, Arial, sans-serif';

const FONT_WEIGHT = 500;

const BASE_FONT_SIZE = 54;

const PARTICLE_DENSITY = 0.36;

const NAV_LAYOUT = [
    {
        x: 0.16,
        y: 0.50,
        align: "center",
    },
    {
        x: 0.36,
        y: 0.50,
        align: "center",
    },
    {
        x: 0.57,
        y: 0.50,
        align: "center",
    },
    {
        x: 0.76,
        y: 0.50,
        align: "center",
    },
    {
        x: 0.91,
        y: 0.50,
        align: "center",
    },
];

function getResponsiveFontSize() {
    if (typeof window === "undefined") {
        return BASE_FONT_SIZE;
    }

    const width = window.innerWidth;

    if (width < 600) {
        return 34;
    }

    if (width < 900) {
        return 42;
    }

    if (width < 1200) {
        return 48;
    }

    return BASE_FONT_SIZE;
}

function getResponsiveParticleDensity() {
    if (typeof window === "undefined") {
        return PARTICLE_DENSITY;
    }

    const width = window.innerWidth;

    if (width < 600) {
        return 0.50;
    }

    if (width < 900) {
        return 0.43;
    }

    if (width < 1200) {
        return 0.39;
    }

    return PARTICLE_DENSITY;
}

function drawNavText(
    context,
    item,
    index,
    fontSize,
) {
    const layout = NAV_LAYOUT[index];

    context.font =
        `${FONT_WEIGHT} ${fontSize}px ${FONT_FAMILY}`;

    context.textAlign = layout.align;
    context.textBaseline = "middle";

    const x =
        CANVAS_WIDTH * layout.x;

    const y =
        CANVAS_HEIGHT * layout.y;

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
        canvas.getContext("2d", {
            willReadFrequently: true,
        });

    const image =
        context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
        );

    const candidates = [];

    for (
        let y = 0;
        y < canvas.height;
        y += 2
    ) {
        for (
            let x = 0;
            x < canvas.width;
            x += 2
        ) {
            const index =
                (y * canvas.width + x) * 4;

            const alpha =
                image.data[index + 3];

            if (alpha < 100) {
                continue;
            }

            candidates.push({
                x,
                y,
                alpha: alpha / 255,
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

    return selected;
}

function createCombinedNavTargetTexture() {

    const canvas =
        document.createElement("canvas");

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const context =
        canvas.getContext("2d", {
            willReadFrequently: true,
        });

    context.clearRect(
        0,
        0,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
    );

    context.fillStyle = "#ffffff";

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

    const scaleX =
        WORLD_WIDTH / CANVAS_WIDTH;

    const scaleY =
        WORLD_HEIGHT / CANVAS_HEIGHT;

    const offsetX =
        -WORLD_WIDTH / 2;

    const offsetY =
        WORLD_HEIGHT / 2;

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

    texture.needsUpdate = true;

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
                window.setTimeout(() => {
                    const nextTexture =
                        createCombinedNavTargetTexture();

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
                }, 80);
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
                textureRef.current = null;
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
    }, [location.pathname]);

    const handleNavigate = (
        path,
    ) => {
        if (
            location.pathname === path
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
                pointerEvents: "none",
            }}
        >
            {NAV_ITEMS.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    aria-label={item.label}
                    onClick={() =>
                        handleNavigate(
                            item.path,
                        )
                    }
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: "100%",
                        height: "100%",
                        border: 0,
                        padding: 0,
                        margin: 0,
                        background:
                            "transparent",
                        cursor: "pointer",
                        pointerEvents:
                            "none",
                    }}
                />
            ))}
        </nav>
    );
}