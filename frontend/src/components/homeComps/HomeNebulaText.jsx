import {
    forwardRef,
    useEffect,
    useImperativeHandle,
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

import {
    nebulaWipeState,
} from '../whatibuildComps/nebulaWipe'


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


const createTextTargetTexture = ({
    element,
    lines,
}) => {
    if (
        !element ||
        !lines?.length
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

    /*
     * The shared nebula camera is:
     *
     * position z = 10
     * FOV = 60
     *
     * We use the exact same projection here so the
     * particle target occupies the same screen geometry
     * as the MUI Typography.
     */

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

    /*
     * Use the actual browser-computed MUI typography.
     */

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

    /*
     * Render at viewport resolution so the resulting
     * particle coordinates can be mapped directly back
     * to the Three.js camera.
     */

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

    if (!context) {
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

    /*
     * Typography's real bounding box is used as the
     * exact particle target position.
     */

    const centerX =
        rect.left +
        rect.width / 2

    const centerY =
        rect.top +
        rect.height / 2

    const totalTextHeight =
        lineHeight *
        lines.length

    const firstLineCenterY =
        centerY -
        totalTextHeight / 2 +
        lineHeight / 2

    lines.forEach(
        (
            line,
            index,
        ) => {
            const lineY =
                firstLineCenterY +
                index *
                lineHeight

            drawLetterSpacedText({
                context,
                text:
                    line,
                centerX,
                baselineY:
                    lineY,
                letterSpacing,
            })
        },
    )

    const image =
        context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
        )

    const data =
        new Float32Array(
            PARTICLE_COUNT *
            4,
        )

    const candidates =
        []

    /*
     * Do not inspect every pixel at extremely large
     * desktop resolutions. A small sampling step keeps
     * the target generation inexpensive while retaining
     * enough geometry for the 262k-particle system.
     */

    const sampleStep =
        Math.max(
            1,
            Math.ceil(
                Math.max(
                    viewportWidth,
                    viewportHeight,
                ) /
                1600,
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
            ) >>> 0

        const normalizedHash =
            hash /
            4294967295

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
                variation * 1.71,
            ) *
            0.008

        data[
            textureIndex + 1
        ] =
            worldY +
            Math.cos(
                variation * 1.43,
            ) *
            0.008

        data[
            textureIndex + 2
        ] =
            Math.sin(
                variation * 0.91,
            ) *
            0.025

        data[
            textureIndex + 3
        ] = 1
    }

    return createTexture(
        data,
    )
}


const HomeNebulaText = forwardRef(
    (
        {
            text,
            lines = null,

            typographySx = {},

            showTypography = false,

            typographyOpacity = 0,

            nebulaEnabled = true,

            textStrength = 1,

            disturbance = false,

            disturbanceDirection =
            'right',

            zIndex = 3,

            onTypographyReady = null,
        },
        ref,
    ) => {
        const typographyRef =
            useRef(null)

        const [
            textTargetTexture,
            setTextTargetTexture,
        ] = useState(null)

        const wipeIndexRef =
            useRef(
                Math.random(),
            )

        const animationFrameRef =
            useRef(null)

        const resizeObserverRef =
            useRef(null)

        const disturbanceStartRef =
            useRef(null)

        const lastDisturbanceRef =
            useRef(false)

        const actualLines =
            lines ||
            [text]

        useImperativeHandle(
            ref,
            () => ({
                getElement:
                    () =>
                        typographyRef.current,
            }),
            [],
        )

        /*
         * ----------------------------------------------------
         * TEXTURE CREATION
         * ----------------------------------------------------
         */

        useEffect(
            () => {
                let cancelled =
                    false

                const rebuild =
                    () => {
                        if (
                            cancelled ||
                            !typographyRef.current
                        ) {
                            return
                        }

                        const texture =
                            createTextTargetTexture({
                                element:
                                    typographyRef.current,
                                lines:
                                    actualLines,
                            })

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

                        if (
                            onTypographyReady
                        ) {
                            onTypographyReady()
                        }
                    }

                const start =
                    async () => {
                        if (
                            document.fonts
                        ) {
                            try {
                                await document.fonts.ready
                            } catch {
                                // Continue with the browser's
                                // currently available font.
                            }
                        }

                        if (
                            cancelled
                        ) {
                            return
                        }

                        rebuild()

                        const observer =
                            new ResizeObserver(
                                () => {
                                    rebuild()
                                },
                            )

                        if (
                            typographyRef.current
                        ) {
                            observer.observe(
                                typographyRef.current,
                            )
                        }

                        resizeObserverRef.current =
                            observer
                    }

                start()

                return () => {
                    cancelled =
                        true

                    resizeObserverRef.current?.disconnect()

                    resizeObserverRef.current =
                        null

                    setTextTargetTexture(
                        previous => {
                            previous?.dispose()

                            return null
                        },
                    )
                }
            },
            [
                actualLines.join('|'),
                onTypographyReady,
            ],
        )

        /*
         * ----------------------------------------------------
         * WIND / DISTURBANCE
         * ----------------------------------------------------
         */

        useEffect(
            () => {
                if (
                    !disturbance ||
                    !typographyRef.current
                ) {
                    lastDisturbanceRef.current =
                        false

                    if (
                        animationFrameRef.current
                    ) {
                        cancelAnimationFrame(
                            animationFrameRef.current,
                        )

                        animationFrameRef.current =
                            null
                    }

                    nebulaWipeState.current =
                        null

                    return undefined
                }

                if (
                    lastDisturbanceRef.current
                ) {
                    return undefined
                }

                lastDisturbanceRef.current =
                    true

                const rect =
                    typographyRef.current.getBoundingClientRect()

                const width =
                    Math.max(
                        rect.width *
                        0.72,
                        180,
                    )

                const height =
                    Math.max(
                        rect.height *
                        1.15,
                        100,
                    )

                const viewportWidth =
                    window.innerWidth

                const direction =
                    disturbanceDirection ===
                        'left'
                        ? -1
                        : 1

                const startX =
                    direction > 0
                        ? -width * 1.15
                        : viewportWidth +
                        width * 0.15

                const endX =
                    direction > 0
                        ? viewportWidth +
                        width * 0.15
                        : -width * 1.15

                const startY =
                    rect.top +
                    rect.height / 2 -
                    height / 2

                const distance =
                    Math.abs(
                        endX -
                        startX,
                    )

                const duration =
                    1050

                const startedAt =
                    performance.now()

                disturbanceStartRef.current =
                    startedAt

                const animate =
                    now => {
                        const elapsed =
                            now -
                            startedAt

                        const progress =
                            Math.min(
                                elapsed /
                                duration,
                                1,
                            )

                        const eased =
                            1 -
                            Math.pow(
                                1 -
                                progress,
                                3,
                            )

                        const x =
                            startX +
                            (
                                endX -
                                startX
                            ) *
                            eased

                        nebulaWipeState.current =
                        {
                            index:
                                wipeIndexRef.current,

                            x,

                            y:
                                startY,

                            width,

                            height,
                        }

                        if (
                            progress <
                            1
                        ) {
                            animationFrameRef.current =
                                requestAnimationFrame(
                                    animate,
                                )

                            return
                        }

                        nebulaWipeState.current =
                            null

                        animationFrameRef.current =
                            null
                    }

                /*
                 * Force a first frame so the wipe state
                 * exists immediately.
                 */

                nebulaWipeState.current =
                {
                    index:
                        wipeIndexRef.current,

                    x:
                        startX,

                    y:
                        startY,

                    width,

                    height,
                }

                animationFrameRef.current =
                    requestAnimationFrame(
                        animate,
                    )

                return () => {
                    if (
                        animationFrameRef.current
                    ) {
                        cancelAnimationFrame(
                            animationFrameRef.current,
                        )

                        animationFrameRef.current =
                            null
                    }

                    nebulaWipeState.current =
                        null
                }
            },
            [
                disturbance,
                disturbanceDirection,
            ],
        )

        useEffect(
            () => {
                return () => {
                    if (
                        animationFrameRef.current
                    ) {
                        cancelAnimationFrame(
                            animationFrameRef.current,
                        )
                    }

                    nebulaWipeState.current =
                        null

                    textTargetTexture?.dispose()
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

                    zIndex,
                }}
            >
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

                        whiteSpace:
                            'pre-line',

                        textAlign:
                            'center',

                        opacity:
                            typographyOpacity,

                        pointerEvents:
                            'none',

                        ...typographySx,
                    }}
                >
                    {actualLines.join(
                        '\n',
                    )}
                </Typography>

                {nebulaEnabled && (
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
                            textStrength
                        }
                    />
                )}
            </Box>
        )
    },
)

HomeNebulaText.displayName =
    'HomeNebulaText'

export default HomeNebulaText