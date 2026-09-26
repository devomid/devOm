import React from 'react'
import { Box } from '@mui/material'

const BuildTile = ({ x, y }) => {
    return (
        <Box
            sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '180px',
                height: '180px',
                borderRadius: '28px',
                background: '#F4B400',
                pointerEvents: 'auto',
                transform: `translate(${x}px, ${y}px)`,
            }}
        />
    )
}

export default BuildTile