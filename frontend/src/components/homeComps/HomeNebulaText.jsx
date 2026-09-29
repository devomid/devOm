import {
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    Typography,
} from '@mui/material';

import * as THREE from 'three';

import NebulaBackground from '../nebula/nebula';

const TEXT_LINE_1 =
    'Every little idea is';

const TEXT_LINE_2 =
    'like a small particle.';

const DEVOM_TEXT =
    'devOm';

const TEXTURE_SIZE =
    512;

const PARTICLE_COUNT =
    TEXTURE_SIZE *
    TEXTURE_SIZE;

/*
 * ============================================================
 * INITIAL SENTENCE
 * ============================================================
 */

const TEXT_PARTICLE_RATIO =
    0.30;

/*
 * ============================================================
 * DEVOM
 * ============================================================
 *
 * devOm is the main identity of the site.
 *
 * It therefore uses:
 *
 * - a much larger canvas font
 * - a much larger world width
 * - a much larger world height
 * - 100% particle participation during formation
 * - 65% participation after formation
 * ============================================================
 */

const DEVOM_FULL_RATIO =
    1.0;

const DEVOM_REDUCED_RATIO =
    0.65;

const DEVOM_CANVAS_WIDTH =
    1800;

const DEVOM_CANVAS_HEIGHT =
    700;

const DEVOM_WORLD_WIDTH =
    12.5;

const DEVOM_WORLD_HEIGHT =
    5.0;

/*
 * ============================================================
 * INITIAL TEXT DIMENSIONS
 * ============================================================
 */

const TEXT_CANVAS_WIDTH =
    1600;

const TEXT_CANVAS_HEIGHT =
    520;

const TEXT_WORLD_WIDTH =
    9.0;

const TEXT_WORLD_HEIGHT =
    2.9;

/*
 * ============================================================
 * TARGET JITTER
 * ============================================================
 */

const TARGET_JITTER_XY =
    0.008;

const TARGET_JITTER_Z =
    0.048;

/*
 * ============================================================
 * WIND
 * ============================================================
 */

const WIND_START_DELAY =
    10000;

const WIND_TEXT_HOLD =
    5;

/*
 * Current nebula.jsx wind fades completely
 * between 4.0 and 4.5 seconds.
 */

const WIND_DURATION =
    4500;

/*
 * Wait one full second after wind has completely
 * finished before starting devOm.
 */

const POST_WIND_WAIT =
    1000;

/*
 * ============================================================
 * DEVOM TIMING
 * ============================================================
 *
 * The old 700ms formation was too short.
 *
 * Give the particles 1.6 seconds to gather.
 *
 * Then hold the 65% state for 5 seconds.
 * ============================================================
 */

const DEVOM_FORM_DURATION =
    1600;

const DEVOM_HOLD_DURATION =
    5000;

/*
 * ============================================================
 * LETTER-SPACED TEXT
 * ============================================================
 */

function drawLetterSpacedText(
    ctx,
    text,
    centerX,
    baselineY,
    font,
    letterSpacing
) {
    ctx.font =
        font;

    ctx.textAlign =
        'left';

    ctx.textBaseline =
        'alphabetic';

    const characters =
        [...text];

    const widths =
        characters.map(
            (character) =>
                ctx.measureText(
                    character
                ).width
        );

    const totalWidth =
        widths.reduce(
            (
                sum,
                width
            ) =>
                sum +
                width,
            0
        ) +
        Math.max(
            0,
            characters.length - 1
        ) *
        letterSpacing;

    let x =
        centerX -
        totalWidth / 2;

    characters.forEach(
        (
            character,
            index
        ) => {
            ctx.fillText(
                character,
                x,
                baselineY
            );

            x +=
                widths[index] +
                letterSpacing;
        }
    );
}

/*
 * ============================================================
 * CREATE INITIAL SENTENCE TARGET
 * ============================================================
 *
 * This intentionally keeps the original implementation
 * behavior so both lines remain present.
 * ============================================================
 */

