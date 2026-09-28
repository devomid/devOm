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
  const snappingRef = useRef(false)
  const snapTimerRef = useRef(null)

  const [progress, setProgress] = useState(0)
  const [cardRect, setCardRect] = useState(null)

  useEffect(() => {
    const workCount = 5

    const getProgress = () => {
      const element = worksRef.current

      if (!element) return 0

      const rect =
        element.getBoundingClientRect()

      const total =
        element.offsetHeight -
        window.innerHeight

      if (total <= 0) return 0

      return clamp(
        -rect.top / total,
      )
    }

    const getScrollPositionForProgress = (
      targetProgress,
    ) => {
      const element =
        worksRef.current

      if (!element) return null

      const total =
        element.offsetHeight -
        window.innerHeight

      const documentTop =
        window.scrollY +
        element.getBoundingClientRect().top

      return (
        documentTop +
        targetProgress *
        total
      )
    }

    const updateProgress = () => {
      setProgress(
        getProgress(),
      )
    }

    let lastScrollY =
      window.scrollY

    let scrollDirection = 1

    let scrollStopTimer = null

    const handleScroll = () => {
      const currentScrollY =
        window.scrollY

      if (
        currentScrollY >
        lastScrollY
      ) {
        scrollDirection = 1
      }

      if (
        currentScrollY <
        lastScrollY
      ) {
        scrollDirection = -1
      }

      lastScrollY =
        currentScrollY

      updateProgress()

      clearTimeout(
        scrollStopTimer,
      )

      scrollStopTimer =
        setTimeout(() => {
          const currentProgress =
            getProgress()

          const cycleLength =
            1 /
            workCount

          const cycle =
            Math.min(
              workCount - 1,
              Math.floor(
                currentProgress /
                cycleLength,
              ),
            )

          const cycleStart =
            cycle *
            cycleLength

          const localProgress =
            clamp(
              (
                currentProgress -
                cycleStart
              ) /
              cycleLength,
            )

          /*
           * Only snap while moving
           * toward the FRONT of the card.
           *
           * Once we reach 0.5:
           *
           *   CARD CHANGES
           *   particles start
           *   moving BACK
           *
           * From there on, scrolling
           * is completely normal.
           */

          const frontMotionActive =
            scrollDirection > 0 &&
            localProgress > 0 &&
            localProgress < 0.5

          if (
            !frontMotionActive ||
            cycle >= workCount - 1
          ) {
            return
          }

          const targetProgress =
            cycleStart +
            cycleLength * 0.5

          const targetScroll =
            getScrollPositionForProgress(
              targetProgress,
            )

          if (
            targetScroll === null
          ) {
            return
          }

          window.scrollTo({
            top: targetScroll,
            behavior: 'smooth',
          })
        }, 120)
    }

    updateProgress()

    window.addEventListener(
      'scroll',
      handleScroll,
      { passive: true },
    )

    window.addEventListener(
      'resize',
      updateProgress,
    )

    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll,
      )

      window.removeEventListener(
        'resize',
        updateProgress,
      )

      clearTimeout(
        scrollStopTimer,
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