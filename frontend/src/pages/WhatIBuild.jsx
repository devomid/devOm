import {
  useEffect,
  useState,
} from 'react'

import * as THREE from 'three'

import NebulaBackground from '../components/nebula/nebula'

const TEXTURE_SIZE = 512

const TEXT_PARTICLE_COUNT = 12000

const PARTICLE_COUNT = 262144

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
    600

  let fontSize =
    118

  context.textAlign =
    'center'

  context.textBaseline =
    'middle'

  /*
   * Find the largest font that fits
   * comfortably inside the target texture.
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
   * Collect the actual glyph pixels.
   */
  const glyphPoints = []

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
   * We deliberately keep the number of target points
   * lower than the old 24,000.
   *
   * This makes the formed typography look like particles,
   * rather than a solid duplicated raster image.
   */
  const targetPointCount =
    Math.min(
      TEXT_PARTICLE_COUNT,
      glyphPoints.length,
    )

  const textPoints = []

  /*
   * Evenly sample the complete glyph.
   *
   * Every selected particle gets one unique target.
   */
  const step =
    glyphPoints.length /
    targetPointCount

  for (
    let i = 0;
    i < targetPointCount;
    i += 1
  ) {
    const sourceIndex =
      Math.min(
        glyphPoints.length - 1,
        Math.floor(
          (
            i +
            0.5
          ) *
          step,
        ),
      )

    textPoints.push(
      glyphPoints[
      sourceIndex
      ],
    )
  }

  /*
   * One simulation texel corresponds to one particle.
   *
   * Only particles 0 ... TEXT_PARTICLE_COUNT - 1
   * are text particles.
   */
  const data =
    new Float32Array(
      TEXTURE_SIZE *
      TEXTURE_SIZE *
      4,
    )

  for (
    let i = 0;
    i < targetPointCount;
    i += 1
  ) {
    const textureIndex =
      i * 4

    const point =
      textPoints[i]

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
      1.0
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