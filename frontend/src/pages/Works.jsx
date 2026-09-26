import { Box } from '@mui/material'
import React from 'react'
import NebulaText from '../components/worksComps/WorkNebulaText'

const Works = () => {
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
      </Box>
    </Box>
  )
}

export default Works