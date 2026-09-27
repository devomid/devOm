import React from 'react'
import { Box } from '@mui/material'

import WorkNebulaText from '../components/worksComps/WorkNebulaText'
import WorkTilesContainer from '../components/worksComps/WorkTilesContainer'

const Works = () => {
  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '600vh',
        background: '#050403',

        isolation: 'isolate',
      }}
    >
      <WorkNebulaText />

      <WorkTilesContainer />
    </Box>
  )
}

export default Works