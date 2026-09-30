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
import { colors } from '../../design/colors';

const TEXT_LINE_1 =
    'Every little idea is';

const TEXT_LINE_2 =
    'like a small particle.';

const DEVOM_TEXT =
    'devOm';

/*
 * ============================================================
 * FINAL HOME TEXT
 * ============================================================
 */

const FINAL_TEXT_LINE_1 =
    'Web. Mobile. Systems. Interfaces.';

const FINAL_TEXT_LINE_2 =
    'Software built with attention';

const FINAL_TEXT_LINE_3 =
    'to know how it works and how it feels';

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
 * FINAL TEXT
 * ============================================================
 */

const FINAL_TEXT_PARTICLE_RATIO =
    0.30;

const FINAL_TEXT_CANVAS_WIDTH =
    1800;

const FINAL_TEXT_CANVAS_HEIGHT =
    850;

const FINAL_TEXT_WORLD_WIDTH =
    12.5;

const FINAL_TEXT_WORLD_HEIGHT =
    4.8;

/*
 * This moves the final particle text below the fixed
 * MUI devOm.
 *
 * The camera does not move.
 * The MUI devOm does not move.
 */

const FINAL_TEXT_OFFSET_Y =
    -2.8;

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
 * The 100% devOm formation is intentionally very fast.
 *
 * All particles should gather almost immediately so the
 * transition feels cinematic and dramatic rather than
 * slowly assembling.
 *
 * After that:
 *
 * 100% -> 65%
 *
 * The 65% devOm state remains on screen for a long hold so
 * devOm has enough visual importance as the identity of the
 * website.
 * ============================================================
 */

const DEVOM_FORM_DURATION =
    550;

const DEVOM_HOLD_DURATION =
    8000;

/*
 * ============================================================
 * MUI DEVOM
 * ============================================================
 *
 * The solid MUI devOm should appear late in the particle
 * hold, close to the moment when the particles are released.
 *
 * The delay starts after the 100% -> 65% transition.
 * ============================================================
 */

const DEVOM_MUI_FADE_DELAY =
    7300;

const DEVOM_MUI_FADE_DURATION =
    7100;

/*
 * ============================================================
 * FINAL TEXT DELAY
 * ============================================================
 *
 * This controls the delay BETWEEN:
 *
 * 1. MUI devOm finishing its fade-in
 * 2. Final nebula text starting
 *
 * Example:
 *
 * 0ms
 *    MUI fade starts
 *
 * 7100ms
 *    MUI fade finishes
 *
 * + FINAL_TEXT_DELAY_AFTER_MUI
 *    final nebula target is activated
 *
 * Set this to 10 for a 10ms delay.
 * Set this to 1000 for a 1 second delay.
 * ============================================================
 */

const FINAL_TEXT_DELAY_AFTER_MUI =
    700;

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
 * CREATE FINAL TEXT TARGET
 * ============================================================
 */

