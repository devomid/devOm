import { Box } from '@mui/material'
import HeroSection from '../components/homeComps/HeroSection'
import WhatIBuild from './WhatIBuild'

const Home = () => {
    return (
        <Box
            sx={{
                position: 'relative',
                height: '200vh',
            }}
        >
            <Box
                sx={{
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                    overflow: 'hidden',
                }}
            >
                <HeroSection />
                <WhatIBuild />
            </Box>
        </Box>
    )
}

export default Home