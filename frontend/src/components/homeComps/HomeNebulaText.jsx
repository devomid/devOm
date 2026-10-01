import { useEffect, useState, useRef } from 'react';
import { Typography } from '@mui/material';
import * as THREE from 'three';
import NebulaBackground from '../nebula/nebula';
import { colors } from '../../design/colors';
import { motion, useTransform, } from 'framer-motion';

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
const TEXT_LINE_1 = 'Every little idea is';
const TEXT_LINE_2 = 'like a small particle';

const TEXT_PARTICLE_RATIO =
    0.16;

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

const FINAL_TEXT_CONTAINER_WIDTH =
    'min(96vw, 1500px)';

const FINAL_TEXT_FONT_SIZE_MIN =
    25.6;

const FINAL_TEXT_FONT_SIZE_VIEWPORT =
    0.02;

const FINAL_TEXT_FONT_SIZE_MAX =
    64;

const FINAL_TEXT_LINE_HEIGHT =
    1;

const FINAL_TEXT_LETTER_SPACING =
    0.018;

/*
 * ============================================================
 * FINAL TEXT SCREEN / CAMERA GEOMETRY
 * ============================================================
 *
 * The Nebula camera is:
 *
 * PerspectiveCamera(
 *     60,
 *     aspect,
 *     ...,
 * )
 *
 * positioned at z = 10.
 *
 * These values make the particle target use the actual
 * visible camera frustum instead of the old fixed
 * 12.5 x 4.8 world rectangle.
 * ============================================================
 */

const FINAL_TEXT_MUI_OFFSET_Y_VH =
    24;

const FINAL_TEXT_LEFT_OFFSET_PX =
    24;

const NEBULA_CAMERA_Z =
    10;

const NEBULA_CAMERA_FOV =
    60;

/*
 * ============================================================
 * DEVOM
 * ============================================================
 */
const DEVOM_TEXT = 'devOm';

const DEVOM_FULL_RATIO =
    1.0;

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
    1800;

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
    0.018;

const TARGET_JITTER_Z =
    0.078;

/*
 * ============================================================
 * WIND
 * ============================================================
 */

const WIND_START_DELAY =
    10000;

const WIND_TEXT_HOLD =
    5;

const WIND_DURATION =
    4500;

const POST_WIND_WAIT =
    1000;

/*
 * ============================================================
 * DEVOM TIMING
 * ============================================================
 *
 * WIND
 *   ↓
 * devOm particle formation
 *   ↓
 * devOm reduced target
 *   ↓
 * devOm MUI on its own timeline
 *
 * The devOm MUI timeline does NOT control the final particle
 * sequence.
 * ============================================================
 */

const DEVOM_FORM_DURATION =
    7500;

const DEVOM_MUI_FADE_DELAY =
    1300;

const DEVOM_MUI_FADE_DURATION =
    5500;

/*
 * ============================================================
 * FINAL TEXT TIMING
 * ============================================================
 *
 * devOm particle formation completes
 *        ↓
 * FINAL_TEXT_DELAY_AFTER_DEVOM_FORM
 *        ↓
 * final particle target starts
 *        ↓
 * FINAL_TEXT_FORM_DURATION
 *        ↓
 * FINAL_MUI_DELAY_AFTER_FINAL_NEBULA
 *        ↓
 * final MUI appears
 *        ↓
 * FINAL_MUI_FADE_DURATION
 *        ↓
 * FINAL_TEXT_HOLD_AFTER_MUI
 *        ↓
 * particles are released
 * ============================================================
 */

const FINAL_TEXT_DELAY_AFTER_DEVOM_FORM =
    2000;

const FINAL_TEXT_FORM_DURATION =
    2500;

const FINAL_MUI_DELAY_AFTER_FINAL_NEBULA =
    5700;

const FINAL_MUI_FADE_DURATION =
    7100;

function drawLeftAlignedLetterSpacedText(
    ctx,
    text,
    x,
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

    let currentX =
        x;

    characters.forEach(
        (
            character,
            index
        ) => {
            ctx.fillText(
                character,
                currentX,
                baselineY
            );

            currentX +=
                widths[index] +
                letterSpacing;
        }
    );
}

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

