import React from 'react'
import { Box } from '@mui/material'
import { Canvas } from '@react-three/fiber'

const TestScene = () => {
    return (
        <mesh>
            <boxGeometry args={[2, 2, 2]} />
            <meshBasicMaterial color="#F4B400" />
        </mesh>
    )
}

const WorkNebulaText = () => {
    return (
        <Box
            sx={{
                position: 'absolute',
                inset: 0,
                zIndex: 1,
            }}
        >
            <Canvas
                camera={{
                    position: [0, 0, 5],
                }}
            >
                <TestScene />
            </Canvas>
        </Box>
    )
}

export default WorkNebulaText