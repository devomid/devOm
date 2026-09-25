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

  context.fillStyle =
    '#ffffff'

  context.textAlign =
    'center'

  context.textBaseline =
    'middle'

  context.font =
    '900 68px Arial Black, Arial, sans-serif'

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

      if (alpha < 0.02) {
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
        0.065

      worldX +=
        jitter

      worldY +=
        Math.sin(
          textureX *
          0.071 +
          textureY *
          0.037,
        ) *
        0.028

      const worldZ =
        (
          random -
          0.5
        ) *
        0.55

      data[
        textureIndex
      ] = worldX

      data[
        textureIndex + 1
      ] = worldY

      data[
        textureIndex + 2
      ] = worldZ

      data[
        textureIndex + 3
      ] =
        Math.pow(
          alpha,
          0.72,
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
        textStrength={
          0.0032
        }
      />
    </main>
  )
}

export default WhatIBuild