import {
  useEffect,
  useState,
} from 'react'

import * as THREE from 'three'

import NebulaBackground from '../components/nebula/nebula'

const TEXTURE_SIZE = 512

const createCircleTargetTexture = () => {
  const data =
    new Float32Array(
      TEXTURE_SIZE *
      TEXTURE_SIZE *
      4,
    )

  const centerX =
    0.5

  const centerY =
    0.5

  const radiusX =
    6.15

  const radiusY =
    2.65

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

      const dx =
        normalizedX -
        centerX

      const dy =
        normalizedY -
        centerY

      let angle =
        Math.atan2(
          dy,
          dx,
        )

      if (
        angle < 0
      ) {
        angle +=
          Math.PI *
          2
      }

      const radialNoise =
        Math.sin(
          textureX *
          0.071 +
          textureY *
          0.113,
        ) *
        0.10

      const breathing =
        Math.sin(
          angle *
          5.0 +
          textureY *
          0.021,
        ) *
        0.075

      const radiusOffset =
        radialNoise +
        breathing

      const targetRadiusX =
        radiusX +
        radiusOffset

      const targetRadiusY =
        radiusY +
        radiusOffset *
        0.62

      const worldX =
        Math.cos(
          angle,
        ) *
        targetRadiusX

      const worldY =
        Math.sin(
          angle,
        ) *
        targetRadiusY

      const depthNoise =
        Math.sin(
          textureX *
          0.127 +
          textureY *
          0.091,
        )

      const worldZ =
        depthNoise *
        0.38

      const textureIndex =
        (
          textureY *
          TEXTURE_SIZE +
          textureX
        ) *
        4

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
       * Every particle remains eligible to participate.
       *
       * The shader now controls attachment dynamically,
       * so particles can leave and later return.
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
    circleTargetTexture,
    setCircleTargetTexture,
  ] = useState(null)

  useEffect(() => {
    const texture =
      createCircleTargetTexture()

    setCircleTargetTexture(
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
            circleTargetTexture,
          )
        }
        textTargetTexture={
          circleTargetTexture
        }
        textStrength={
          1.0
        }
      />
    </main>
  )
}

export default WhatIBuild