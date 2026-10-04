import { useEffect, useState, useRef } from 'react';
import { motion, useTransform, } from 'framer-motion';
import * as THREE from 'three';

import { Typography } from '@mui/material';

import NebulaBackground from '../nebula/nebula';
import { colors } from '../../design/colors';

//INITIAL SENTENCE
const TEXT_LINE_1 = 'Every little idea is';
const TEXT_LINE_2 = 'like a small particle';
const TEXT_PARTICLE_RATIO = 0.16;
const TEXT_CANVAS_WIDTH = 1800;
const TEXT_CANVAS_HEIGHT = 520;
const TEXT_WORLD_WIDTH = 9.0;
const TEXT_WORLD_HEIGHT = 2.9;

//DEVOM
const DEVOM_TEXT_LEFT = 'dev';
const DEVOM_TEXT_CENTER = 'O';
const DEVOM_TEXT_RIGHT = 'm';
const DEVOM_BASE_FONT_RATIO = 0.15;
const DEVOM_MIN_FONT_REM = 6;
const DEVOM_MAX_FONT_REM = 15;
const DEVOM_CENTER_FONT_RATIO = 1.10256;
const DEVOM_LEFT_FONT_FAMILY = '"Helvetica Neue", Arial, sans-serif';
const DEVOM_CENTER_FONT_FAMILY = '"After", "Helvetica Neue", Arial, sans-serif';
const DEVOM_LEFT_FONT_WEIGHT = 100;
const DEVOM_CENTER_FONT_WEIGHT = 400;
const DEVOM_RIGHT_FONT_WEIGHT = 100;
const DEVOM_LETTER_SPACING = 0;
const DEVOM_FULL_RATIO = 1.0;
const DEVOM_CANVAS_WIDTH = 1800;
const TARGET_JITTER_XY = 0.018;
const TARGET_JITTER_Z = 0.078;
const DEVOM_FORM_DURATION = 7500;
const DEVOM_MUI_FADE_DELAY = 1300;
const DEVOM_MUI_FADE_DURATION = 5500;

//FINAL TEXT
const FINAL_TEXT_LINE_1 = 'Web. Mobile. Systems. Interfaces.';
const FINAL_TEXT_LINE_2 = 'Software built with attention';
const FINAL_TEXT_LINE_3 = 'to know how it works and how it feels';
const FINAL_TEXT_CANVAS_WIDTH = 1800;
const FINAL_TEXT_CONTAINER_WIDTH = 'min(96vw, 1500px)';
const FINAL_TEXT_LINE_HEIGHT = 1;
const TEXTURE_SIZE = 512;
const PARTICLE_COUNT = TEXTURE_SIZE * TEXTURE_SIZE;
const FINAL_TEXT_PARTICLE_RATIO = 0.30;
const FINAL_TEXT_LETTER_SPACING = 0.018;
const FINAL_TEXT_MUI_OFFSET_Y_VH = 24;
const FINAL_TEXT_LEFT_OFFSET_PX = 70;
const FINAL_TEXT_PHONE_LEFT_OFFSET_PX = 20;
const FINAL_TEXT_SMALL_TABLET_LEFT_OFFSET_PX = 28;
const FINAL_TEXT_TABLET_LEFT_OFFSET_PX = 44;
const FINAL_TEXT_PHONE_VERTICAL_OFFSET_VH = 15;
const FINAL_TEXT_SMALL_TABLET_VERTICAL_OFFSET_VH = 17;
const FINAL_TEXT_TABLET_VERTICAL_OFFSET_VH = 20;
const FINAL_TEXT_RIGHT_PADDING_PX = 24;
const NEBULA_CAMERA_Z = 10;
const NEBULA_CAMERA_FOV = 60;
const FINAL_TEXT_DELAY_AFTER_DEVOM_FORM = 2000;
const FINAL_TEXT_FORM_DURATION = 2500;
const FINAL_MUI_DELAY_AFTER_FINAL_NEBULA = 4500;
const FINAL_MUI_FADE_DURATION = 7100;

//WIND
const WIND_START_DELAY = 10000;
const WIND_TEXT_HOLD = 5;
const WIND_DURATION = 4500;
const POST_WIND_WAIT = 1000;


