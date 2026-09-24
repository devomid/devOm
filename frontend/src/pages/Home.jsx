import { Box } from '@mui/material'
import HeroSection from '../components/homeComps/HeroSection'
import WhatIBuild from './WhatIBuild'
import HowIBuild from './HowIBuild'
import Works from './Works'
import Contacts from './Contacts'

const Home = () => {
    return (
        <Box
            sx={{
                position: 'relative',
                height: '500vh',
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
            </Box>
            <Box
                sx={{
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                    overflow: 'hidden',
                }}
            >
                <WhatIBuild />
            </Box>
            <Box
                sx={{
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                    overflow: 'hidden',
                }}
            >
                <Works />
            </Box>
            <Box
                sx={{
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                    overflow: 'hidden',
                }}
            >
                <HowIBuild />
            </Box>
            <Box
                sx={{
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                    overflow: 'hidden',
                }}
            >
                <Contacts />
            </Box>
        </Box>
    )
}

export default Home