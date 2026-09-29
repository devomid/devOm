import {
    useEffect,
    useRef,
    useState,
} from 'react'

import {
    Box,
    Typography,
} from '@mui/material'

import * as THREE from 'three'

import NebulaBackground
    from '../nebula/nebula'


const TEXT =
    'Every little idea is like a small particle.'

const TEXTURE_SIZE =
    512

const PARTICLE_COUNT =
    TEXTURE_SIZE *
    TEXTURE_SIZE

const TEXT_PARTICLE_RATIO =
    0.58

const CAMERA_Z =
    10

const CAMERA_FOV =
    60


const createTexture = (
    data,
) => {
    const texture =
        new THREE.DataTexture(
            data,
            TEXTURE_SIZE,
            TEXTURE_SIZE,
            THREE.RGBAFormat,
            THREE.FloatType,
        )

    texture.minFilter =
        THREE.NearestFilter

    texture.magFilter =
        THREE.NearestFilter

    texture.wrapS =
        THREE.ClampToEdgeWrapping

    texture.wrapT =
        THREE.ClampToEdgeWrapping

    texture.generateMipmaps =
        false

    texture.needsUpdate =
        true

    return texture
}


const parsePixelValue = (
    value,
) => {
    if (
        !value ||
        value === 'normal'
    ) {
        return 0
    }

    const parsed =
        Number.parseFloat(
            value,
        )

    return Number.isFinite(
        parsed,
    )
        ? parsed
        : 0
}


const drawLetterSpacedText = ({
    context,
    text,
    centerX,
    baselineY,
    letterSpacing,
}) => {
    if (
        !text
    ) {
        return
    }

    if (
        Math.abs(
            letterSpacing,
        ) <
        0.01
    ) {
        context.textAlign =
            'center'

        context.fillText(
            text,
            centerX,
            baselineY,
        )

        return
    }

    const characters =
        Array.from(
            text,
        )

    const widths =
        characters.map(
            character =>
                context.measureText(
                    character,
                ).width,
        )

    const totalWidth =
        widths.reduce(
            (
                total,
                width,
            ) =>
                total +
                width,
            0,
        ) +
        letterSpacing *
        Math.max(
            characters.length - 1,
            0,
        )

    let cursor =
        centerX -
        totalWidth / 2

    context.textAlign =
        'left'

    characters.forEach(
        (
            character,
            index,
        ) => {
            context.fillText(
                character,
                cursor,
                baselineY,
            )

            cursor +=
                widths[index] +
                letterSpacing
        },
    )
}


const createTextTargetTexture = (
    element,
) => {
    if (
        !element
    ) {
        return null
    }

    const rect =
        element.getBoundingClientRect()

    if (
        rect.width <= 0 ||
        rect.height <= 0
    ) {
        return null
    }

    const computed =
        window.getComputedStyle(
            element,
        )

    const viewportWidth =
        window.innerWidth

    const viewportHeight =
        window.innerHeight

    const visibleWorldHeight =
        2 *
        CAMERA_Z *
        Math.tan(
            THREE.MathUtils.degToRad(
                CAMERA_FOV / 2,
            ),
        )

    const worldUnitsPerPixel =
        visibleWorldHeight /
        viewportHeight

    const fontSize =
        parsePixelValue(
            computed.fontSize,
        )

    const fontWeight =
        computed.fontWeight ||
        '400'

    const fontStyle =
        computed.fontStyle ||
        'normal'

    const fontFamily =
        computed.fontFamily ||
        '"Neue Montreal", sans-serif'

    const letterSpacing =
        parsePixelValue(
            computed.letterSpacing,
        )

    const lineHeight =
        computed.lineHeight ===
            'normal'
            ? fontSize * 1.2
            : parsePixelValue(
                computed.lineHeight,
            )

    const canvas =
        document.createElement(
            'canvas',
        )

    canvas.width =
        Math.max(
            1,
            Math.ceil(
                viewportWidth,
            ),
        )

    canvas.height =
        Math.max(
            1,
            Math.ceil(
                viewportHeight,
            ),
        )

    const context =
        canvas.getContext(
            '2d',
        )

    if (
        !context
    ) {
        return null
    }

    context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height,
    )

    context.fillStyle =
        '#ffffff'

    context.font =
        `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`

    context.textBaseline =
        'middle'

    const centerX =
        rect.left +
        rect.width / 2

    const centerY =
        rect.top +
        rect.height / 2

    drawLetterSpacedText({
        context,
        text:
            TEXT,
        centerX,
        baselineY:
            centerY +
            (
                lineHeight -
                fontSize
            ) * 0.02,
        letterSpacing,
    })

    const image =
        context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
        )

    const candidates =
        []

    /*
     * Keep target generation reasonably cheap
     * on large displays.
     */
    const sampleStep =
        Math.max(
            1,
            Math.ceil(
                Math.max(
                    viewportWidth,
                    viewportHeight,
                ) /
                2200,
            ),
        )

    for (
        let y = 0;
        y < canvas.height;
        y += sampleStep
    ) {
        for (
            let x = 0;
            x < canvas.width;
            x += sampleStep
        ) {
            const pixelIndex =
                (
                    y *
                    canvas.width +
                    x
                ) *
                4

            const alpha =
                image.data[
                pixelIndex + 3
                ]

            if (
                alpha >
                100
            ) {
                candidates.push({
                    x,
                    y,
                })
            }
        }
    }

    if (
        candidates.length === 0
    ) {
        return null
    }

    const data =
        new Float32Array(
            PARTICLE_COUNT *
            4,
        )

    for (
        let particleIndex = 0;
        particleIndex <
        PARTICLE_COUNT;
        particleIndex += 1
    ) {
        const textureIndex =
            particleIndex *
            4

        const hash =
            (
                particleIndex *
                1664525 +
                1013904223
            ) >>>
            0

        const normalizedHash =
            hash /
            4294967295

        /*
         * The remaining particles stay part
         * of the normal free nebula field.
         */
        if (
            normalizedHash >
            TEXT_PARTICLE_RATIO
        ) {
            data[
                textureIndex + 3
            ] = 0

            continue
        }

        const candidateIndex =
            (
                particleIndex *
                15731 +
                789221
            ) %
            candidates.length

        const candidate =
            candidates[
            candidateIndex
            ]

        const worldX =
            (
                candidate.x -
                viewportWidth / 2
            ) *
            worldUnitsPerPixel

        const worldY =
            (
                viewportHeight / 2 -
                candidate.y
            ) *
            worldUnitsPerPixel

        const variation =
            particleIndex *
            0.0137

        data[
            textureIndex
        ] =
            worldX +
            Math.sin(
                variation *
                1.71,
            ) *
            0.008

        data[
            textureIndex + 1
        ] =
            worldY +
            Math.cos(
                variation *
                1.43,
            ) *
            0.008

        data[
            textureIndex + 2
        ] =
            Math.sin(
                variation *
                0.91,
            ) *
            0.025

        data[
            textureIndex + 3
        ] =
            1
    }

    return createTexture(
        data,
    )
}


