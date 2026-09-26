import { Box } from '@mui/material'
import React from 'react'
import NebulaText from '../components/whatibuildComps/nebulaText'
import BuildTiles from '../components/whatibuildComps/BuildTiles'

const WhatIBuild = () => {
  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '200vh',
        background: '#050403',
      }}
    >
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          background: '#050403',
        }}
      >
        <NebulaText />
        <BuildTiles />
      </Box>
    </Box>
  )
}

export default WhatIBuild