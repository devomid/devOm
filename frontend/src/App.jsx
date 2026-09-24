import { Box } from '@mui/material'
import { colors, } from './design'
import Home from './pages/Home'
import NavBar from './components/navBar/navBar'

function App() {
  return (
    <Box
      sx={{
        minHeight: '100svh',
        backgroundColor: colors.background.primary,
        color: colors.text.primary,
      }}
    >
      <NavBar/>
      <Home />
    </Box>
  )
}

export default App