import {
  useEffect,
  useState,
} from 'react'

import * as THREE from 'three'

import NebulaBackground from '../components/nebula/nebula'

const TEXTURE_SIZE = 512
const TEXT_PARTICLE_COUNT = 65536

const createTextTargetTexture = (
  text,
) => {
  const data =
    new Float32Array(
      TEXTURE_SIZE *
      TEXTURE_SIZE *
      4,
    )

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

  context.textAlign =
    'center'

  context.textBaseline =
    'middle'

  let fontSize =
    132

  while (
    fontSize > 20
  ) {
    context.font =
      `400 ${fontSize}px Arial, Helvetica, sans-serif`

    if (
      context.measureText(
        text,
      ).width <=
      TEXTURE_SIZE * 0.91
    ) {
      break
    }

    fontSize -= 2
  }

  context.font =
    `400 ${fontSize}px Arial, Helvetica, sans-serif`

  context.fillStyle =
    '#ffffff'

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

  const candidates = []

  /*
   * Read the actual glyph.
   *
   * One candidate represents one visible
   * raster point of the text.
   */
  for (
    let y = 0;
    y < TEXTURE_SIZE;
    y += 1
  ) {
    for (
      let x = 0;
      x < TEXTURE_SIZE;
      x += 1
    ) {
      const pixelIndex =
        (
          y *
          TEXTURE_SIZE +
          x
        ) * 4

      const alpha =
        imageData.data[
        pixelIndex + 3
        ]

      if (
        alpha < 80
      ) {
        continue
      }

      const normalizedX =
        x /
        (
          TEXTURE_SIZE - 1
        )

      const normalizedY =
        y /
        (
          TEXTURE_SIZE - 1
        )

      candidates.push({
        x:
          (
            normalizedX -
            0.5
          ) * 13.6,

        y:
          (
            0.5 -
            normalizedY
          ) * 6.35,

        z:
          Math.sin(
            x * 0.071 +
            y * 0.047,
          ) * 0.035,
      })
    }
  }

  if (
    candidates.length === 0
  ) {
    return null
  }

  /*
   * Keep the target particles in the first
   * contiguous part of the simulation texture.
   *
   * This is intentional.
   *
   * The [16] physics already proved that this
   * particle/UV relationship forms correctly.
   */
  const targetCount =
    Math.min(
      candidates.length,
      TEXT_PARTICLE_COUNT,
    )

  for (
    let particleIndex = 0;
    particleIndex < targetCount;
    particleIndex += 1
  ) {
    /*
     * Distribute the available particles
     * across the complete glyph rather than
     * repeatedly copying the same beginning
     * of the glyph.
     */
    const candidateIndex =
      Math.floor(
        (
          particleIndex /
          targetCount
        ) *
        candidates.length,
      )

    const candidate =
      candidates[
      Math.min(
        candidateIndex,
        candidates.length - 1,
      )
      ]

    const textureIndex =
      particleIndex * 4

    const phase =
      particleIndex *
      0.0137

    data[
      textureIndex
    ] =
      candidate.x +
      Math.sin(
        phase * 1.71,
      ) * 0.006

    data[
      textureIndex + 1
    ] =
      candidate.y +
      Math.cos(
        phase * 1.43,
      ) * 0.006

    data[
      textureIndex + 2
    ] =
      candidate.z +
      Math.sin(
        phase * 0.91,
      ) * 0.018

    data[
      textureIndex + 3
    ] =
      1.0
  }

  /*
   * All remaining particles have no target.
   *
   * They remain part of the surrounding nebula
   * instead of becoming another copy of the text.
   */
  for (
    let particleIndex = targetCount;
    particleIndex <
    TEXTURE_SIZE *
    TEXTURE_SIZE;
    particleIndex += 1
  ) {
    const textureIndex =
      particleIndex * 4

    data[
      textureIndex
    ] =
      0.0

    data[
      textureIndex + 1
    ] =
      0.0

    data[
      textureIndex + 2
    ] =
      0.0

    data[
      textureIndex + 3
    ] =
      0.0
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