async function loadInitialTextFont() {
    const fonts = [
        // ============================================================
        // OKANA
        // ============================================================

        {
            family: 'Okana',
            weight: '100',
            style: 'normal',
            src: '/fonts/okana/Okana-Thin.ttf',
            format: 'truetype',
        },
        {
            family: 'Okana',
            weight: '200',
            style: 'normal',
            src: '/fonts/okana/Okana-ExtraLight.ttf',
            format: 'truetype',
        },
        {
            family: 'Okana',
            weight: '300',
            style: 'normal',
            src: '/fonts/okana/Okana-Light.ttf',
            format: 'truetype',
        },
        {
            family: 'Okana',
            weight: '500',
            style: 'normal',
            src: '/fonts/okana/Okana-Medium.ttf',
            format: 'truetype',
        },
        {
            family: 'Okana',
            weight: '600',
            style: 'normal',
            src: '/fonts/okana/Okana-SemiBold.ttf',
            format: 'truetype',
        },
        {
            family: 'Okana',
            weight: '700',
            style: 'normal',
            src: '/fonts/okana/Okana-Bold.ttf',
            format: 'truetype',
        },
        {
            family: 'Okana',
            weight: '800',
            style: 'normal',
            src: '/fonts/okana/Okana-UltraBold.ttf',
            format: 'truetype',
        },
        {
            family: 'Okana',
            weight: '900',
            style: 'normal',
            src: '/fonts/okana/Okana-Black.ttf',
            format: 'truetype',
        },

        {
            family: 'Okana',
            weight: '100',
            style: 'oblique',
            src: '/fonts/okana/Okana-ThinOblique.ttf',
            format: 'truetype',
        },
        {
            family: 'Okana',
            weight: '200',
            style: 'oblique',
            src: '/fonts/okana/Okana-ExtraLightOblique.ttf',
            format: 'truetype',
        },
        {
            family: 'Okana',
            weight: '300',
            style: 'oblique',
            src: '/fonts/okana/Okana-LightOblique.ttf',
            format: 'truetype',
        },
        {
            family: 'Okana',
            weight: '500',
            style: 'oblique',
            src: '/fonts/okana/Okana-MediumOblique.ttf',
            format: 'truetype',
        },
        {
            family: 'Okana',
            weight: '600',
            style: 'oblique',
            src: '/fonts/okana/Okana-SemiBoldOblique.ttf',
            format: 'truetype',
        },
        {
            family: 'Okana',
            weight: '700',
            style: 'oblique',
            src: '/fonts/okana/Okana-BoldOblique.ttf',
            format: 'truetype',
        },
        {
            family: 'Okana',
            weight: '800',
            style: 'oblique',
            src: '/fonts/okana/Okana-UltraBoldOblique.ttf',
            format: 'truetype',
        },
        {
            family: 'Okana',
            weight: '900',
            style: 'oblique',
            src: '/fonts/okana/Okana-BlackOblique.ttf',
            format: 'truetype',
        },

        // ============================================================
        // AFTER
        // ============================================================

        {
            family: 'After',
            weight: '400',
            style: 'normal',
            src: '/fonts/okana/after-regular.otf',
            format: 'opentype',
        },

        // ============================================================
        // FOGIE
        // ============================================================

        {
            family: 'Fogie',
            weight: '100',
            style: 'normal',
            src: '/fonts/okana/Fogie-Thin.ttf',
            format: 'truetype',
        },

        // ============================================================
        // MONIGUE
        // ============================================================

        {
            family: 'Monigue',
            weight: '400',
            style: 'normal',
            src: '/fonts/okana/MoniguedemoRegular-gwlL1.otf',
            format: 'opentype',
        },

        // ============================================================
        // CODEC PRO
        // ============================================================

        {
            family: 'Codec Pro',
            weight: '400',
            style: 'normal',
            src: '/fonts/okana/CodecPro-Regular.ttf',
            format: 'truetype',
        },
        {
            family: 'Codec Pro',
            weight: '400',
            style: 'italic',
            src: '/fonts/okana/CodecPro-Italic.ttf',
            format: 'truetype',
        },
    ];

    await Promise.all(
        fonts.map(
            async ({
                family,
                weight,
                style,
                src,
                format,
            }) => {
                const font =
                    new FontFace(
                        family,
                        `url("${src}") format("${format}")`,
                        {
                            weight,
                            style,
                        }
                    );

                await font.load();

                document.fonts.add(
                    font
                );
            }
        )
    );

    await document.fonts.ready;
}

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

    ctx.filter =
        'blur(3px)';

    const fontSize =
        130;

    const font =
        `400 ${fontSize}px ` +
        `"Codec Pro", "Helvetica Neue", Arial, sans-serif`;

    const letterSpacing =
        fontSize *
        0.017;

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

    ctx.filter =
        'none';

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
                alpha > 35
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
                (
                    i *
                    15731 +
                    789221
                ) %
                candidates.length;

            const particle =
                candidates[
                candidateIndex
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

            const variation =
                i *
                0.0137;

            const jitterX =
                Math.sin(
                    variation *
                    1.71
                ) *
                0.03;

            const jitterY =
                Math.cos(
                    variation *
                    1.43
                ) *
                0.03;

            const jitterZ =
                Math.sin(
                    variation *
                    0.91
                ) *
                0.085;

            targetData[offset] =
                worldX +
                jitterX;

            targetData[offset + 1] =
                worldY +
                jitterY;

            targetData[offset + 2] =
                jitterZ;

            targetData[offset + 3] =
                1.0;
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

    ctx.filter =
        'blur(20px)';

    const fontSize =
        390;

    const font =
        `400 ${fontSize}px ` +
        `"After", "Helvetica Neue", Arial, sans-serif`;

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

    ctx.filter =
        'none';

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
                alpha > 70
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

function getFinalTextFontSize() {
    const rootFontSize =
        parseFloat(
            getComputedStyle(
                document.documentElement
            ).fontSize
        ) || 16;

    const min =
        rootFontSize *
        1.6;

    const max =
        rootFontSize *
        4;

    const viewportFontSize =
        window.innerWidth *
        FINAL_TEXT_FONT_SIZE_VIEWPORT;

    return Math.min(
        Math.max(
            viewportFontSize,
            min
        ),
        max
    );
}

function getFinalTextViewportWorldSize() {
    const viewportWidth =
        window.innerWidth;

    const viewportHeight =
        window.innerHeight;

    const fovRadians =
        THREE.MathUtils.degToRad(
            NEBULA_CAMERA_FOV
        );

    const worldHeight =
        2 *
        NEBULA_CAMERA_Z *
        Math.tan(
            fovRadians / 2
        );

    const worldWidth =
        worldHeight *
        (
            viewportWidth /
            viewportHeight
        );

    return {
        worldWidth,
        worldHeight,
    };
}

function getDevOmVisualLeft() {
    const canvas =
        document.createElement(
            'canvas'
        );

    const ctx =
        canvas.getContext(
            '2d'
        );

    if (!ctx) {
        return FINAL_TEXT_LEFT_OFFSET_PX;
    }

    const rootFontSize =
        parseFloat(
            getComputedStyle(
                document.documentElement
            ).fontSize
        ) || 16;

    const devOmFontSize =
        Math.min(
            Math.max(
                window.innerWidth *
                0.15,
                rootFontSize *
                6
            ),
            rootFontSize *
            15
        );

    ctx.font =
        `400 ${devOmFontSize}px ` +
        `"After", "Helvetica Neue", Arial, sans-serif`;

    const characters =
        [...DEVOM_TEXT];

    const letterSpacing =
        devOmFontSize *
        0.018;

    const widths =
        characters.map(
            (character) =>
                ctx.measureText(
                    character
                ).width
        );

    const devOmWidth =
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

    return (
        (
            window.innerWidth -
            devOmWidth
        ) /
        2
    ) +
        FINAL_TEXT_LEFT_OFFSET_PX;
}

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

    /*
     * ============================================================
     * ACTUAL CAMERA FRUSTUM
     * ============================================================
     */

    const {
        worldWidth,
        worldHeight,
    } =
        getFinalTextViewportWorldSize();

    /*
     * ============================================================
     * EXACT CSS -> CANVAS SCALE
     * ============================================================
     *
     * The canvas represents the complete browser viewport.
     *
     * Therefore:
     *
     * canvas pixels / viewport pixels
     *
     * is the conversion factor.
     */

    const canvasScale =
        FINAL_TEXT_CANVAS_WIDTH /
        window.innerWidth;

    /*
     * ============================================================
     * SAME RESPONSIVE FONT SIZE AS MUI
     * ============================================================
     */

    const muiFontSize =
        getFinalTextFontSize();

    const fontSize =
        muiFontSize *
        canvasScale;

    const font =
        `400 ${fontSize}px ` +
        `"Codec Pro", "Helvetica Neue", Arial, sans-serif`;

    const letterSpacing =
        fontSize *
        FINAL_TEXT_LETTER_SPACING;

    /*
     * ============================================================
     * SAME LEFT EDGE AS MUI
     * ============================================================
     */

    const finalTextLeft =
        getDevOmVisualLeft();

    const textX =
        finalTextLeft *
        canvasScale;

    /*
     * ============================================================
     * SAME VERTICAL TRANSFORM AS MUI
     * ============================================================
     */

    const verticalOffsetWorld =
        -(
            FINAL_TEXT_MUI_OFFSET_Y_VH /
            100
        ) *
        worldHeight;

    /*
     * ============================================================
     * LINE GEOMETRY
     * ============================================================
     */

    const lineHeight =
        fontSize *
        FINAL_TEXT_LINE_HEIGHT;

    const centerY =
        FINAL_TEXT_CANVAS_HEIGHT /
        2;

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

    /*
     * ============================================================
     * DRAW
     * ============================================================
     */

    drawLeftAlignedLetterSpacedText(
        ctx,
        FINAL_TEXT_LINE_1,
        textX,
        firstLineBaseline,
        font,
        letterSpacing
    );

    drawLeftAlignedLetterSpacedText(
        ctx,
        FINAL_TEXT_LINE_2,
        textX,
        secondLineBaseline,
        font,
        letterSpacing
    );

    drawLeftAlignedLetterSpacedText(
        ctx,
        FINAL_TEXT_LINE_3,
        textX,
        thirdLineBaseline,
        font,
        letterSpacing
    );

    /*
     * ============================================================
     * READ TEXT PIXELS
     * ============================================================
     */

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

    /*
     * ============================================================
     * PARTICLE TARGET
     * ============================================================
     */

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

            /*
             * The canvas now maps directly to the visible
             * PerspectiveCamera viewport.
             */

            const worldX =
                (
                    normalizedX -
                    0.5
                ) *
                worldWidth;

            const worldY =
                (
                    0.5 -
                    normalizedY
                ) *
                worldHeight;

            targetData[offset] =
                worldX +
                (
                    Math.random() -
                    0.5
                ) *
                TARGET_JITTER_XY;

            targetData[offset + 1] =
                worldY +
                verticalOffsetWorld +
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

export default function HomeNebulaText({
    onIntroComplete,
    scrollProgress,
    introComplete,
}) {
    const introCompleteRef =
        useRef(false);

    /*
 * ========================================================
 * POST-INTRO MUI MOVEMENT
 * ========================================================
 *
 * Only the two MUI text layers move.
 *
 * NebulaBackground remains completely untouched.
 * ========================================================
 */

    const devOmX =
        useTransform(
            scrollProgress,
            [
                0,
                0.30,
                0.42,
                0.50,
                0.58,
            ],
            [
                '0vw',
                '-12vw',
                '-18vw',
                '-15vw',
                '-12vw',
            ]
        );

    const muiScale =
        useTransform(
            scrollProgress,
            [0, 0.30, 0.46, 0.58],
            [1, 0.70, 0.70, 0.78]
        );

    const [
        textTargetTexture,
        setTextTargetTexture,
    ] = useState(null);

    const [
        devOmFullTargetTexture,
        setDevOmFullTargetTexture,
    ] = useState(null);

    const [
        finalTextTargetTexture,
        setFinalTextTargetTexture,
    ] = useState(null);

    /*
     * ========================================================
     * FINAL MUI LEFT POSITION
     * ========================================================
     */

    const [
        finalTextLeft,
        setFinalTextLeft,
    ] = useState(0);

    /*
     * ========================================================
     * INITIAL TEXT
     * ========================================================
     */

    useEffect(() => {
        let cancelled =
            false;

        async function prepareFontsAndTextures() {
            try {
                await loadInitialTextFont();

                if (cancelled) {
                    return;
                }

                const sentenceTexture =
                    createSentenceTargetTexture();

                const devOmTexture =
                    createDevOmTargetTexture(
                        DEVOM_FULL_RATIO
                    );

                const finalTexture =
                    createFinalTextTargetTexture();

                setTextTargetTexture(
                    sentenceTexture
                );

                setDevOmFullTargetTexture(
                    devOmTexture
                );

                setFinalTextTargetTexture(
                    finalTexture
                );

                setFinalTextLeft(
                    getDevOmVisualLeft()
                );

            } catch (error) {
                console.error(
                    'Failed to load fonts:',
                    error
                );

                if (cancelled) {
                    return;
                }

                const sentenceTexture =
                    createSentenceTargetTexture();

                const devOmTexture =
                    createDevOmTargetTexture(
                        DEVOM_FULL_RATIO
                    );

                const finalTexture =
                    createFinalTextTargetTexture();

                setTextTargetTexture(
                    sentenceTexture
                );

                setDevOmFullTargetTexture(
                    devOmTexture
                );

                setFinalTextTargetTexture(
                    finalTexture
                );

                setFinalTextLeft(
                    getDevOmVisualLeft()
                );
            }
        }

        prepareFontsAndTextures();

        return () => {
            cancelled =
                true;
        };
    }, []);

    /*
     * ========================================================
     * RESPONSIVE FINAL TEXT GEOMETRY
     * ========================================================
     *
     * Important:
     *
     * We DO NOT replace finalTextTargetTexture with a new
     * React state object here.
     *
     * That would restart the timeline because the timeline
     * depends on finalTextTargetTexture.
     *
     * Instead, we update the existing DataTexture's data
     * in-place.
     *
     * Timing therefore remains untouched.
     * ========================================================
     */

    useEffect(() => {
        if (!finalTextTargetTexture) {
            return;
        }

        function handleResize() {
            const nextTexture =
                createFinalTextTargetTexture();

            if (!nextTexture) {
                return;
            }

            if (
                finalTextTargetTexture.image?.data &&
                nextTexture.image?.data &&
                finalTextTargetTexture.image.data.length ===
                nextTexture.image.data.length
            ) {
                finalTextTargetTexture.image.data.set(
                    nextTexture.image.data
                );

                finalTextTargetTexture.needsUpdate =
                    true;
            }

            nextTexture.dispose();

            setFinalTextLeft(
                getDevOmVisualLeft()
            );
        }

        window.addEventListener(
            'resize',
            handleResize
        );

        return () => {
            window.removeEventListener(
                'resize',
                handleResize
            );
        };
    }, [
        finalTextTargetTexture,
    ]);

    /*
     * ========================================================
     * PARTICLE STATE
     * ========================================================
     */

    const [
        currentTargetTexture,
        setCurrentTargetTexture,
    ] = useState(null);

    useEffect(() => {
        if (!textTargetTexture) {
            return;
        }

        setCurrentTargetTexture(
            textTargetTexture
        );
    }, [
        textTargetTexture,
    ]);

    const [
        textEnabled,
        setTextEnabled,
    ] = useState(true);

    const [
        windActive,
        setWindActive,
    ] = useState(false);

    /*
     * ========================================================
     * MUI STATE
     * ========================================================
     */

    const [
        devOmMuiVisible,
        setDevOmMuiVisible,
    ] = useState(false);

    const [
        finalTextMuiVisible,
        setFinalTextMuiVisible,
    ] = useState(false);

    /*
     * ========================================================
     * TIMELINE
     * ========================================================
     */

    useEffect(() => {
        if (
            !textTargetTexture ||
            !devOmFullTargetTexture ||
            !finalTextTargetTexture
        ) {
            return;
        }

        let windTimer;
        let releaseTextTimer;

        let devOmTimer;
        let devOmFormationTimer;
        let devOmMuiTimer;

        let finalTextTimer;
        let finalMuiTimer;

        /*
         * ====================================================
         * WIND
         * ====================================================
         */

        windTimer =
            window.setTimeout(() => {
                setWindActive(true);

                /*
                 * Let the wind work on the initial sentence.
                 */

                releaseTextTimer =
                    window.setTimeout(() => {
                        setTextEnabled(false);
                    }, WIND_TEXT_HOLD);

                /*
                 * =================================================
                 * DEVOM START
                 * =================================================
                 */

                devOmTimer =
                    window.setTimeout(() => {

                        /*
                         * DEVOM PARTICLES FORM
                         */

                        setCurrentTargetTexture(
                            devOmFullTargetTexture
                        );

                        setTextEnabled(true);

                        setDevOmMuiVisible(false);
                        setFinalTextMuiVisible(false);

                        /*
                         * =================================================
                         * DEVOM FORMATION WINDOW
                         * =================================================
                         *
                         * Give devOm 7.5 seconds to form.
                         */

                        devOmFormationTimer =
                            window.setTimeout(() => {

                                /*
                                 * =================================================
                                 * DEVOM MUI
                                 * =================================================
                                 *
                                 * Wait 1.8 seconds.
                                 */

                                devOmMuiTimer =
                                    window.setTimeout(() => {

                                        /*
                                         * MUI APPEARS
                                         */

                                        setDevOmMuiVisible(true);

                                        /*
                                         * =================================================
                                         * DEVOM PARTICLES ARE RELEASED
                                         * =================================================
                                         *
                                         * The MUI effectively blows devOm away.
                                         *
                                         * IMPORTANT:
                                         *
                                         * We release the particles HERE,
                                         * not when the final text starts.
                                         */

                                        setTextEnabled(false);

                                        /*
                                         * =================================================
                                         * FINAL TEXT START
                                         * =================================================
                                         *
                                         * Wait 1 second while the particles
                                         * are freely flying.
                                         */

                                        finalTextTimer =
                                            window.setTimeout(() => {

                                                /*
                                                 * =================================================
                                                 * FINAL PARTICLES FORM
                                                 * =================================================
                                                 */

                                                setCurrentTargetTexture(
                                                    finalTextTargetTexture
                                                );

                                                setTextEnabled(true);

                                                /*
                                                 * =================================================
                                                 * FINAL MUI
                                                 * =================================================
                                                 *
                                                 * Wait:
                                                 *
                                                 * final formation
                                                 * +
                                                 * 1 second hold
                                                 */

                                                finalMuiTimer =
                                                    window.setTimeout(() => {

                                                        /*
                                                         * FINAL MUI APPEARS
                                                         */

                                                        setFinalTextMuiVisible(
                                                            true
                                                        );

                                                        /*
                                                         * =================================================
                                                         * FINAL PARTICLES RELEASE
                                                         * =================================================
                                                         *
                                                         * MUI blows the final
                                                         * particle text away.
                                                         */

                                                        setTextEnabled(
                                                            false
                                                        );

                                                        window.setTimeout(() => {
                                                            if (
                                                                introCompleteRef.current
                                                            ) {
                                                                return;
                                                            }

                                                            introCompleteRef.current =
                                                                true;

                                                            onIntroComplete?.();
                                                        }, FINAL_MUI_FADE_DURATION);

                                                    },
                                                        FINAL_TEXT_FORM_DURATION +
                                                        FINAL_MUI_DELAY_AFTER_FINAL_NEBULA
                                                    );

                                            },
                                                FINAL_TEXT_DELAY_AFTER_DEVOM_FORM
                                            );

                                    },
                                        DEVOM_MUI_FADE_DELAY
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

        /*
         * ========================================================
         * CLEANUP
         * ========================================================
         */

        return () => {
            window.clearTimeout(
                windTimer
            );

            window.clearTimeout(
                releaseTextTimer
            );

            window.clearTimeout(
                devOmTimer
            );

            window.clearTimeout(
                devOmFormationTimer
            );

            window.clearTimeout(
                devOmMuiTimer
            );

            window.clearTimeout(
                finalTextTimer
            );

            window.clearTimeout(
                finalMuiTimer
            );
        };
    }, [
        textTargetTexture,
        devOmFullTargetTexture,
        finalTextTargetTexture,
    ]);

    /*
     * ========================================================
     * DISPOSE
     * ========================================================
     */

    useEffect(() => {
        return () => {
            textTargetTexture?.dispose();

            devOmFullTargetTexture?.dispose();

            finalTextTargetTexture?.dispose();
        };
    }, [
        textTargetTexture,
        devOmFullTargetTexture,
        finalTextTargetTexture,
    ]);

    /*
     * ========================================================
     * RENDER
     * ========================================================
     */

    return (
        <>
            {/*
             * ==================================================
             * DEVOM MUI
             * ==================================================
             */}

            <motion.div
                style={{
                    position:
                        'absolute',

                    inset:
                        0,

                    pointerEvents:
                        'none',

                    display:
                        'flex',

                    alignItems:
                        'center',

                    justifyContent:
                        'center',

                    zIndex:
                        0,

                    x:
                        introComplete
                            ? devOmX
                            : 0,

                    scale:
                        introComplete
                            ? muiScale
                            : 1,

                    transformOrigin:
                        'center center',
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
                            '"After", "Helvetica Neue", Arial, sans-serif',

                        fontSize:
                            'clamp(6rem, 15vw, 15rem)',

                        fontWeight:
                            400,

                        lineHeight:
                            1,

                        letterSpacing:
                            '0.068em',

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
            </motion.div>

            {/*
             * ==================================================
             * FINAL MUI
             * ==================================================
             *
             * This is anchored to the exact measured visual
             * left edge of devOm + 24px.
             *
             * Its vertical center is the same center used by
             * the particle target, plus the same 24vh offset.
             * ==================================================
             */}

            <motion.div
                style={{
                    position:
                        'absolute',

                    inset:
                        0,

                    pointerEvents:
                        'none',

                    zIndex:
                        0,

                    x:
                        introComplete
                            ? devOmX
                            : 0,

                    scale:
                        introComplete
                            ? muiScale
                            : 1,

                    transformOrigin:
                        'center center',
                }}
            >
                <Typography
                    component="div"
                    sx={{
                        position:
                            'absolute',

                        left:
                            `${finalTextLeft}px`,

                        top:
                            '50%',

                        width:
                            FINAL_TEXT_CONTAINER_WIDTH,

                        textAlign:
                            'left',

                        fontFamily:
                            '"Codec Pro", "Helvetica Neue", Arial, sans-serif',

                        fontSize:
                            'clamp(1.4rem, 1.8vw, 3.8rem)',

                        fontWeight:
                            400,

                        lineHeight:
                            FINAL_TEXT_LINE_HEIGHT,

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
                            'translateY(calc(-50% + 24vh))',

                        transition:
                            `opacity ${FINAL_MUI_FADE_DURATION}ms ease`,
                    }}
                >
                    {FINAL_TEXT_LINE_1}

                    <br />

                    {FINAL_TEXT_LINE_2}

                    <br />

                    {FINAL_TEXT_LINE_3}
                </Typography>
            </motion.div>

            {/*
             * ==================================================
             * INVISIBLE INITIAL TEXT
             * ==================================================
             */}

            <div
                style={{
                    position:
                        'absolute',

                    inset:
                        0,

                    pointerEvents:
                        'none',

                    display:
                        'flex',

                    alignItems:
                        'center',

                    justifyContent:
                        'center',

                    zIndex:
                        2,
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

            {/*
             * ==================================================
             * NEBULA
             * ==================================================
             */}

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
                    4.8
                }

                homeWindActive={
                    windActive
                }
            />
        </>
    );
}