function getFinalTextCanvasHeight() {
    return (
        FINAL_TEXT_CANVAS_WIDTH *
        (
            window.innerHeight /
            window.innerWidth
        )
    );
}

function getInitialTextParticleRatio() {
    const width =
        window.innerWidth;

    if (width < 768) {
        return 0.64;
    }

    if (width < 1024) {
        return 0.285;
    }

    return TEXT_PARTICLE_RATIO;
}

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
        150;

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

    const requiredParticles =
        Math.floor(
            PARTICLE_COUNT *
            getInitialTextParticleRatio()
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
                    7919
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

            const targetScale =
                getHomeParticleTargetScale(
                    TEXT_WORLD_WIDTH
                );

            const worldX =
                (
                    normalizedX -
                    0.5
                ) *
                TEXT_WORLD_WIDTH *
                targetScale;

            const worldY =
                (
                    0.5 -
                    normalizedY
                ) *
                TEXT_WORLD_HEIGHT *
                targetScale;

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

function getDevOmTypographyGeometry() {
    const rootFontSize =
        parseFloat(
            getComputedStyle(
                document.documentElement
            ).fontSize
        ) || 16;

    const baseFontSize =
        Math.min(
            Math.max(
                window.innerWidth *
                DEVOM_BASE_FONT_RATIO,

                rootFontSize *
                DEVOM_MIN_FONT_REM
            ),

            rootFontSize *
            DEVOM_MAX_FONT_REM
        );

    const centerFontSize =
        baseFontSize *
        DEVOM_CENTER_FONT_RATIO;

    const letterSpacing =
        DEVOM_LETTER_SPACING;

    return {
        baseFontSize,
        centerFontSize,
        letterSpacing,

        leftFont:
            `${DEVOM_LEFT_FONT_WEIGHT} ${baseFontSize}px ${DEVOM_LEFT_FONT_FAMILY}`,

        centerFont:
            `${DEVOM_CENTER_FONT_WEIGHT} ${centerFontSize}px ${DEVOM_CENTER_FONT_FAMILY}`,

        rightFont:
            `${DEVOM_RIGHT_FONT_WEIGHT} ${baseFontSize}px ${DEVOM_LEFT_FONT_FAMILY}`,
    };
}

function getDevOmViewportGeometry(
    ctx,
    typography
) {
    const {
        baseFontSize,
        centerFontSize,
        letterSpacing,
        leftFont,
        centerFont,
        rightFont,
    } = typography;

    ctx.font =
        leftFont;

    const leftWidth =
        ctx.measureText(
            DEVOM_TEXT_LEFT
        ).width;

    ctx.font =
        centerFont;

    const centerMetrics =
        ctx.measureText(
            DEVOM_TEXT_CENTER
        );

    const centerWidth =
        centerMetrics.width;

    const centerAscent =
        centerMetrics.actualBoundingBoxAscent;

    const centerDescent =
        centerMetrics.actualBoundingBoxDescent;

    ctx.font =
        rightFont;

    const rightWidth =
        ctx.measureText(
            DEVOM_TEXT_RIGHT
        ).width;

    const totalWidth =
        leftWidth +
        centerWidth +
        rightWidth +
        letterSpacing * 2;

    /*
     * MUI's outer container is:
     *
     *     display: flex
     *     alignItems: center
     *     justifyContent: center
     *
     * Its children are baseline-aligned.
     *
     * The "O" is the tallest line box because its
     * font size is larger than "dev" / "m".
     */

    const centerLineHeight =
        centerFontSize;

    const centerLineTop =
        (
            window.innerHeight -
            centerLineHeight
        ) /
        2;

    /*
     * CSS line-height: 1
     *
     * For the center glyph, the baseline sits at:
     *
     *     top + (lineHeight + ascent - descent) / 2
     */

    const baseline =
        centerLineTop +
        (
            centerLineHeight +
            centerAscent -
            centerDescent
        ) /
        2;

    const startX =
        (
            window.innerWidth -
            totalWidth
        ) /
        2;

    return {
        baseFontSize,
        centerFontSize,

        leftWidth,
        centerWidth,
        rightWidth,

        totalWidth,

        startX,
        baseline,

        centerAscent,
        centerDescent,

        letterSpacing,

        leftFont,
        centerFont,
        rightFont,
    };
}

function createDevOmTargetTexture(
    ratio
) {
    const canvas =
        document.createElement(
            'canvas'
        );

    /*
     * The Canvas represents the browser viewport.
     *
     * Keep the horizontal resolution at 1800, but make
     * the height proportional to the actual viewport.
     *
     * This prevents the old 1800x700 canvas from
     * introducing a second coordinate system.
     */

    canvas.width =
        DEVOM_CANVAS_WIDTH;

    canvas.height =
        Math.max(
            1,
            Math.round(
                DEVOM_CANVAS_WIDTH *
                (
                    window.innerHeight /
                    window.innerWidth
                )
            )
        );

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
        canvas.width,
        canvas.height
    );

    ctx.fillStyle =
        '#ffffff';

    ctx.filter =
        'blur(20px)';

    /*
     * ============================================================
     * SHARED TYPOGRAPHY
     * ============================================================
     */

    const typography =
        getDevOmTypographyGeometry();

    const geometry =
        getDevOmViewportGeometry(
            ctx,
            typography
        );

    /*
     * ============================================================
     * CSS PIXELS -> CANVAS PIXELS
     * ============================================================
     */

    const canvasScale =
        canvas.width /
        window.innerWidth;

    const canvasStartX =
        geometry.startX *
        canvasScale;

    const canvasBaseline =
        geometry.baseline *
        canvasScale;

    const canvasLetterSpacing =
        geometry.letterSpacing *
        canvasScale;

    /*
     * ============================================================
     * DRAW EXACTLY THE SAME THREE TYPOGRAPHIC ELEMENTS
     * ============================================================
     */

    ctx.textAlign =
        'left';

    ctx.textBaseline =
        'alphabetic';

    ctx.font =
        geometry.leftFont;

    ctx.fillText(
        DEVOM_TEXT_LEFT,
        canvasStartX,
        canvasBaseline
    );

    let currentX =
        canvasStartX +
        geometry.leftWidth *
        canvasScale +
        canvasLetterSpacing;

    ctx.font =
        geometry.centerFont;

    ctx.fillText(
        DEVOM_TEXT_CENTER,
        currentX,
        canvasBaseline
    );

    currentX +=
        geometry.centerWidth *
        canvasScale +
        canvasLetterSpacing;

    ctx.font =
        geometry.rightFont;

    ctx.fillText(
        DEVOM_TEXT_RIGHT,
        currentX,
        canvasBaseline
    );

    ctx.filter =
        'none';

    /*
     * ============================================================
     * READ PARTICLE SOURCE
     * ============================================================
     */

    const imageData =
        ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );

    const pixels =
        imageData.data;

    const candidates =
        [];

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
            const pixelIndex =
                (
                    y *
                    canvas.width +
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

    /*
     * ============================================================
     * PARTICLE TARGET
     * ============================================================
     *
     * The canvas now maps directly onto the camera viewport.
     *
     * There is NO width-based corrective particle scale.
     * There is NO second responsive typography calculation.
     */

    const {
        worldWidth,
        worldHeight,
    } =
        getFinalTextViewportWorldSize();

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
                canvas.width;

            const normalizedY =
                particle.y /
                canvas.height;

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
        1.4;

    const max =
        rootFontSize *
        3.8;

    const viewportFontSize =
        window.innerWidth *
        0.018;

    return Math.min(
        Math.max(
            viewportFontSize,
            min
        ),
        max
    );
}

