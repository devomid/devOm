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

  context.textAlign =
    'center'

  context.textBaseline =
    'middle'

  context.fillText(
    text,
    TEXTURE_SIZE * 0.5,
    TEXTURE_SIZE * 0.5,
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
   * ------------------------------------------------
   * EXTRACT ACTUAL GLYPH PIXELS
   * ------------------------------------------------
   *
   * We deliberately remove particles from the glyph.
   *
   * This keeps the text visibly particulate instead
   * of turning it into a solid rasterized font.
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
       * Approximately 14% of the actual glyph
       * pixels are removed.
       *
       * This is intentionally sparse.
       */
      const glyphHash =
        (
          textureX * 374761393 +
          textureY * 668265263
        ) % 100

      if (
        glyphHash < 14
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
       * ONE depth plane.
       *
       * Absolutely no Z noise.
       *
       * This is critical for preventing the
       * perceived second copy of the text.
       */
      const worldZ =
        0

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

  /*
   * ------------------------------------------------
   * PARTICLE → GLYPH OWNERSHIP
   * ------------------------------------------------
   *
   * Only 34% of the complete nebula owns the
   * typography.
   *
   * This is intentional.
   *
   * The previous 54% meant ~141,000 particles
   * were trying to occupy a relatively small
   * number of glyph positions.
   *
   * That produced the "double text" / blurry
   * appearance.
   */

  const textPopulation =
    0.34

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
        particleIndex * 4

      /*
       * Deterministic particle selection.
       */
      const personality =
        (
          (
            particleIndex *
            15731 +
            789221
          ) % 10000
        ) /
        10000

      if (
        personality >=
        textPopulation
      ) {
        data[
          textureIndex + 3
        ] = 0

        continue
      }

      /*
       * IMPORTANT:
       *
       * Every text particle receives exactly
       * one deterministic glyph point.
       *
       * The shader later uses alpha=1 as the
       * authoritative text-particle identity.
       */

      const pointSelector =
        (
          particleIndex *
          104729 +
          31337
        ) %
        textPoints.length

      const point =
        textPoints[
        pointSelector
        ]

      data[
        textureIndex
      ] =
        point.x

      data[
        textureIndex + 1
      ] =
        point.y

      data[
        textureIndex + 2
      ] =
        point.z

      data[
        textureIndex + 3
      ] =
        1
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