function createSentenceTargetTexture() {
    const canvas =
        document.createElement(
            'canvas'
        );

    canvas.width =
        TEXT_CANVAS_WIDTH;

    canvas.height =
        TEXT_CANVAS_HEIGHT;

    const ctx =
        canvas.getContext(
            '2d',
            {
                willReadFrequently:
                    true,
            }
        );

    if (!ctx) {
        return null;
    }

    ctx.clearRect(
        0,
        0,
        TEXT_CANVAS_WIDTH,
        TEXT_CANVAS_HEIGHT
    );

    ctx.fillStyle =
        '#ffffff';

    const fontSize =
        170;

    const font =
        `550 ${fontSize}px ` +
        `"Neue Montreal", "Helvetica Neue", Arial, sans-serif`;

    const letterSpacing =
        fontSize *
        0.018;

    const centerX =
        TEXT_CANVAS_WIDTH /
        2;

    const centerY =
        TEXT_CANVAS_HEIGHT /
        2;

    const lineGap =
        fontSize *
        0.18;

    const lineOffset =
        (
            fontSize +
            lineGap
        ) /
        2;

    const baselineCorrection =
        fontSize *
        0.34;

    const firstLineBaseline =
        centerY -
        lineOffset +
        baselineCorrection;

    const secondLineBaseline =
        centerY +
        lineOffset +
        baselineCorrection;

    /*
     * IMPORTANT:
     *
     * Both lines are explicitly drawn.
     */

    drawLetterSpacedText(
        ctx,
        TEXT_LINE_1,
        centerX,
        firstLineBaseline,
        font,
        letterSpacing
    );

    drawLetterSpacedText(
        ctx,
        TEXT_LINE_2,
        centerX,
        secondLineBaseline,
        font,
        letterSpacing
    );

    const imageData =
        ctx.getImageData(
            0,
            0,
            TEXT_CANVAS_WIDTH,
            TEXT_CANVAS_HEIGHT
        );

    const pixels =
        imageData.data;

    const candidates =
        [];

    for (
        let y = 0;
        y < TEXT_CANVAS_HEIGHT;
        y += 1
    ) {
        for (
            let x = 0;
            x < TEXT_CANVAS_WIDTH;
            x += 1
        ) {
            const pixelIndex =
                (
                    y *
                    TEXT_CANVAS_WIDTH +
                    x
                ) *
                4;

            const alpha =
                pixels[
                pixelIndex + 3
                ];

            if (
                alpha > 100
            ) {
                candidates.push({
                    x,
                    y,
                    alpha,
                });
            }
        }
    }

    const requiredParticles =
        Math.floor(
            PARTICLE_COUNT *
            TEXT_PARTICLE_RATIO
        );

    const targetData =
        new Float32Array(
            PARTICLE_COUNT * 4
        );

    for (
        let i = 0;
        i < PARTICLE_COUNT;
        i += 1
    ) {
        const offset =
            i * 4;

        if (
            i <
            requiredParticles &&
            candidates.length > 0
        ) {
            /*
             * Keep the original proportional mapping.
             *
             * This preserves the complete two-line shape.
             */

            const candidateIndex =
                Math.floor(
                    (
                        i /
                        requiredParticles
                    ) *
                    candidates.length
                );

            const particle =
                candidates[
                Math.min(
                    candidateIndex,
                    candidates.length - 1
                )
                ];

            const normalizedX =
                particle.x /
                TEXT_CANVAS_WIDTH;

            const normalizedY =
                particle.y /
                TEXT_CANVAS_HEIGHT;

            const worldX =
                (
                    normalizedX -
                    0.5
                ) *
                TEXT_WORLD_WIDTH;

            const worldY =
                (
                    0.5 -
                    normalizedY
                ) *
                TEXT_WORLD_HEIGHT;

            targetData[offset] =
                worldX +
                (
                    Math.random() -
                    0.5
                ) *
                TARGET_JITTER_XY;

            targetData[offset + 1] =
                worldY +
                (
                    Math.random() -
                    0.5
                ) *
                TARGET_JITTER_XY;

            targetData[offset + 2] =
                (
                    Math.random() -
                    0.5
                ) *
                TARGET_JITTER_Z;

            targetData[offset + 3] =
                particle.alpha /
                255;
        } else {
            targetData[offset] =
                0;

            targetData[offset + 1] =
                0;

            targetData[offset + 2] =
                0;

            targetData[offset + 3] =
                0;
        }
    }

    const texture =
        new THREE.DataTexture(
            targetData,
            TEXTURE_SIZE,
            TEXTURE_SIZE,
            THREE.RGBAFormat,
            THREE.FloatType
        );

    texture.needsUpdate =
        true;

    texture.magFilter =
        THREE.NearestFilter;

    texture.minFilter =
        THREE.NearestFilter;

    texture.wrapS =
        THREE.ClampToEdgeWrapping;

    texture.wrapT =
        THREE.ClampToEdgeWrapping;

    return texture;
}

