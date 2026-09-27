import React, {
  useEffect,
  useRef,
  useState,
} from 'react'

import { Box } from '@mui/material'

import WorkNebulaText from '../components/worksComps/WorkNebulaText'
import WorkTilesContainer from '../components/worksComps/WorkTilesContainer'

const clamp = (
  value,
  min = 0,
  max = 1,
) => Math.min(
  max,
  Math.max(
    min,
    value,
  ),
)

const Works = () => {
  const worksRef = useRef(null)

  const [progress, setProgress] = useState(0)
  const [cardRect, setCardRect] = useState(null)

  useEffect(() => {
    const updateProgress = () => {
      const element = worksRef.current

      if (!element) return

      const rect =
        element.getBoundingClientRect()

      const total =
        element.offsetHeight -
        window.innerHeight

      if (total <= 0) {
        setProgress(0)
        return
      }

      const travelled =
        -rect.top

      setProgress(
        clamp(
          travelled / total,
        ),
      )
    }

    updateProgress()

    window.addEventListener(
      'scroll',
      updateProgress,
      { passive: true },
    )

    window.addEventListener(
      'resize',
      updateProgress,
    )

    return () => {
      window.removeEventListener(
        'scroll',
        updateProgress,
      )

      window.removeEventListener(
        'resize',
        updateProgress,
      )
    }
  }, [])

  return (
    <Box
      ref={worksRef}
      sx={{
        position: 'relative',
        minHeight: '600vh',
        background: '#050403',
        isolation: 'isolate',
      }}
    >
      <WorkNebulaText
        progress={progress}
        cardRect={cardRect}
      />

      <WorkTilesContainer
        progress={progress}
        onCardLayout={setCardRect}
      />
    </Box>
  )
}

export default Works