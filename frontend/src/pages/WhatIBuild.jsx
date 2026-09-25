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
   * Keep the glyph clean.
   *
   * No blur.
   * No enlarged stroke.
   * No duplicated outline.
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
   * We keep most of the actual glyph pixels,
   * but deliberately remove a small percentage.
   *
   * This creates density without producing
   * a solid particle wall.
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
       * Around 10% of the glyph pixels are
       * removed.
       *
       * The old version removed ~18%, which
       * made the letters unnecessarily thin.
       */
      const glyphHash =
        (
          textureX * 374761393 +
          textureY * 668265263
        ) %
        100

      if (
        glyphHash < 10
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
       * IMPORTANT:
       *
       * Keep the typography essentially on
       * one depth plane.
       *
       * The previous Z variation was one of
       * the things creating the perceived
       * duplicate/ghost text.
       */
      const worldZ = 0

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
   * DISTRIBUTE TARGETS
   * ----------------------------------------
   *
   * We intentionally don't use every particle.
   *
   * The text should be dense enough to read,
   * but it must still feel like the nebula.
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
       * Around 54% of all particles can
       * participate in the core typography.
       *
       * This is slightly lower than the old
       * 58%, compensating for the denser glyph.
       */
      if (
        personality >=
        0.54
      ) {
        data[
          textureIndex + 3
        ] = 0.0

        continue
      }

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
       * No meaningful positional offset.
       *
       * Especially no Z offset.
       *
       * This is important for eliminating
       * the double-image effect.
       */
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