/*
 * ============================================================
 * CREATE DEVOM TARGET
 * ============================================================
 *
 * ratio:
 *
 * 1.00 -> all particles
 * 0.65 -> 65% of particles
 *
 * The remaining particles receive alpha = 0 and therefore
 * remain free in nebula.jsx.
 * ============================================================
 */

function createDevOmTargetTexture(
    ratio
) {
    const canvas =
        document.createElement(
            'canvas'
        );

    canvas.width =
        DEVOM_CANVAS_WIDTH;

    canvas.height =
        DEVOM_CANVAS_HEIGHT;

    const ctx =
        canvas.getContext(
            '2d',
            {
                willReadFrequently:
                    true,
            }
        );

    if (!ctx) {
        return null;
    }

    ctx.clearRect(
        0,
        0,
        DEVOM_CANVAS_WIDTH,
        DEVOM_CANVAS_HEIGHT
    );

    ctx.fillStyle =
        '#ffffff';

    /*
     * Much larger than the sentence.
     *
     * This is deliberately the main visual identity.
     */

    const fontSize =
        390;

    const font =
        `550 ${fontSize}px ` +
        `"Neue Montreal", "Helvetica Neue", Arial, sans-serif`;

    const letterSpacing =
        fontSize *
        0.018;

    const centerX =
        DEVOM_CANVAS_WIDTH /
        2;

    const centerY =
        DEVOM_CANVAS_HEIGHT /
        2;

    const baselineCorrection =
        fontSize *
        0.34;

    const baseline =
        centerY +
        baselineCorrection;

    drawLetterSpacedText(
        ctx,
        DEVOM_TEXT,
        centerX,
        baseline,
        font,
        letterSpacing
    );

    const imageData =
        ctx.getImageData(
            0,
            0,
            DEVOM_CANVAS_WIDTH,
            DEVOM_CANVAS_HEIGHT
        );

    const pixels =
        imageData.data;

    const candidates =
        [];

    for (
        let y = 0;
        y < DEVOM_CANVAS_HEIGHT;
        y += 1
    ) {
        for (
            let x = 0;
            x < DEVOM_CANVAS_WIDTH;
            x += 1
        ) {
            const pixelIndex =
                (
                    y *
                    DEVOM_CANVAS_WIDTH +
                    x
                ) *
                4;

            const alpha =
                pixels[
                pixelIndex + 3
                ];

            if (
                alpha > 100
            ) {
                candidates.push({
                    x,
                    y,
                    alpha,
                });
            }
        }
    }

    const targetData =
        new Float32Array(
            PARTICLE_COUNT * 4
        );

    const requiredParticles =
        Math.floor(
            PARTICLE_COUNT *
            ratio
        );

    for (
        let i = 0;
        i < PARTICLE_COUNT;
        i += 1
    ) {
        const offset =
            i * 4;

        if (
            i <
            requiredParticles &&
            candidates.length > 0
        ) {
            /*
             * Cycle through the complete letter shape.
             *
             * This guarantees that 100% of particles can
             * participate without clustering only on the
             * beginning of the word.
             */

            const candidateIndex =
                Math.floor(
                    (
                        i /
                        requiredParticles
                    ) *
                    candidates.length
                );

            const particle =
                candidates[
                Math.min(
                    candidateIndex,
                    candidates.length - 1
                )
                ];

            const normalizedX =
                particle.x /
                DEVOM_CANVAS_WIDTH;

            const normalizedY =
                particle.y /
                DEVOM_CANVAS_HEIGHT;

            const worldX =
                (
                    normalizedX -
                    0.5
                ) *
                DEVOM_WORLD_WIDTH;

            const worldY =
                (
                    0.5 -
                    normalizedY
                ) *
                DEVOM_WORLD_HEIGHT;

            targetData[offset] =
                worldX +
                (
                    Math.random() -
                    0.5
                ) *
                TARGET_JITTER_XY;

            targetData[offset + 1] =
                worldY +
                (
                    Math.random() -
                    0.5
                ) *
                TARGET_JITTER_XY;

            targetData[offset + 2] =
                (
                    Math.random() -
                    0.5
                ) *
                TARGET_JITTER_Z;

            targetData[offset + 3] =
                particle.alpha /
                255;
        } else {
            targetData[offset] =
                0;

            targetData[offset + 1] =
                0;

            targetData[offset + 2] =
                0;

            targetData[offset + 3] =
                0;
        }
    }

    const texture =
        new THREE.DataTexture(
            targetData,
            TEXTURE_SIZE,
            TEXTURE_SIZE,
            THREE.RGBAFormat,
            THREE.FloatType
        );

    texture.needsUpdate =
        true;

    texture.magFilter =
        THREE.NearestFilter;

    texture.minFilter =
        THREE.NearestFilter;

    texture.wrapS =
        THREE.ClampToEdgeWrapping;

    texture.wrapT =
        THREE.ClampToEdgeWrapping;

    return texture;
}

