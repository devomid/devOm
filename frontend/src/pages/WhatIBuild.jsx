import {
  useEffect,
  useState,
} from 'react'

import * as THREE from 'three'

import NebulaBackground from '../components/nebula/nebula'

const TEXTURE_SIZE = 512

const TEXT_PARTICLE_POPULATION =
  0.34

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
   * Extract the actual glyph.
   *
   * We remove a small percentage of pixels so
   * the letters remain particulate rather than
   * becoming a solid font.
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

      textPoints.push({
        x: worldX,
        y: worldY,
        z: 0,
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
   * IMPORTANT
   *
   * This personality calculation is now the
   * exact same calculation used by nebula.jsx.
   *
   * Therefore the particle receiving a target
   * here is the same particle the simulation
   * recognizes as a text particle.
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
        particleIndex * 4

      const personality =
        (
          (
            particleIndex *
            15731 +
            789221
          ) % 10000
        ) /
        10000

      /*
       * Only the first 34% of particles become
       * actual text particles.
       *
       * This is deliberately sparse enough to
       * avoid the double/ghost typography.
       */

      if (
        personality >=
        TEXT_PARTICLE_POPULATION
      ) {
        continue
      }

      /*
       * Deterministic glyph assignment.
       *
       * Every selected particle gets one position.
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