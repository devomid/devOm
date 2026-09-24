import { Box } from '@mui/material'
import { Routes, Route } from 'react-router-dom'
import { useRef } from 'react'
import { useScroll } from 'framer-motion'

import { colors } from './design'
import NavBar from './components/navBar/navBar'
import Home from './pages/Home'
import WhatIBuild from './pages/WhatIBuild'
import Works from './pages/Works'
import HowIBuild from './pages/HowIBuild'
import Contacts from './pages/Contacts'
import FourOFour from './pages/404';

function App() {
  const homeRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: homeRef,
    offset: ['start start', 'end end'],
    layoutEffect: false,
  })

  return (
    <Box
      sx={{
        minHeight: '100svh',
        backgroundColor: colors.background.primary,
        color: colors.text.primary,
      }}
    >
      <NavBar scrollProgress={scrollYProgress} />

      <Routes>
        <Route
          path="/"
          element={<Home homeRef={homeRef} />}
        />

        <Route path="/whatibuild" element={<WhatIBuild />} />
        <Route path="/works" element={<Works />} />
        <Route path="/howibuild" element={<HowIBuild />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="*" element={<FourOFour />} />
      </Routes>
    </Box>
  )
}

export default App