/*
 * ============================================================
 * COMPONENT
 * ============================================================
 */

export default function HomeNebulaText() {
    /*
     * --------------------------------------------------------
     * SENTENCE
     * --------------------------------------------------------
     */

    const textTargetTexture =
        useMemo(
            () =>
                createSentenceTargetTexture(),
            []
        );

    /*
     * --------------------------------------------------------
     * DEVOM FULL
     * --------------------------------------------------------
     */

    const devOmFullTargetTexture =
        useMemo(
            () =>
                createDevOmTargetTexture(
                    DEVOM_FULL_RATIO
                ),
            []
        );

    /*
     * --------------------------------------------------------
     * DEVOM REDUCED
     * --------------------------------------------------------
     */

    const devOmReducedTargetTexture =
        useMemo(
            () =>
                createDevOmTargetTexture(
                    DEVOM_REDUCED_RATIO
                ),
            []
        );

    /*
     * --------------------------------------------------------
     * CURRENT TARGET
     * --------------------------------------------------------
     */

    const [
        currentTargetTexture,
        setCurrentTargetTexture,
    ] = useState(
        textTargetTexture
    );

    /*
     * --------------------------------------------------------
     * TEXT ENABLED
     * --------------------------------------------------------
     */

    const [
        textEnabled,
        setTextEnabled,
    ] = useState(true);

    /*
     * --------------------------------------------------------
     * WIND
     * --------------------------------------------------------
     */

    const [
        windActive,
        setWindActive,
    ] = useState(false);

    /*
     * --------------------------------------------------------
     * TIMELINE
     * --------------------------------------------------------
     */

    useEffect(() => {
        let windTimer;
        let releaseTextTimer;
        let devOmTimer;
        let devOmReduceTimer;
        let devOmReleaseTimer;

        /*
         * ====================================================
         * WIND
         * ====================================================
         */

        windTimer =
            window.setTimeout(
                () => {
                    setWindActive(
                        true
                    );

                    /*
                     * Preserve your current wind behavior.
                     */

                    releaseTextTimer =
                        window.setTimeout(
                            () => {
                                setTextEnabled(
                                    false
                                );
                            },
                            WIND_TEXT_HOLD
                        );

                    /*
                     * ====================================================
                     * DEVOM START
                     * ====================================================
                     *
                     * 10s
                     * + 4.5s wind
                     * + 1s wait
                     * = 15.5s
                     */

                    devOmTimer =
                        window.setTimeout(
                            () => {
                                /*
                                 * 100% PARTICLES
                                 */

                                setCurrentTargetTexture(
                                    devOmFullTargetTexture
                                );

                                setTextEnabled(
                                    true
                                );

                                /*
                                 * ====================================================
                                 * 100% -> 65%
                                 * ====================================================
                                 */

                                devOmReduceTimer =
                                    window.setTimeout(
                                        () => {
                                            setCurrentTargetTexture(
                                                devOmReducedTargetTexture
                                            );

                                            /*
                                             * ====================================================
                                             * HOLD
                                             * ====================================================
                                             */

                                            devOmReleaseTimer =
                                                window.setTimeout(
                                                    () => {
                                                        /*
                                                         * Release all devOm
                                                         * target participation.
                                                         */

                                                        setTextEnabled(
                                                            false
                                                        );
                                                    },
                                                    DEVOM_HOLD_DURATION
                                                );
                                        },
                                        DEVOM_FORM_DURATION
                                    );
                            },
                            WIND_DURATION +
                            POST_WIND_WAIT
                        );
                },
                WIND_START_DELAY
            );

        return () => {
            window.clearTimeout(
                windTimer
            );

            if (
                releaseTextTimer
            ) {
                window.clearTimeout(
                    releaseTextTimer
                );
            }

            if (
                devOmTimer
            ) {
                window.clearTimeout(
                    devOmTimer
                );
            }

            if (
                devOmReduceTimer
            ) {
                window.clearTimeout(
                    devOmReduceTimer
                );
            }

            if (
                devOmReleaseTimer
            ) {
                window.clearTimeout(
                    devOmReleaseTimer
                );
            }
        };
    }, [
        devOmFullTargetTexture,
        devOmReducedTargetTexture,
    ]);

    /*
     * --------------------------------------------------------
     * DISPOSE
     * --------------------------------------------------------
     */

    useEffect(() => {
        return () => {
            textTargetTexture?.dispose();

            devOmFullTargetTexture?.dispose();

            devOmReducedTargetTexture?.dispose();
        };
    }, [
        textTargetTexture,
        devOmFullTargetTexture,
        devOmReducedTargetTexture,
    ]);

    /*
     * --------------------------------------------------------
     * RENDER
     * --------------------------------------------------------
     */

    return (
        <>
            <div
                style={{
                    position:
                        'absolute',

                    inset: 0,

                    pointerEvents:
                        'none',

                    display:
                        'flex',

                    alignItems:
                        'center',

                    justifyContent:
                        'center',

                    zIndex: 2,
                }}
            >
                <Typography
                    component="div"
                    sx={{
                        width:
                            'min(90vw, 1200px)',

                        textAlign:
                            'center',

                        fontFamily:
                            '"Neue Montreal", "Helvetica Neue", Arial, sans-serif',

                        fontSize:
                            'clamp(1.85rem, 3.15vw, 4rem)',

                        fontWeight:
                            550,

                        lineHeight:
                            1.12,

                        letterSpacing:
                            '0.018em',

                        color:
                            'transparent',

                        userSelect:
                            'none',

                        whiteSpace:
                            'normal',
                    }}
                >
                    {TEXT_LINE_1}

                    <br />

                    {TEXT_LINE_2}
                </Typography>
            </div>

            <NebulaBackground
                textEnabled={
                    textEnabled &&
                    Boolean(
                        currentTargetTexture
                    )
                }

                textTargetTexture={
                    currentTargetTexture
                }

                textStrength={
                    3.3
                }

                homeWindActive={
                    windActive
                }
            />
        </>
    );
}