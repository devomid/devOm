import {
  useEffect,
  useState,
} from 'react'

import * as THREE from 'three'

import NebulaBackground from '../components/nebula/nebula'

const TEXTURE_SIZE = 512

/*
 * Keep this deliberately low.
 *
 * 24,000 text particles are enough to make the glyph
 * clearly readable while leaving the majority of the
 * nebula completely free.
 */
const TEXT_PARTICLE_COUNT = 24000

const PARTICLE_COUNT = 262144

const TEXT_PARTICLE_POPULATION =
  TEXT_PARTICLE_COUNT /
  PARTICLE_COUNT

/*
 * This MUST match nebula.jsx.
 *
 * Every particle receives exactly the same deterministic
 * population value in both places.
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

  /*
   * Use a strong, clean font shape first.
   *
   * We do NOT randomly delete pixels here.
   * Randomly deleting individual pixels was making
   * the letter structure fall apart.
   */
  const fontFamily =
    'Arial, Helvetica, sans-serif'

  const fontWeight =
    600

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

  /*
   * First collect the COMPLETE glyph.
   *
   * No random thinning yet.
   */
  const glyphPoints = []

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

      glyphPoints.push({
        x:
          (
            normalizedX -
            0.5
          ) * 12.8,

        y:
          (
            0.5 -
            normalizedY
          ) * 6.0,

        z: 0,
      })
    }
  }

  if (
    glyphPoints.length === 0
  ) {
    return null
  }

  /*
   * Reduce the solid font to a controlled number of particles.
   *
   * The points are taken at a regular interval instead of
   * randomly deleting pixels. This keeps the geometry of
   * every letter intact.
   */
  const targetPointCount =
    Math.min(
      TEXT_PARTICLE_COUNT,
      glyphPoints.length,
    )

  const textPoints = []

  const step =
    glyphPoints.length /
    targetPointCount

  for (
    let i = 0;
    i < targetPointCount;
    i += 1
  ) {
    const sourceIndex =
      Math.floor(
        i * step,
      )

    textPoints.push(
      glyphPoints[
        sourceIndex
      ],
    )
  }

  /*
   * One texel = one simulation particle.
   *
   * Only the deterministic text population receives
   * an actual target.
   *
   * Most importantly:
   *
   * ONE particle -> ONE glyph point
   *
   * There is NO modulo reuse of glyph coordinates.
   */
  const data =
    new Float32Array(
      TEXTURE_SIZE *
      TEXTURE_SIZE *
      4,
    )

  let textPointIndex = 0

  for (
    let particleIndex = 0;
    particleIndex <
    PARTICLE_COUNT;
    particleIndex += 1
  ) {
    const textureIndex =
      particleIndex * 4

    const population =
      getParticlePopulation(
        particleIndex,
      )

    if (
      population >=
      TEXT_PARTICLE_POPULATION
    ) {
      continue
    }

    /*
     * If the deterministic population produces slightly
     * more particles than the glyph has target points,
     * those extra particles simply remain free.
     */
    if (
      textPointIndex >=
      textPoints.length
    ) {
      continue
    }

    const point =
      textPoints[
        textPointIndex
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

    textPointIndex += 1
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