function getFinalTextLeftOffsetPx() {
    const width =
        window.innerWidth;

    if (width < 480) {
        return FINAL_TEXT_PHONE_LEFT_OFFSET_PX;
    }

    if (width < 768) {
        return FINAL_TEXT_SMALL_TABLET_LEFT_OFFSET_PX;
    }

    if (width < 1024) {
        return FINAL_TEXT_TABLET_LEFT_OFFSET_PX;
    }

    return FINAL_TEXT_LEFT_OFFSET_PX;
}

function getFinalTextVerticalOffsetVh() {
    const width =
        window.innerWidth;

    if (width < 480) {
        return FINAL_TEXT_PHONE_VERTICAL_OFFSET_VH;
    }

    if (width < 768) {
        return FINAL_TEXT_SMALL_TABLET_VERTICAL_OFFSET_VH;
    }

    if (width < 1024) {
        return FINAL_TEXT_TABLET_VERTICAL_OFFSET_VH;
    }

    return FINAL_TEXT_MUI_OFFSET_Y_VH;
}

function measureLetterSpacedTextWidth(
    ctx,
    text,
    letterSpacing
) {
    const characters =
        [...text];

    const widths =
        characters.map(
            (character) =>
                ctx.measureText(
                    character
                ).width
        );

    return (
        widths.reduce(
            (sum, width) =>
                sum + width,
            0
        ) +
        Math.max(
            0,
            characters.length - 1
        ) *
        letterSpacing
    );
}

