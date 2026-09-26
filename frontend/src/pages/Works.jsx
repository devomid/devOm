import React, {
  useEffect,
  useState,
} from 'react'

import { Box } from '@mui/material'

import WorkNebulaText from '../components/worksComps/WorkNebulaText'
import WorkTile from '../components/worksComps/cards/workTile'

const WORKS = [
  {
    id: 'jajisha',
    title: 'Jajisha',
    description:
      'Public toilet discovery and navigation',
    path: '/works/jajisha',
  },
  {
    id: 'infotainment',
    title: 'Infotainment',
    description:
      'Automotive infotainment system',
    path: '/works/infotainment',
  },
  {
    id: 'omigram',
    title: 'omiGram',
    description:
      'Social voice, video and location platform',
    path: '/works/omigram',
  },
  {
    id: 'ssp-price-checker',
    title: 'SSP Price Checker',
    description:
      'Price checking and comparison application',
    path: '/works/ssp-price-checker',
  },
  {
    id: 'violenz',
    title: 'Violenz',
    description:
      'Driving violation capture and workflow',
    path: '/works/violenz',
  },
]

const clamp = (
  value,
  min = 0,
  max = 1,
) => {
  return Math.min(
    max,
    Math.max(min, value),
  )
}

const getScrollProgress = () => {
  const documentHeight =
    document.documentElement
      .scrollHeight

  const viewportHeight =
    window.innerHeight

  const scrollableHeight =
    Math.max(
      1,
      documentHeight -
      viewportHeight,
    )

  return clamp(
    window.scrollY /
    scrollableHeight,
  )
}

const Works = () => {
  const [
    scrollProgress,
    setScrollProgress,
  ] = useState(0)

  useEffect(() => {
    let frame = null

    const updateProgress = () => {
      if (frame !== null) {
        return
      }

      frame =
        requestAnimationFrame(
          () => {
            setScrollProgress(
              getScrollProgress(),
            )

            frame = null
          },
        )
    }

    updateProgress()

    window.addEventListener(
      'scroll',
      updateProgress,
      {
        passive: true,
      },
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

      if (
        frame !== null
      ) {
        cancelAnimationFrame(
          frame,
        )
      }
    }
  }, [])

  /*
   * ------------------------------------------------
   * CARD REVEAL
   * ------------------------------------------------
   *
   * The vortex reaches its maximum around 45%.
   *
   * The first card begins appearing immediately
   * after the vortex has formed.
   *
   * Additional cards follow with a small delay.
   */

  const getCardProgress = (
    index,
  ) => {
    const start =
      0.445 +
      index * 0.035

    const end =
      start + 0.075

    return clamp(
      (
        scrollProgress -
        start
      ) /
      (
        end -
        start
      ),
    )
  }

  return (
    <Box
      sx={{
        position:
          'relative',

        minHeight:
          '300vh',

        background:
          '#050403',

        overflow:
          'hidden',
      }}
    >
      <Box
        sx={{
          position:
            'sticky',

          top: 0,

          height:
            '100vh',

          overflow:
            'hidden',

          background:
            '#050403',
        }}
      >
        <WorkNebulaText
          scrollProgress={
            scrollProgress
          }
        />

        <Box
          sx={{
            position:
              'absolute',

            inset: 0,

            zIndex: 10,

            display:
              'flex',

            alignItems:
              'center',

            justifyContent:
              'center',

            pointerEvents:
              'none',

            px: 2,
          }}
        >
          <Box
            sx={{
              width:
                '80vw',

              maxWidth:
                '1400px',

              display:
                'flex',

              flexDirection:
                'column',

              gap:
                '14px',

              alignItems:
                'center',

              justifyContent:
                'center',
            }}
          >
            {WORKS.map(
              (
                work,
                index,
              ) => (
                <WorkTile
                  key={
                    work.id
                  }
                  work={
                    work
                  }
                  index={
                    index
                  }
                  revealProgress={getCardProgress(
                    index,
                  )}
                />
              ),
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Works