const HomeNebulaText = () => {
    const typographyRef =
        useRef(null)

    const [
        textTargetTexture,
        setTextTargetTexture,
    ] = useState(null)

    useEffect(
        () => {
            let cancelled =
                false

            let resizeObserver =
                null

            const rebuild =
                () => {
                    if (
                        cancelled ||
                        !typographyRef.current
                    ) {
                        return
                    }

                    const texture =
                        createTextTargetTexture(
                            typographyRef.current,
                        )

                    if (
                        !texture
                    ) {
                        return
                    }

                    setTextTargetTexture(
                        previous => {
                            previous?.dispose()

                            return texture
                        },
                    )
                }

            const start =
                async () => {
                    if (
                        document.fonts
                    ) {
                        try {
                            await document.fonts.ready
                        } catch {
                            /*
                             * Continue using whatever
                             * font is currently available.
                             */
                        }
                    }

                    if (
                        cancelled
                    ) {
                        return
                    }

                    rebuild()

                    resizeObserver =
                        new ResizeObserver(
                            () => {
                                rebuild()
                            },
                        )

                    if (
                        typographyRef.current
                    ) {
                        resizeObserver.observe(
                            typographyRef.current,
                        )
                    }
                }

            start()

            window.addEventListener(
                'resize',
                rebuild,
            )

            return () => {
                cancelled =
                    true

                resizeObserver?.disconnect()

                window.removeEventListener(
                    'resize',
                    rebuild,
                )

                setTextTargetTexture(
                    previous => {
                        previous?.dispose()

                        return null
                    },
                )
            }
        },
        [],
    )

    return (
        <Box
            sx={{
                position:
                    'absolute',

                inset:
                    0,

                width:
                    '100%',

                height:
                    '100%',

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
            {/*
             * This Typography is intentionally invisible.
             *
             * It is the exact geometric reference used to
             * create the particle target.
             */}
            <Typography
                ref={
                    typographyRef
                }
                component="div"
                sx={{
                    position:
                        'absolute',

                    left:
                        '50%',

                    top:
                        '50%',

                    transform:
                        'translate(-50%, -50%)',

                    margin:
                        0,

                    padding:
                        0,

                    width:
                        'min(90vw, 1200px)',

                    textAlign:
                        'center',

                    whiteSpace:
                        'nowrap',

                    fontFamily:
                        '"Neue Montreal", "Helvetica Neue", Arial, sans-serif',

                    fontSize:
                        'clamp(2rem, 4.2vw, 4.8rem)',

                    fontWeight:
                        500,

                    lineHeight:
                        1.05,

                    letterSpacing:
                        '-0.045em',

                    color:
                        'transparent',

                    opacity:
                        0,

                    pointerEvents:
                        'none',
                }}
            >
                {TEXT}
            </Typography>

            <Box
                sx={{
                    position:
                        'absolute',

                    inset:
                        0,

                    width:
                        '100%',

                    height:
                        '100%',

                    pointerEvents:
                        'none',
                }}
            >
                <NebulaBackground
                    textEnabled={
                        Boolean(
                            textTargetTexture,
                        )
                    }

                    textTargetTexture={
                        textTargetTexture
                    }

                    textStrength={
                        1.0
                    }
                />
            </Box>
        </Box>
    )
}

export default HomeNebulaText