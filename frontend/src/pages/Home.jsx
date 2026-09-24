import { Box } from '@mui/material'
import { Link } from 'react-router-dom'

import HeroSection from '../components/homeComps/HeroSection'
import WhatIBuild from './WhatIBuild'
import HowIBuild from './HowIBuild'
import Works from './Works'
import Contacts from './Contacts'

const Home = ({ homeRef }) => {
    return (
        <Box
            ref={homeRef}
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
                component={Link}
                to="/whatibuild"
                sx={{
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                    overflow: 'hidden',
                    display: 'block',
                    textDecoration: 'none',
                    color: 'inherit',
                }}
            >
                <WhatIBuild />
            </Box>

            <Box
                component={Link}
                to="/works"
                sx={{
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                    overflow: 'hidden',
                    display: 'block',
                    textDecoration: 'none',
                    color: 'inherit',
                }}
            >
                <Works />
            </Box>

            <Box
                component={Link}
                to="/howibuild"
                sx={{
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                    overflow: 'hidden',
                    display: 'block',
                    textDecoration: 'none',
                    color: 'inherit',
                }}
            >
                <HowIBuild />
            </Box>

            <Box
                component={Link}
                to="/contacts"
                sx={{
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                    overflow: 'hidden',
                    display: 'block',
                    textDecoration: 'none',
                    color: 'inherit',
                }}
            >
                <Contacts />
            </Box>
        </Box>
    )
}

export default Home