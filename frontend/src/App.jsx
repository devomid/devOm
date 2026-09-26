import { Box } from '@mui/material'
import { Routes, Route, useLocation, } from 'react-router-dom'
import { useEffect, useRef, } from 'react'
import { motionValue } from 'framer-motion'

import { colors } from './design'
import NavBar from './components/navBar/navBar'
import Home from './pages/Home'
import WhatIBuild from './pages/WhatIBuild'
import Works from './pages/Works'
import HowIBuild from './pages/HowIBuild'
import Contacts from './pages/Contacts'
import FourOFour from './pages/404'
import useScrollState from './hooks/useScrollState'

function App() {
  const homeRef = useRef(null)

  const homeScrollProgress = useRef(
    motionValue(0),
  )

  const homeScrollState =
    useScrollState(
      homeScrollProgress.current,
    )

  const location = useLocation()

  const isHome =
    location.pathname === '/'

  useEffect(() => {
    if (!isHome) return

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    })

    homeScrollProgress.current.set(0)

    const state =
      homeScrollState.current

    state.progress = 0
    state.previousProgress = 0
    state.velocity = 0
    state.direction = 0
    state.isScrolling = false
  }, [
    isHome,
    homeScrollState,
  ])

  return (
    <Box
      sx={{
        minHeight: '100svh',
      }}
    >
      <NavBar scrollProgress={homeScrollProgress.current} />

      <Routes>
        <Route path="/" element={<Home homeRef={homeRef} scrollProgress={homeScrollProgress.current} scrollState={homeScrollState} />} />
        <Route path="/whatibuild" element={<WhatIBuild />} />
        <Route path="/works" element={<Works />} />
        <Route path="/howibuild" element={<HowIBuild />} />
        <Route path="/contacts" element={<Contacts />} />
        {/* <Route path="/works" element={<Wo />} /> */}
        <Route path="*" element={<FourOFour />} />
      </Routes>
    </Box>
  )
}

export default App