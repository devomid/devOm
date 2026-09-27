import React from 'react'
import { Box, Paper, Typography, } from '@mui/material'


const WorkTile = ({ work, index, progress, }) => {
    return (
        <Box
            sx={{
                position: 'relative',
                mt: 8,
            }}
        >
            {/* Main section */}
            <Paper
                sx={{
                    minHeight: 400,
                    borderRadius: 4,
                    p: 4,
                }}
            >
                {/* section content */}
            </Paper>

            {/* Floating card */}
            <Paper
                elevation={6}
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: { xs: '85%', md: 420 },
                    p: 3,
                    borderRadius: 4,
                    zIndex: 2,
                }}
            >
                {/* card content */}
            </Paper>
        </Box>
    )
}
export default WorkTile