function createFinalTextTargetTexture() {
    const canvas =
        document.createElement(
            'canvas'
        );

    canvas.width =
        FINAL_TEXT_CANVAS_WIDTH;

    canvas.height =
        FINAL_TEXT_CANVAS_HEIGHT;

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
        FINAL_TEXT_CANVAS_WIDTH,
        FINAL_TEXT_CANVAS_HEIGHT
    );

    ctx.fillStyle =
        '#ffffff';

    const fontSize =
        85;

    const font =
        `550 ${fontSize}px ` +
        `"Neue Montreal", "Helvetica Neue", Arial, sans-serif`;

    const letterSpacing =
        fontSize *
        0.018;

    const centerX =
        FINAL_TEXT_CANVAS_WIDTH /
        2;

    const centerY =
        FINAL_TEXT_CANVAS_HEIGHT /
        2;

    const lineGap =
        fontSize *
        0.18;

    const lineHeight =
        fontSize +
        lineGap;

    const baselineCorrection =
        fontSize *
        0.34;

    const firstLineBaseline =
        centerY -
        lineHeight +
        baselineCorrection;

    const secondLineBaseline =
        centerY +
        baselineCorrection;

    const thirdLineBaseline =
        centerY +
        lineHeight +
        baselineCorrection;

    drawLetterSpacedText(
        ctx,
        FINAL_TEXT_LINE_1,
        centerX,
        firstLineBaseline,
        font,
        letterSpacing
    );

    drawLetterSpacedText(
        ctx,
        FINAL_TEXT_LINE_2,
        centerX,
        secondLineBaseline,
        font,
        letterSpacing
    );

    drawLetterSpacedText(
        ctx,
        FINAL_TEXT_LINE_3,
        centerX,
        thirdLineBaseline,
        font,
        letterSpacing
    );

    const imageData =
        ctx.getImageData(
            0,
            0,
            FINAL_TEXT_CANVAS_WIDTH,
            FINAL_TEXT_CANVAS_HEIGHT
        );

    const pixels =
        imageData.data;

    const candidates =
        [];

    for (
        let y = 0;
        y < FINAL_TEXT_CANVAS_HEIGHT;
        y += 1
    ) {
        for (
            let x = 0;
            x < FINAL_TEXT_CANVAS_WIDTH;
            x += 1
        ) {
            const pixelIndex =
                (
                    y *
                    FINAL_TEXT_CANVAS_WIDTH +
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
            FINAL_TEXT_PARTICLE_RATIO
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
                FINAL_TEXT_CANVAS_WIDTH;

            const normalizedY =
                particle.y /
                FINAL_TEXT_CANVAS_HEIGHT;

            const worldX =
                (
                    normalizedX -
                    0.5
                ) *
                FINAL_TEXT_WORLD_WIDTH;

            const worldY =
                (
                    0.5 -
                    normalizedY
                ) *
                FINAL_TEXT_WORLD_HEIGHT;

            targetData[offset] =
                worldX +
                (
                    Math.random() -
                    0.5
                ) *
                TARGET_JITTER_XY;

            targetData[offset + 1] =
                worldY +
                FINAL_TEXT_OFFSET_Y +
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
    const textTargetTexture =
        useMemo(
            () =>
                createSentenceTargetTexture(),
            []
        );

    const devOmFullTargetTexture =
        useMemo(
            () =>
                createDevOmTargetTexture(
                    DEVOM_FULL_RATIO
                ),
            []
        );

    const devOmReducedTargetTexture =
        useMemo(
            () =>
                createDevOmTargetTexture(
                    DEVOM_REDUCED_RATIO
                ),
            []
        );

    const finalTextTargetTexture =
        useMemo(
            () =>
                createFinalTextTargetTexture(),
            []
        );

    const [
        currentTargetTexture,
        setCurrentTargetTexture,
    ] = useState(
        textTargetTexture
    );

    const [
        textEnabled,
        setTextEnabled,
    ] = useState(true);

    const [
        windActive,
        setWindActive,
    ] = useState(false);

    const [
        devOmMuiVisible,
        setDevOmMuiVisible,
    ] = useState(false);

    /*
     * ========================================================
     * FINAL MUI TEXT
     * ========================================================
     *
     * This is the solid Typography version of:
     *
     * Web. Mobile. Systems. Interfaces.
     * Software built with attention
     * to know how it works and how it feels
     *
     * It lives behind the final nebula text.
     *
     * Its fade duration is intentionally identical to
     * the MUI devOm fade.
     * ========================================================
     */

    const [
        finalTextMuiVisible,
        setFinalTextMuiVisible,
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
        let devOmMuiTimer;
        let devOmReleaseTimer;
        let muiFadeCompleteTimer;
        let finalTextTimer;

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
                                 * ====================================================
                                 * 100% PARTICLES
                                 * ====================================================
                                 */

                                setCurrentTargetTexture(
                                    devOmFullTargetTexture
                                );

                                setTextEnabled(
                                    true
                                );

                                setDevOmMuiVisible(
                                    false
                                );

                                setFinalTextMuiVisible(
                                    false
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
                                             * MUI DEVOM FADE-IN
                                             * ====================================================
                                             */

                                            devOmMuiTimer =
                                                window.setTimeout(
                                                    () => {
                                                        setDevOmMuiVisible(
                                                            true
                                                        );

                                                        /*
                                                         * ====================================================
                                                         * WAIT FOR MUI FADE TO FINISH
                                                         * ====================================================
                                                         *
                                                         * The MUI fade starts above.
                                                         *
                                                         * We explicitly wait for the
                                                         * complete CSS transition here.
                                                         */

                                                        muiFadeCompleteTimer =
                                                            window.setTimeout(
                                                                () => {
                                                                    /*
                                                                     * ====================================================
                                                                     * FINAL TEXT DELAY
                                                                     * ====================================================
                                                                     *
                                                                     * This is ONLY the delay
                                                                     * after the MUI fade has
                                                                     * completely finished.
                                                                     */

                                                                    finalTextTimer =
                                                                        window.setTimeout(
                                                                            () => {
                                                                                /*
                                                                                 * ====================================================
                                                                                 * FINAL NEBULA
                                                                                 * ====================================================
                                                                                 */

                                                                                setCurrentTargetTexture(
                                                                                    finalTextTargetTexture
                                                                                );

                                                                                setTextEnabled(
                                                                                    true
                                                                                );

                                                                                /*
                                                                                 * ====================================================
                                                                                 * FINAL MUI TEXT
                                                                                 * ====================================================
                                                                                 *
                                                                                 * The solid MUI version
                                                                                 * appears behind the
                                                                                 * final particle text
                                                                                 * at exactly the same
                                                                                 * moment the final
                                                                                 * nebula target begins.
                                                                                 */

                                                                                setFinalTextMuiVisible(
                                                                                    true
                                                                                );
                                                                            },
                                                                            FINAL_TEXT_DELAY_AFTER_MUI
                                                                        );
                                                                },
                                                                DEVOM_MUI_FADE_DURATION
                                                            );
                                                    },
                                                    DEVOM_MUI_FADE_DELAY
                                                );

                                            /*
                                             * ====================================================
                                             * DEVOM PARTICLE RELEASE
                                             * ====================================================
                                             *
                                             * This remains completely
                                             * independent from the
                                             * final text timer.
                                             */

                                            devOmReleaseTimer =
                                                window.setTimeout(
                                                    () => {
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
                devOmMuiTimer
            ) {
                window.clearTimeout(
                    devOmMuiTimer
                );
            }

            if (
                devOmReleaseTimer
            ) {
                window.clearTimeout(
                    devOmReleaseTimer
                );
            }

            if (
                muiFadeCompleteTimer
            ) {
                window.clearTimeout(
                    muiFadeCompleteTimer
                );
            }

            if (
                finalTextTimer
            ) {
                window.clearTimeout(
                    finalTextTimer
                );
            }
        };
    }, [
        devOmFullTargetTexture,
        devOmReducedTargetTexture,
        finalTextTargetTexture,
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

            finalTextTargetTexture?.dispose();
        };
    }, [
        textTargetTexture,
        devOmFullTargetTexture,
        devOmReducedTargetTexture,
        finalTextTargetTexture,
    ]);

    /*
     * --------------------------------------------------------
     * RENDER
     * --------------------------------------------------------
     */

    return (
        <>
            {/*
             * ====================================================
             * MUI DEVOM
             * ====================================================
             */}

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

                    zIndex: 0,
                }}
            >
                <Typography
                    component="div"
                    sx={{
                        width:
                            'min(96vw, 1500px)',

                        textAlign:
                            'center',

                        fontFamily:
                            '"Neue Montreal", "Helvetica Neue", Arial, sans-serif',

                        fontSize:
                            'clamp(6rem, 15vw, 15rem)',

                        fontWeight:
                            550,

                        lineHeight:
                            1,

                        letterSpacing:
                            '0.018em',

                        color:
                            colors.accent.primary,

                        userSelect:
                            'none',

                        whiteSpace:
                            'nowrap',

                        opacity:
                            devOmMuiVisible
                                ? 1
                                : 0,

                        transition:
                            `opacity ${DEVOM_MUI_FADE_DURATION}ms ease`,
                    }}
                >
                    {DEVOM_TEXT}
                </Typography>
            </div>

            {/*
 * ====================================================
 * FINAL MUI TEXT
 * ====================================================
 *
 * Solid Typography version of the final nebula text.
 *
 * It is deliberately sized and positioned to sit
 * directly underneath the particle text.
 * ====================================================
 */}

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

                    zIndex: 0,
                }}
            >
                <Typography
                    component="div"
                    sx={{
                        width:
                            'min(96vw, 1500px)',

                        textAlign:
                            'center',

                        fontFamily:
                            '"Neue Montreal", "Helvetica Neue", Arial, sans-serif',

                        fontSize:
                            'clamp(2rem, 2.8vw, 4.5rem)',

                        fontWeight:
                            550,

                        lineHeight:
                            1,

                        letterSpacing:
                            '0.018em',

                        color:
                            colors.accent.primary,

                        userSelect:
                            'none',

                        whiteSpace:
                            'normal',

                        opacity:
                            finalTextMuiVisible
                                ? 1
                                : 0,

                        transform:
                            'translateY(24vh)',

                        transition:
                            `opacity ${DEVOM_MUI_FADE_DURATION}ms ease`,
                    }}
                >
                    {FINAL_TEXT_LINE_1}

                    <br />

                    {FINAL_TEXT_LINE_2}

                    <br />

                    {FINAL_TEXT_LINE_3}
                </Typography>
            </div>

            {/*
             * ====================================================
             * INITIAL SENTENCE INVISIBLE MUI LAYER
             * ====================================================
             */}

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