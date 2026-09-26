import { Box } from '@mui/material'
import React from 'react'
import NebulaText from '../components/whatibuildComps/nebulaText'
import BuildTiles from '../components/whatibuildComps/BuildTiles'

const WhatIBuild = () => {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        overflow: 'hidden',
      }}
    >
      <NebulaText />

      <BuildTiles />
    </Box>
  )
}

export default WhatIBuild