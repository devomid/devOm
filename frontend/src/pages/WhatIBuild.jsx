import {
  useEffect,
  useState,
} from 'react'

import * as THREE from 'three'

import NebulaBackground from '../components/nebula/nebula'

const TEXTURE_SIZE = 512

/*
 * This MUST match the text population used by nebula.jsx.
 *
 * Only this population is allowed to form the actual glyph.
 * The remaining particles stay part of the nebula.
 */
const TEXT_PARTICLE_POPULATION = 0.34

/*
 * Same deterministic population calculation used by
 * createParticleData() in nebula.jsx.
 *
 * Keeping this calculation identical in both places is
 * critical: the target texture and GPU simulation must
 * agree about which particles are text particles.
 */
const getParticlePopulation =
  (
    particleIndex,
  ) => {
    return (
      (
        (
          particleIndex *
          15731 +
          789221
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
      `${ fontWeight } ${ fontSize }px ${ fontFamily } `

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
    `${ fontWeight } ${ fontSize }px ${ fontFamily } `

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
   * We intentionally remove some pixels so the typography
   * remains particulate instead of becoming a solid font.
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

  /*
   * One texel represents one simulation particle.
   *
   * IMPORTANT:
   *
   * We no longer independently invent a second population
   * here.
   *
   * The exact same deterministic population calculation
   * is used by nebula.jsx.
   *
   * Therefore:
   *
   *     target particle === text particle
   *
   * with no mismatch.
   */
  const data =
    new Float32Array(
      TEXTURE_SIZE *
      TEXTURE_SIZE *
      4,
    )

  for (
    let particleIndex = 0;
    particleIndex <
    TEXTURE_SIZE *
      TEXTURE_SIZE;
    particleIndex += 1
  ) {
    const textureIndex =
      particleIndex * 4

    const population =
      getParticlePopulation(
        particleIndex,
      )

    /*
     * Only the actual TEXT population receives
     * a target coordinate.
     *
     * Joining/free particles get alpha = 0.
     *
     * This is the critical change that prevents another
     * population from independently forming the same glyph.
     */
    if (
      population >=
      TEXT_PARTICLE_POPULATION
    ) {
      continue
    }

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