function getFinalTextContainerWidth(
    finalTextLeft
) {
    const viewportWidth =
        window.innerWidth;

    let preferredWidth;

    if (viewportWidth < 768) {
        preferredWidth =
            viewportWidth *
            0.90;
    } else if (viewportWidth < 1024) {
        preferredWidth =
            viewportWidth *
            0.92;
    } else {
        preferredWidth =
            Math.min(
                viewportWidth *
                0.96,
                1500
            );
    }

    const availableWidth =
        Math.max(
            1,
            viewportWidth -
            finalTextLeft -
            FINAL_TEXT_RIGHT_PADDING_PX
        );

    return Math.min(
        preferredWidth,
        availableWidth
    );
}

function getFinalTextResponsiveGeometry() {
    const canvas =
        document.createElement(
            'canvas'
        );

    const ctx =
        canvas.getContext(
            '2d'
        );

    const finalTextLeft =
        getDevOmVisualLeft();

    const containerWidth =
        getFinalTextContainerWidth(
            finalTextLeft
        );

    const verticalOffsetVh =
        getFinalTextVerticalOffsetVh();

    const preferredFontSize =
        getFinalTextFontSize();

    const preferredLetterSpacing =
        preferredFontSize *
        FINAL_TEXT_LETTER_SPACING;

    if (!ctx) {
        return {
            left:
                finalTextLeft,

            containerWidth,

            fontSize:
                preferredFontSize,

            letterSpacing:
                preferredLetterSpacing,

            lineHeight:
                preferredFontSize *
                FINAL_TEXT_LINE_HEIGHT,

            verticalOffsetVh,
        };
    }

    /*
     * ============================================================
     * SHARED FINAL TEXT TYPOGRAPHY
     * ============================================================
     *
     * This is the single source of truth for both:
     *
     *   1. MUI Typography
     *   2. Nebula particle target
     *
     * Do not create another font-size calculation inside
     * createFinalTextTargetTexture().
     * ============================================================
     */

    ctx.font =
        `100 ${preferredFontSize}px ` +
        `"Helvetica Neue", Arial, sans-serif`;

    const longestLineWidth =
        Math.max(
            measureLetterSpacedTextWidth(
                ctx,
                FINAL_TEXT_LINE_1,
                preferredLetterSpacing
            ),

            measureLetterSpacedTextWidth(
                ctx,
                FINAL_TEXT_LINE_2,
                preferredLetterSpacing
            ),

            measureLetterSpacedTextWidth(
                ctx,
                FINAL_TEXT_LINE_3,
                preferredLetterSpacing
            )
        );

    const fitScale =
        longestLineWidth > 0
            ? Math.min(
                1,
                containerWidth /
                longestLineWidth
            )
            : 1;

    const fontSize =
        preferredFontSize *
        fitScale;

    const letterSpacing =
        fontSize *
        FINAL_TEXT_LETTER_SPACING;

    const lineHeight =
        fontSize *
        FINAL_TEXT_LINE_HEIGHT;

    /*
     * ============================================================
     * FINAL FONT METRICS
     * ============================================================
     *
     * Measure the actual font that both MUI and the particle
     * canvas are supposed to represent.
     * ============================================================
     */

    ctx.font =
        `100 ${fontSize}px ` +
        `"Helvetica Neue", Arial, sans-serif`;

    const metrics =
        ctx.measureText(
            'M'
        );

    const ascent =
        Number.isFinite(
            metrics.actualBoundingBoxAscent
        )
            ? metrics.actualBoundingBoxAscent
            : fontSize * 0.74;

    const descent =
        Number.isFinite(
            metrics.actualBoundingBoxDescent
        )
            ? metrics.actualBoundingBoxDescent
            : fontSize * 0.26;

    /*
     * ============================================================
     * SHARED THREE-LINE LINE BOX
     * ============================================================
     */

    const totalLineBoxHeight =
        lineHeight *
        3;

    const lineBoxTop =
        (
            window.innerHeight -
            totalLineBoxHeight
        ) /
        2;

    const lineBoxCenter =
        lineBoxTop +
        totalLineBoxHeight / 2;

    const firstLineBaseline =
        lineBoxCenter -
        lineHeight +
        (
            lineHeight +
            ascent -
            descent
        ) /
        2;

    const secondLineBaseline =
        firstLineBaseline +
        lineHeight;

    const thirdLineBaseline =
        secondLineBaseline +
        lineHeight;

    return {
        left:
            finalTextLeft,

        containerWidth,

        fontSize,

        letterSpacing,

        lineHeight,

        ascent,

        descent,

        totalLineBoxHeight,

        lineBoxTop,

        firstLineBaseline,

        secondLineBaseline,

        thirdLineBaseline,

        verticalOffsetVh,
    };
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

function getHomeParticleTargetScale(
    baseWorldWidth
) {
    const {
        worldWidth,
    } = getFinalTextViewportWorldSize();

    const availableWidth =
        worldWidth *
        0.84;

    return Math.min(
        1,
        availableWidth /
        baseWorldWidth
    );
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
        return getFinalTextLeftOffsetPx();
    }

    const typography =
        getDevOmTypographyGeometry();

    const geometry =
        getDevOmViewportGeometry(
            ctx,
            typography
        );

    return (
        geometry.startX +
        FINAL_TEXT_LEFT_OFFSET_PX
    );
}

