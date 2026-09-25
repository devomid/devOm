import {
  useEffect,
  useState,
} from 'react'

import * as THREE from 'three'

import NebulaBackground from '../components/nebula/nebula'

const TEXTURE_SIZE = 512

const PARTICLE_COUNT =
  TEXTURE_SIZE *
  TEXTURE_SIZE

const PARTICLE_PERSONALITY_MULTIPLIER =
  15731

const PARTICLE_PERSONALITY_OFFSET =
  789221

const createParticlePersonality = (
  particleIndex,
) => {
  return (
    (
      (
        particleIndex *
        PARTICLE_PERSONALITY_MULTIPLIER +
        PARTICLE_PERSONALITY_OFFSET
      ) % 10000
    ) /
    10000
  )
}

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
   * EXTRACT GLYPH
   * ------------------------------------------------
   *
   * We deliberately keep the glyph particulate.
   * No stroke and no secondary copy.
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
       * Remove a small amount of the glyph's
       * raster pixels so it doesn't become solid.
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

  /*
   * ------------------------------------------------
   * SELECT EXACTLY ONE PARTICLE PER GLYPH POINT
   * ------------------------------------------------
   *
   * This is the important part.
   *
   * Previously:
   *
   *   thousands of particles
   *       ↓
   *   same glyph positions repeatedly
   *       ↓
   *   overlapping copies / ghost text
   *
   * Now:
   *
   *   one selected particle
   *       ↓
   *   one glyph position
   *
   * The nebula still contains all 262,144 particles.
   * Only the particles selected here receive text
   * targets.
   */

  const data =
    new Float32Array(
      PARTICLE_COUNT * 4,
    )

  const particleCandidates = []

  for (
    let particleIndex = 0;
    particleIndex < PARTICLE_COUNT;
    particleIndex += 1
  ) {
    const personality =
      createParticlePersonality(
        particleIndex,
      )

    particleCandidates.push({
      particleIndex,
      personality,
    })
  }

  /*
   * Sort deterministically by personality.
   *
   * This gives us a stable population beginning
   * with the lowest personality values.
   *
   * Those are also the particles the shader
   * recognizes as the core text population.
   */

  particleCandidates.sort(
    (
      a,
      b,
    ) =>
      a.personality -
      b.personality,
  )

  const textParticleCount =
    Math.min(
      textPoints.length,
      particleCandidates.length,
    )

  /*
   * Each glyph point receives exactly one particle.
   */

  for (
    let pointIndex = 0;
    pointIndex < textParticleCount;
    pointIndex += 1
  ) {
    const candidate =
      particleCandidates[
      pointIndex
      ]

    const point =
      textPoints[
      pointIndex
      ]

    const textureIndex =
      candidate.particleIndex * 4

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