import {
  useEffect,
  useState,
} from 'react'

import * as THREE from 'three'

import NebulaBackground from '../components/nebula/nebula'

const TEXTURE_SIZE = 512

const createTextTargetTexture = (
  text,
) => {
  const canvas =
    document.createElement(
      'canvas',
    )

  canvas.width =
    TEXTURE_SIZE

  canvas.height =
    TEXTURE_SIZE

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
    TEXTURE_SIZE,
    TEXTURE_SIZE,
  )

  /*
   * ----------------------------------------
   * TYPOGRAPHY
   * ----------------------------------------
   */

  const fontFamily =
    'Arial, Helvetica, sans-serif'

  const fontWeight =
    400

  let fontSize =
    118

  context.textAlign =
    'center'

  context.textBaseline =
    'middle'

  while (
    fontSize > 20
  ) {
    context.font =
      `${fontWeight} ${fontSize}px ${fontFamily}`

    const measuredWidth =
      context.measureText(
        text,
      ).width

    if (
      measuredWidth <=
      TEXTURE_SIZE * 0.90
    ) {
      break
    }

    fontSize -= 2
  }

  context.font =
    `${fontWeight} ${fontSize}px ${fontFamily}`

  context.fillStyle =
    '#ffffff'

  context.strokeStyle =
    '#ffffff'

  context.lineJoin =
    'round'

  context.lineCap =
    'round'

  /*
   * Keep the glyph geometry clean.
   *
   * We do NOT use blur.
   * We do NOT enlarge the stroke.
   */
  context.lineWidth =
    1

  const centerX =
    TEXTURE_SIZE * 0.5

  const centerY =
    TEXTURE_SIZE * 0.5

  context.fillText(
    text,
    centerX,
    centerY,
  )

  const imageData =
    context.getImageData(
      0,
      0,
      TEXTURE_SIZE,
      TEXTURE_SIZE,
    )

  const textPoints = []

  /*
   * ----------------------------------------
   * EXTRACT GLYPH GEOMETRY
   * ----------------------------------------
   *
   * We intentionally remove some pixels from
   * the glyph itself.
   *
   * This creates real holes in the letters.
   *
   * It is fundamentally different from
   * scattering particles around a complete
   * glyph.
   */

  for (
    let textureY = 0;
    textureY < TEXTURE_SIZE;
    textureY += 1
  ) {
    for (
      let textureX = 0;
      textureX < TEXTURE_SIZE;
      textureX += 1
    ) {
      const pixelIndex =
        (
          textureY *
          TEXTURE_SIZE +
          textureX
        ) * 4

      const alpha =
        imageData.data[
        pixelIndex + 3
        ]

      if (
        alpha <= 40
      ) {
        continue
      }

      /*
       * Deterministic sparse sampling.
       *
       * About 18% of the actual glyph
       * pixels are removed.
       *
       * The remaining points still preserve
       * the recognizable letter geometry.
       */
      const glyphHash =
        (
          textureX * 374761393 +
          textureY * 668265263
        ) %
        100

      if (
        glyphHash < 18
      ) {
        continue
      }

      const normalizedX =
        textureX /
        (
          TEXTURE_SIZE - 1
        )

      const normalizedY =
        textureY /
        (
          TEXTURE_SIZE - 1
        )

      const worldX =
        (
          normalizedX -
          0.5
        ) * 12.8

      const worldY =
        (
          0.5 -
          normalizedY
        ) * 6.0

      /*
       * Almost flat depth.
       *
       * The typography should not become
       * two visible layers in 3D.
       */
      const worldZ =
        Math.sin(
          textureX * 0.11 +
          textureY * 0.07,
        ) * 0.018

      textPoints.push({
        x: worldX,
        y: worldY,
        z: worldZ,
      })
    }
  }

  if (
    textPoints.length === 0
  ) {
    return null
  }

  const data =
    new Float32Array(
      TEXTURE_SIZE *
      TEXTURE_SIZE *
      4,
    )

  const pointCount =
    textPoints.length

  /*
   * ----------------------------------------
   * DISTRIBUTE SPARSE TARGETS
   * ----------------------------------------
   *
   * IMPORTANT:
   *
   * Not every GPU particle receives a target.
   *
   * Approximately:
   *
   *   58% -> may participate in typography
   *   42% -> completely free
   *
   * The shader then divides the 58% into
   * stable text particles and joining particles.
   *
   * Free particles have alpha = 0 and therefore
   * cannot accidentally return to the text.
   */

  for (
    let textureY = 0;
    textureY < TEXTURE_SIZE;
    textureY += 1
  ) {
    for (
      let textureX = 0;
      textureX < TEXTURE_SIZE;
      textureX += 1
    ) {
      const particleIndex =
        textureY *
        TEXTURE_SIZE +
        textureX

      const textureIndex =
        particleIndex *
        4

      /*
       * Deterministic particle personality.
       *
       * It is stable for the lifetime of the
       * particle, so particles don't randomly
       * change identity every frame.
       */
      const personality =
        (
          (
            particleIndex *
            15731 +
            789221
          ) %
          10000
        ) /
        10000

      /*
       * Only 58% of particles receive a target.
       */
      if (
        personality >=
        0.58
      ) {
        data[
          textureIndex + 3
        ] = 0.0

        continue
      }

      /*
       * Spread the selected particles across
       * the actual glyph geometry.
       *
       * No neighboring-pixel duplication.
       */
      const pointSelector =
        (
          particleIndex *
          104729 +
          31337
        ) %
        pointCount

      const point =
        textPoints[
        pointSelector
        ]

      /*
       * Extremely tiny positional variation.
       *
       * This is small enough that it cannot
       * create a visible second copy of the
       * typography.
       */
      const phase =
        particleIndex *
        0.017

      const microX =
        Math.sin(
          phase * 1.73,
        ) * 0.0025

      const microY =
        Math.cos(
          phase * 1.31,
        ) * 0.0025

      const microZ =
        Math.sin(
          phase * 0.87,
        ) * 0.004

      data[
        textureIndex
      ] =
        point.x +
        microX

      data[
        textureIndex + 1
      ] =
        point.y +
        microY

      data[
        textureIndex + 2
      ] =
        point.z +
        microZ

      data[
        textureIndex + 3
      ] = 1.0
    }
  }

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

const WhatIBuild = () => {
  const [
    textTargetTexture,
    setTextTargetTexture,
  ] = useState(null)

  useEffect(() => {
    const texture =
      createTextTargetTexture(
        'WHAT I BUILD',
      )

    setTextTargetTexture(
      texture,
    )

    return () => {
      texture?.dispose()
    }
  }, [])

  return (
    <main
      style={{
        position:
          'relative',

        width:
          '100%',

        minHeight:
          '100vh',

        overflow:
          'hidden',

        background:
          '#050403',
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
    </main>
  )
}

export default WhatIBuild