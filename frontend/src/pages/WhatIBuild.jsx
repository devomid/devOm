import {
  useEffect,
  useState,
} from 'react'

import * as THREE from 'three'

import NebulaBackground from '../components/nebula/nebula'

const TEXTURE_SIZE = 512

const createTextTargetTexture = () => {
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
      {
        willReadFrequently:
          true,
      },
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
   * Make the text substantially thicker than the previous
   * version so a large, unmistakable population of the
   * existing 262,144 particles participates.
   */
  context.fillStyle =
    '#ffffff'

  context.textAlign =
    'center'

  context.textBaseline =
    'middle'

  context.font =
    '900 76px Arial Black, Arial, sans-serif'

  context.fillText(
    'WHAT I BUILD',
    TEXTURE_SIZE / 2,
    TEXTURE_SIZE / 2,
  )

  const image =
    context.getImageData(
      0,
      0,
      TEXTURE_SIZE,
      TEXTURE_SIZE,
    )

  const data =
    new Float32Array(
      TEXTURE_SIZE *
      TEXTURE_SIZE *
      4,
    )

  for (
    let textureY = 0;
    textureY < TEXTURE_SIZE;
    textureY += 1
  ) {
    const canvasY =
      TEXTURE_SIZE -
      1 -
      textureY

    for (
      let textureX = 0;
      textureX < TEXTURE_SIZE;
      textureX += 1
    ) {
      const canvasIndex =
        (
          canvasY *
          TEXTURE_SIZE +
          textureX
        ) *
        4

      const textureIndex =
        (
          textureY *
          TEXTURE_SIZE +
          textureX
        ) *
        4

      const alpha =
        image.data[
        canvasIndex + 3
        ] / 255

      if (
        alpha <
        0.015
      ) {
        data[
          textureIndex + 3
        ] = 0.0

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

      /*
       * Match the actual Nebula world dimensions.
       */
      let worldX =
        (
          normalizedX -
          0.5
        ) *
        16.8

      let worldY =
        (
          normalizedY -
          0.5
        ) *
        7.4

      /*
       * Organic displacement.
       *
       * This keeps the text from becoming a perfectly
       * rigid bitmap while the Nebula's normal flow
       * continues to move the particles.
       */
      const noise =
        Math.sin(
          textureX *
          12.9898 +
          textureY *
          78.233,
        ) *
        43758.5453

      const random =
        noise -
        Math.floor(
          noise,
        )

      const jitter =
        (
          random -
          0.5
        ) *
        0.10

      worldX +=
        jitter

      worldY +=
        Math.sin(
          textureX *
          0.071 +
          textureY *
          0.037,
        ) *
        0.045

      const worldZ =
        (
          random -
          0.5
        ) *
        0.72

      data[
        textureIndex
      ] =
        worldX

      data[
        textureIndex + 1
      ] =
        worldY

      data[
        textureIndex + 2
      ] =
        worldZ

      /*
       * Preserve anti-aliased edges, but give the
       * interior enough weight to hold the letters.
       */
      data[
        textureIndex + 3
      ] =
        Math.pow(
          alpha,
          0.62,
        )
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
      createTextTargetTexture()

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
        /*
         * This is now a convergence multiplier,
         * not the raw GPU force.
         */
        textStrength={
          1.0
        }
      />
    </main>
  )
}

export default WhatIBuild