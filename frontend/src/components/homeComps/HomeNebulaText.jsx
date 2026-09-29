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

const TEXT_LINE_1 = 'Every little idea is';
const TEXT_LINE_2 = 'like a small particle.';

const TEXTURE_SIZE = 512;
const PARTICLE_COUNT = TEXTURE_SIZE * TEXTURE_SIZE;

const TEXT_PARTICLE_RATIO = 0.30;

const TEXT_CANVAS_WIDTH = 1600;
const TEXT_CANVAS_HEIGHT = 520;

const TEXT_WORLD_WIDTH = 9.0;
const TEXT_WORLD_HEIGHT = 2.9;

const TARGET_JITTER_XY = 0.008;
const TARGET_JITTER_Z = 0.048;

const WIND_START_DELAY = 10000;

// Time the text remains completely undisturbed
// after the wind event begins.
const WIND_TEXT_HOLD = 5;

function drawLetterSpacedText(
    ctx,
    text,
    centerX,
    baselineY,
    font,
    letterSpacing
) {
    ctx.font = font;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    const characters = [...text];

    const widths = characters.map(
        (character) =>
            ctx.measureText(character).width
    );

    const totalWidth =
        widths.reduce(
            (sum, width) => sum + width,
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
        (character, index) => {
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

function createTextTargetTexture() {
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

    const fontSize = 170;

    const font =
        `550 ${fontSize}px ` +
        `"Neue Montreal", "Helvetica Neue", Arial, sans-serif`;

    const letterSpacing =
        fontSize * 0.018;

    const centerX =
        TEXT_CANVAS_WIDTH / 2;

    const centerY =
        TEXT_CANVAS_HEIGHT / 2;

    const lineGap =
        fontSize * 0.18;

    const lineOffset =
        (fontSize + lineGap) / 2;

    const baselineCorrection =
        fontSize * 0.34;

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

    const targetData =
        new Float32Array(
            PARTICLE_COUNT * 4
        );

    const candidates = [];

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
                ) * 4;

            const alpha =
                pixels[
                pixelIndex + 3
                ];

            if (alpha > 100) {
                candidates.push({
                    x,
                    y,
                    alpha,
                });
            }
        }
    }

    const requiredTextParticles =
        Math.floor(
            PARTICLE_COUNT *
            TEXT_PARTICLE_RATIO
        );

    for (
        let i = 0;
        i < PARTICLE_COUNT;
        i += 1
    ) {
        const offset = i * 4;

        if (
            i <
            requiredTextParticles &&
            candidates.length > 0
        ) {
            const candidateIndex =
                Math.floor(
                    (
                        i /
                        requiredTextParticles
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
                particle.alpha / 255;
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
    const textTargetTexture =
        useMemo(
            () =>
                createTextTargetTexture(),
            []
        );

    const [
        windActive,
        setWindActive,
    ] = useState(false);

    const [
        textEnabled,
        setTextEnabled,
    ] = useState(true);

    useEffect(() => {
        let releaseTextTimer;

        const windTimer =
            window.setTimeout(() => {
                // Start the wind event.
                // The shader itself will hold the
                // actual wind force for 250ms.
                setWindActive(true);

                releaseTextTimer =
                    window.setTimeout(() => {
                        // Now release the text target.
                        setTextEnabled(false);
                    }, WIND_TEXT_HOLD);
            }, WIND_START_DELAY);

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
        };
    }, []);

    useEffect(() => {
        return () => {
            textTargetTexture?.dispose();
        };
    }, [
        textTargetTexture,
    ]);

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
                        textTargetTexture
                    )
                }

                textTargetTexture={
                    textTargetTexture
                }

                textStrength={3.3}

                homeWindActive={
                    windActive
                }
            />
        </>
    );
}