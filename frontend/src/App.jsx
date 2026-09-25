import { Box } from '@mui/material'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { motionValue } from 'framer-motion'

import { colors } from './design'
import NavBar from './components/navBar/navBar'
import Home from './pages/Home'
import WhatIBuild from './pages/WhatIBuild'
import Works from './pages/Works'
import HowIBuild from './pages/HowIBuild'
import Contacts from './pages/Contacts'
import FourOFour from './pages/404'

function App() {
  const homeRef = useRef(null)
  const homeScrollProgress = useRef(
    motionValue(0),
  )

  const location = useLocation()
  const isHome = location.pathname === '/'

  useEffect(() => {
    if (!isHome) return

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    })

    homeScrollProgress.current.set(0)
  }, [isHome])

  return (
    <Box
      sx={{
        minHeight: '100svh',
        backgroundColor:
          colors.background.primary,
        color: colors.text.primary,
      }}
    >
      <NavBar
        scrollProgress={
          homeScrollProgress.current
        }
      />

      <Routes>
        <Route
          path="/"
          element={
            <Home
              homeRef={homeRef}
              scrollProgress={
                homeScrollProgress.current
              }
            />
          }
        />

        <Route
          path="/whatibuild"
          element={<WhatIBuild />}
        />

        <Route
          path="/works"
          element={<Works />}
        />

        <Route
          path="/howibuild"
          element={<HowIBuild />}
        />

        <Route
          path="/contacts"
          element={<Contacts />}
        />

        <Route
          path="*"
          element={<FourOFour />}
        />
      </Routes>
    </Box>
  )
}

export default App