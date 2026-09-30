import { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import * as THREE from 'three';
import NebulaBackground from '../nebula/nebula';
import { colors } from '../../design/colors';

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

const FINAL_TEXT_WORLD_WIDTH =
    12.5;

const FINAL_TEXT_WORLD_HEIGHT =
    4.8;

const FINAL_TEXT_OFFSET_Y =
    -2.8;

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
        /*
         * ====================================================
         * OKANA
         * ====================================================
         */

        {
            family: 'Okana',
            source: 'local("Okana Thin")',
            weight: '100',
            style: 'normal',
        },

        {
            family: 'Okana',
            source: 'local("Okana ExtraLight")',
            weight: '200',
            style: 'normal',
        },

        {
            family: 'Okana',
            source: 'local("Okana Light")',
            weight: '300',
            style: 'normal',
        },

        {
            family: 'Okana',
            source: 'local("Okana Medium")',
            weight: '500',
            style: 'normal',
        },

        {
            family: 'Okana',
            source: 'local("Okana SemiBold")',
            weight: '600',
            style: 'normal',
        },

        {
            family: 'Okana',
            source: 'local("Okana Bold")',
            weight: '700',
            style: 'normal',
        },

        {
            family: 'Okana',
            source: 'local("Okana UltraBold")',
            weight: '800',
            style: 'normal',
        },

        {
            family: 'Okana',
            source: 'local("Okana Black")',
            weight: '900',
            style: 'normal',
        },

        /*
         * ====================================================
         * OKANA OBLIQUE
         * ====================================================
         */

        {
            family: 'Okana',
            source: 'local("Okana Thin Oblique")',
            weight: '100',
            style: 'oblique',
        },

        {
            family: 'Okana',
            source: 'local("Okana ExtraLight Oblique")',
            weight: '200',
            style: 'oblique',
        },

        {
            family: 'Okana',
            source: 'local("Okana Light Oblique")',
            weight: '300',
            style: 'oblique',
        },

        {
            family: 'Okana',
            source: 'local("Okana Medium Oblique")',
            weight: '500',
            style: 'oblique',
        },

        {
            family: 'Okana',
            source: 'local("Okana SemiBold Oblique")',
            weight: '600',
            style: 'oblique',
        },

        {
            family: 'Okana',
            source: 'local("Okana Bold Oblique")',
            weight: '700',
            style: 'oblique',
        },

        {
            family: 'Okana',
            source: 'local("Okana UltraBold Oblique")',
            weight: '800',
            style: 'oblique',
        },

        {
            family: 'Okana',
            source: 'local("Okana Black Oblique")',
            weight: '900',
            style: 'oblique',
        },

        /*
         * ====================================================
         * AVENIR NEXT
         * ====================================================
         */

        {
            family: 'Avenir Next',
            source: 'local("Avenir Next Ultra Light")',
            weight: '200',
            style: 'normal',
        },

        {
            family: 'Avenir Next',
            source: 'local("Avenir Next Regular")',
            weight: '400',
            style: 'normal',
        },

        {
            family: 'Avenir Next',
            source: 'local("Avenir Next Medium")',
            weight: '500',
            style: 'normal',
        },

        {
            family: 'Avenir Next',
            source: 'local("Avenir Next Demi Bold")',
            weight: '600',
            style: 'normal',
        },

        {
            family: 'Avenir Next',
            source: 'local("Avenir Next Bold")',
            weight: '700',
            style: 'normal',
        },

        {
            family: 'Avenir Next',
            source: 'local("Avenir Next Heavy")',
            weight: '800',
            style: 'normal',
        },

        /*
         * ====================================================
         * AVENIR NEXT ITALIC
         * ====================================================
         */

        {
            family: 'Avenir Next',
            source: 'local("Avenir Next Ultra Light Italic")',
            weight: '200',
            style: 'italic',
        },

        {
            family: 'Avenir Next',
            source: 'local("Avenir Next Italic")',
            weight: '400',
            style: 'italic',
        },

        {
            family: 'Avenir Next',
            source: 'local("Avenir Next Medium Italic")',
            weight: '500',
            style: 'italic',
        },

        {
            family: 'Avenir Next',
            source: 'local("Avenir Next Demi Bold Italic")',
            weight: '600',
            style: 'italic',
        },

        {
            family: 'Avenir Next',
            source: 'local("Avenir Next Bold Italic")',
            weight: '700',
            style: 'italic',
        },

        {
            family: 'Avenir Next',
            source: 'local("Avenir Next Heavy Italic")',
            weight: '800',
            style: 'italic',
        },
    ];

    for (const {
        family,
        source,
        weight,
        style,
    } of fonts) {
        try {
            const font =
                new FontFace(
                    family,
                    source,
                    {
                        weight,
                        style,
                    }
                );

            await font.load();

            document.fonts.add(
                font
            );
        } catch (error) {
            console.warn(
                `Could not load ${family} ${weight} ${style}:`,
                error
            );
        }
    }

    /*
     * Make sure the browser has finished
     * resolving the font faces.
     */

    await document.fonts.load(
        '100 100px "Okana"'
    );

    await document.fonts.load(
        '400 100px "Avenir Next"'
    );

    console.log(
        'Okana 600:',
        document.fonts.check(
            '600 100px "Okana"'
        )
    );

    console.log(
        'Avenir Next 400:',
        document.fonts.check(
            '400 100px "Avenir Next"'
        )
    );
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
        120;

    const font =
        `400 ${fontSize}px ` +
        `"Avenir Next", "Helvetica Neue", Arial, sans-serif`;

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
        `600 ${fontSize}px ` +
        `"Okana", "Helvetica Neue", Arial, sans-serif`;
    
    console.log(
        'DEVOM CANVAS FONT:',
        font
    );

    console.log(
        'DEVOM OKANA:',
        document.fonts.check(
            '600 390px "Okana"'
        )
    );

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
        45;

    const font =
        `400 ${fontSize}px ` +
        `"Avenir Next", "Helvetica Neue", Arial, sans-serif`;

    const letterSpacing =
        fontSize *
        0.015;

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
    
    console.log(
        'Canvas Okana:',
        document.fonts.check(
            '600 390px "Okana"'
        )
    );

    console.log(
        'Canvas font before draw:',
        font
    );

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

export default function HomeNebulaText() {
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
                        0,
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
             * ==================================================
             * FINAL MUI
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
                        0,
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
                            'clamp(1.6rem, 2vw, 4rem)',

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
                            `opacity ${FINAL_MUI_FADE_DURATION}ms ease`,
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