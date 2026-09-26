import React, {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  Box,
} from '@mui/material'

import WorkNebulaText from '../components/worksComps/WorkNebulaText'
import WorkTile from '../components/worksComps/cards/workTile'
import works from '../db/works'

const clamp = (
  value,
  min = 0,
  max = 1,
) =>
  Math.max(
    min,
    Math.min(
      max,
      value,
    ),
  )

const Works = () => {
  const sectionRef =
    useRef(null)

  const [
    scrollProgress,
    setScrollProgress,
  ] = useState(0)

  useEffect(() => {
    let animationFrame =
      null

    const updateProgress =
      () => {
        animationFrame =
          null

        const section =
          sectionRef.current

        if (!section) {
          return
        }

        const rect =
          section.getBoundingClientRect()

        const sectionTop =
          rect.top +
          window.scrollY

        const sectionHeight =
          section.offsetHeight

        const viewportHeight =
          window.innerHeight

        const scrollableDistance =
          Math.max(
            1,
            sectionHeight -
            viewportHeight,
          )

        const localScroll =
          window.scrollY -
          sectionTop

        const progress =
          clamp(
            localScroll /
            scrollableDistance,
          )

        setScrollProgress(
          progress,
        )
      }

    const handleScroll =
      () => {
        if (
          animationFrame !==
          null
        ) {
          return
        }

        animationFrame =
          window.requestAnimationFrame(
            updateProgress,
          )
      }

    const handleResize =
      () => {
        updateProgress()
      }

    window.addEventListener(
      'scroll',
      handleScroll,
      {
        passive: true,
      },
    )

    window.addEventListener(
      'resize',
      handleResize,
    )

    updateProgress()

    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll,
      )

      window.removeEventListener(
        'resize',
        handleResize,
      )

      if (
        animationFrame !==
        null
      ) {
        window.cancelAnimationFrame(
          animationFrame,
        )
      }
    }
  }, [])

  return (
    <Box
      ref={sectionRef}
      sx={{
        position:
          'relative',

        minHeight:
          '300vh',

        background:
          '#050403',
      }}
    >
      <Box
        sx={{
          position:
            'sticky',

          top: 0,

          width:
            '100%',

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

            flexDirection:
              'column',

            alignItems:
              'center',

            justifyContent:
              'center',

            gap: {
              xs: 1.25,
              sm: 1.5,
              md: 2,
            },

            px: 2,

            pointerEvents:
              'none',
          }}
        >
          {
            works.map(
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

                  progress={
                    scrollProgress
                  }
                />
              ),
            )
          }
        </Box>
      </Box>
    </Box>
  )
}

export default Works