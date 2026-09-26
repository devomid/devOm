import React from 'react'
import { Box } from '@mui/material'

const SecondTile = ({ x, y, size }) => {
    return (
        <Box
            sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '28px',
                background: '#F4B400',
                pointerEvents: 'auto',
                transform: `translate(${x}px, ${y}px)`,
            }}
        >
            First
        </Box>
    )
}

export default SecondTile