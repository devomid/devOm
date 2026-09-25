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
   *
   * These are the three controls you can
   * change later.
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

  /*
   * Find the largest size that fits.
   */

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
   * Keep the stroke relatively subtle.
   *
   * The actual particle density should
   * define the thickness of the letters.
   */

  context.lineWidth =
    3

  const centerX =
    TEXTURE_SIZE * 0.5

  const centerY =
    TEXTURE_SIZE * 0.5

  /*
   * Draw the actual glyphs.
   */

  context.strokeText(
    text,
    centerX,
    centerY,
  )

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
   * No random X/Y distortion here.
   *
   * The target itself must be geometrically
   * correct so the particle simulation can
   * make the actual letters.
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
        alpha > 40
      ) {
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
         * Only very small depth variation.
         *
         * Do NOT disturb X/Y.
         */

        const worldZ =
          Math.sin(
            textureX * 0.11 +
            textureY * 0.07,
          ) * 0.045

        textPoints.push({
          x: worldX,
          y: worldY,
          z: worldZ,
        })
      }
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
   * Every GPU particle receives a valid
   * target position.
   *
   * The shader decides whether that particle
   * actually participates in the typography.
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

      /*
       * Scramble the target assignment so
       * neighboring GPU particles don't map
       * to neighboring pixels of the glyph.
       */

      const scrambledIndex =
        (
          particleIndex *
          15731 +
          789221
        ) %
        pointCount

      const point =
        textPoints[
        scrambledIndex
        ]

      const textureIndex =
        particleIndex *
        4

      /*
       * Extremely small living movement.
       *
       * The glyph itself remains clean.
       */

      const phase =
        particleIndex *
        0.017

      const microX =
        Math.sin(
          phase * 1.73,
        ) * 0.006

      const microY =
        Math.cos(
          phase * 1.31,
        ) * 0.006

      const microZ =
        Math.sin(
          phase * 0.87,
        ) * 0.012

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

      /*
       * Every particle has a valid target.
       *
       * Membership is handled by the shader.
       */

      data[
        textureIndex + 3
      ] =
        1.0
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