function createFinalTextTargetTexture(responsiveGeometry = getFinalTextResponsiveGeometry()) {

    const finalTextCanvasHeight = getFinalTextCanvasHeight();
    const canvas = document.createElement('canvas');

    canvas.width = FINAL_TEXT_CANVAS_WIDTH;
    canvas.height = finalTextCanvasHeight;

    const ctx =
        canvas.getContext('2d', {
            willReadFrequently: true,
        });

    if (!ctx) {
        return null;
    }

    ctx.clearRect(
        0,
        0,
        FINAL_TEXT_CANVAS_WIDTH,
        finalTextCanvasHeight
    );

    ctx.fillStyle = '#ffffff';

    const { worldWidth, worldHeight } = getFinalTextViewportWorldSize();
    const canvasScale = FINAL_TEXT_CANVAS_WIDTH / window.innerWidth;
    const verticalOffsetPx =(responsiveGeometry.verticalOffsetVh /100) *window.innerHeight;
    const fontSize = responsiveGeometry.fontSize * canvasScale;
    const font = `100 ${fontSize}px ` + `"Helvetica Neue", Arial, sans-serif`;
    const letterSpacing = responsiveGeometry.letterSpacing * canvasScale;
    const textX = responsiveGeometry.left * canvasScale;
    const firstLineBaseline =
        (
            responsiveGeometry.firstLineBaseline +
            verticalOffsetPx
        ) *
        canvasScale;

    const secondLineBaseline =
        (
            responsiveGeometry.secondLineBaseline +
            verticalOffsetPx
        ) *
        canvasScale;

    const thirdLineBaseline =
        (
            responsiveGeometry.thirdLineBaseline +
            verticalOffsetPx
        ) *
        canvasScale;

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
            finalTextCanvasHeight
        );

    const pixels =
        imageData.data;

    const candidates =
        [];

    for (
        let y = 0;
        y < finalTextCanvasHeight;
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
                finalTextCanvasHeight;

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
    onScrollIndicatorReady,
    scrollProgress,
    introComplete,
    postIntroScrollStarted
}) {
    const [textTargetTexture, setTextTargetTexture] = useState(null);
    const [devOmFullTargetTexture, setDevOmFullTargetTexture] = useState(null);
    const [finalTextTargetTexture, setFinalTextTargetTexture] = useState(null);
    const [finalTextLeft, setFinalTextLeft] = useState(0);
    const [devOmTypography, setDevOmTypography] = useState(null);
    const [finalTextResponsiveGeometry, setFinalTextResponsiveGeometry] = useState(null);
    const [currentTargetTexture, setCurrentTargetTexture,] = useState(null);
    const [textEnabled, setTextEnabled,] = useState(true);
    const [windActive, setWindActive,] = useState(false);
    const [devOmMuiVisible, setDevOmMuiVisible,] = useState(false);
    const [finalTextMuiVisible, setFinalTextMuiVisible,] = useState(false);
    const introCompleteRef = useRef(false);

    const devOmX = useTransform(scrollProgress,
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

    const muiScale = useTransform(scrollProgress,
        [0, 0.30, 0.46, 0.58],
        [1, 0.70, 0.70, 0.78]
    );


    useEffect(() => {

        let cancelled = false;

        async function prepareFontsAndTextures() {
            try {
                await loadInitialTextFont();

                if (cancelled) {
                    return;
                }

                const nextDevOmTypography = getDevOmTypographyGeometry();
                const sentenceTexture = createSentenceTargetTexture();
                const devOmTexture = createDevOmTargetTexture(DEVOM_FULL_RATIO);
                const responsiveGeometry = getFinalTextResponsiveGeometry();
                const finalTexture = createFinalTextTargetTexture(responsiveGeometry);

                setDevOmTypography(nextDevOmTypography);
                setTextTargetTexture(sentenceTexture);
                setDevOmFullTargetTexture(devOmTexture);
                setFinalTextTargetTexture(finalTexture);
                setFinalTextLeft(responsiveGeometry.left);
                setFinalTextResponsiveGeometry(responsiveGeometry);

            } catch (error) {
                console.error(
                    'Failed to load fonts:',
                    error
                );

                if (cancelled) {
                    return;
                }

                const nextDevOmTypography = getDevOmTypographyGeometry();
                const sentenceTexture = createSentenceTargetTexture();
                const devOmTexture = createDevOmTargetTexture(DEVOM_FULL_RATIO);
                const responsiveGeometry = getFinalTextResponsiveGeometry();
                const finalTexture = createFinalTextTargetTexture(responsiveGeometry);

                setDevOmTypography(nextDevOmTypography);
                setTextTargetTexture(sentenceTexture);
                setDevOmFullTargetTexture(devOmTexture);
                setFinalTextTargetTexture(finalTexture);
                setFinalTextLeft(responsiveGeometry.left);
                setFinalTextResponsiveGeometry(responsiveGeometry);
            }
        }

        prepareFontsAndTextures();

        return () => {
            cancelled =
                true;
        };
    }, []);

    useEffect(() => {
        if (!finalTextTargetTexture) {
            return;
        }

        function handleResize() {
            const responsiveGeometry =
                getFinalTextResponsiveGeometry();

            const nextTexture =
                createFinalTextTargetTexture(
                    responsiveGeometry
                );

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
                responsiveGeometry.left
            );

            setFinalTextResponsiveGeometry(
                responsiveGeometry
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
                                                            if (introCompleteRef.current) {
                                                                return;
                                                            }

                                                            onScrollIndicatorReady?.();

                                                            window.setTimeout(() => {
                                                                if (introCompleteRef.current) {
                                                                    return;
                                                                }

                                                                introCompleteRef.current = true;

                                                                onIntroComplete?.();
                                                            }, 1000);
                                                        }, FINAL_MUI_FADE_DURATION - 1000);

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

                    x: postIntroScrollStarted ? devOmX : 0,
                    scale: postIntroScrollStarted ? muiScale : 1,

                    transformOrigin:
                        'center center',

                    opacity:
                        devOmMuiVisible
                            ? 1
                            : 0,

                    transition:
                        `opacity ${DEVOM_MUI_FADE_DURATION}ms ease`,
                }}
            >
                <div
                    style={{
                        display:
                            'flex',

                        alignItems:
                            'baseline',

                        justifyContent:
                            'center',

                        whiteSpace:
                            'nowrap',
                    }}
                >
                    <Typography
                        component="span"
                        sx={{
                            fontFamily:
                                DEVOM_LEFT_FONT_FAMILY,

                            fontSize:
                                devOmTypography
                                    ? `${devOmTypography.baseFontSize}px`
                                    : 'clamp(6rem, 15vw, 15rem)',

                            fontWeight:
                                DEVOM_LEFT_FONT_WEIGHT,

                            lineHeight:
                                1,

                            letterSpacing:
                                `${devOmTypography?.letterSpacing ?? 0}px`,

                            color:
                                colors.accent.primary,

                            userSelect:
                                'none',
                        }}
                    >
                        {DEVOM_TEXT_LEFT}
                    </Typography>

                    <Typography
                        component="span"
                        sx={{
                            fontFamily:
                                DEVOM_CENTER_FONT_FAMILY,

                            fontSize:
                                devOmTypography
                                    ? `${devOmTypography.centerFontSize}px`
                                    : 'calc(clamp(6rem, 15vw, 15rem) * 1.10256)',

                            fontWeight:
                                DEVOM_CENTER_FONT_WEIGHT,

                            lineHeight:
                                1,

                            letterSpacing:
                                `${devOmTypography?.letterSpacing ?? 0}px`,

                            color:
                                colors.accent.secondary,

                            userSelect:
                                'none',
                        }}
                    >
                        {DEVOM_TEXT_CENTER}
                    </Typography>

                    <Typography
                        component="span"
                        sx={{
                            fontFamily:
                                DEVOM_LEFT_FONT_FAMILY,

                            fontSize:
                                devOmTypography
                                    ? `${devOmTypography.baseFontSize}px`
                                    : 'clamp(6rem, 15vw, 15rem)',

                            fontWeight:
                                DEVOM_LEFT_FONT_WEIGHT,

                            lineHeight:
                                1,

                            letterSpacing:
                                `${devOmTypography?.letterSpacing ?? 0}px`,

                            color:
                                colors.accent.primary,

                            userSelect:
                                'none',
                        }}
                    >
                        {DEVOM_TEXT_RIGHT}
                    </Typography>
                </div>
            </motion.div>

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

                    x: postIntroScrollStarted ? devOmX : 0,
                    scale: postIntroScrollStarted ? muiScale : 1,

                    transformOrigin:
                        'center center',
                }}
            >
                <Typography
                    component="div"
                    sx={{
                        position: 'absolute',
                        left: `${finalTextLeft}px`,
                        top: '50%',
                        width: finalTextResponsiveGeometry
                            ? `${finalTextResponsiveGeometry.containerWidth}px`
                            : FINAL_TEXT_CONTAINER_WIDTH,

                        textAlign: 'left',
                        fontFamily: '"Helvetica Neue", Arial, sans-serif',
                        fontSize: finalTextResponsiveGeometry
                            ? `${finalTextResponsiveGeometry.fontSize}px`
                            : 'clamp(1.4rem, 1.8vw, 3.8rem)',

                        fontWeight: 100,
                        lineHeight: finalTextResponsiveGeometry
                            ? `${finalTextResponsiveGeometry.lineHeight}px`
                            : FINAL_TEXT_LINE_HEIGHT,

                        letterSpacing: finalTextResponsiveGeometry
                            ? `${finalTextResponsiveGeometry.letterSpacing}px`
                            : '0.018em',

                        color: colors.accent.primary,
                        userSelect: 'none',
                        whiteSpace: 'normal',
                        opacity: finalTextMuiVisible
                            ? 1
                            : 0,
                        transform: finalTextResponsiveGeometry
                            ? `translateY(calc(-50% + ${finalTextResponsiveGeometry.verticalOffsetVh}vh))`
                            : 'translateY(calc(-50% + 24vh))',
                        transition: `opacity ${FINAL_MUI_FADE_DURATION}ms ease`,
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