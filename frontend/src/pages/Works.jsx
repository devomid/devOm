import React, {
  useEffect,
  useRef,
  useState,
} from 'react'

import { Box } from '@mui/material'

import WorkNebulaText from '../components/worksComps/WorkNebulaText'
import WorkTilesContainer from '../components/worksComps/WorkTilesContainer'
import works from '../db/works'

const clamp = (
  value,
  min = 0,
  max = 1,
) =>
  Math.min(
    max,
    Math.max(
      min,
      value,
    ),
  )

/*
 * ============================================================
 * CLOUD SCROLL ASSIST
 * ============================================================
 *
 * The user normally controls the page.
 *
 * Nothing happens while they are actively scrolling.
 *
 * If they stop while the cloud is forming, we gently
 * continue the existing scroll motion until the cloud has
 * completed its formation and the next card takes over.
 *
 * IMPORTANT:
 *
 * This is NOT scroll snapping.
 *
 * It is a short continuation of the user's existing
 * scroll gesture.
 * ============================================================
 */

const CLOUD_FORM_START =
  0.20

const CLOUD_ASSIST_START =
  0.23

const CLOUD_ASSIST_END =
  0.34

const CLOUD_HANDOFF =
  0.56

/*
 * How long the user has to be still before we decide
 * they intentionally stopped.
 */
const SCROLL_IDLE_TIME =
  220

/*
 * Approximate automatic scroll velocity.
 *
 * Higher = faster continuation.
 */
const AUTO_SCROLL_SPEED =
  650

/*
 * Don't immediately trigger the same cycle again.
 */
const AUTO_SCROLL_COOLDOWN =
  700

const Works = () => {
  const worksRef =
    useRef(null)

  const [
    progress,
    setProgress,
  ] = useState(0)

  const [
    cardRect,
    setCardRect,
  ] = useState(null)

  /*
   * ----------------------------------------------------------
   * SCROLL TRACKING
   * ----------------------------------------------------------
   */

  const lastScrollYRef =
    useRef(
      typeof window !== 'undefined'
        ? window.scrollY
        : 0,
    )

  const lastScrollTimeRef =
    useRef(
      typeof performance !== 'undefined'
        ? performance.now()
        : 0,
    )

  const scrollDirectionRef =
    useRef(0)

  const scrollIdleTimerRef =
    useRef(null)

  /*
   * ----------------------------------------------------------
   * AUTOMATIC MOTION
   * ----------------------------------------------------------
   */

  const autoScrollFrameRef =
    useRef(null)

  const autoScrollActiveRef =
    useRef(false)

  const lastAutoScrollCycleRef =
    useRef(null)

  const lastAutoScrollDirectionRef =
    useRef(null)

  const lastAutoScrollTimeRef =
    useRef(0)

  /*
   * ----------------------------------------------------------
   * PROGRESS
   * ----------------------------------------------------------
   */

  const calculateProgress = () => {
    const element =
      worksRef.current

    if (!element) {
      return 0
    }

    const rect =
      element.getBoundingClientRect()

    const total =
      element.offsetHeight -
      window.innerHeight

    if (
      total <= 0
    ) {
      return 0
    }

    /*
     * IMPORTANT:
     *
     * Use the actual document position rather than
     * offsetTop for the automatic scroll target.
     */
    const travelled =
      -rect.top

    return clamp(
      travelled /
      total,
    )
  }

  /*
   * ----------------------------------------------------------
   * WORK CYCLE
   * ----------------------------------------------------------
   */

  const getCycleState = () => {
    const element =
      worksRef.current

    if (!element) {
      return null
    }

    const rect =
      element.getBoundingClientRect()

    const total =
      element.offsetHeight -
      window.innerHeight

    if (
      total <= 0
    ) {
      return null
    }

    const currentProgress =
      clamp(
        -rect.top /
        total,
      )

    const cardCount =
      works.length

    const cycleLength =
      1 /
      cardCount

    const cycle =
      Math.min(
        cardCount - 1,
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

    return {
      currentProgress,
      localProgress,
      cycle,
      cycleStart,
      cycleLength,
      total,
    }
  }

  /*
   * ----------------------------------------------------------
   * CANCEL AUTOMATIC MOTION
   * ----------------------------------------------------------
   */

  const cancelAutoScroll = () => {
    if (
      autoScrollFrameRef.current !==
      null
    ) {
      window.cancelAnimationFrame(
        autoScrollFrameRef.current,
      )

      autoScrollFrameRef.current =
        null
    }

    autoScrollActiveRef.current =
      false
  }

  /*
   * ----------------------------------------------------------
   * AUTOMATIC CONTINUATION
   * ----------------------------------------------------------
   */

  const continueScroll = ({
    targetProgress,
    cycle,
    direction,
  }) => {
    const element =
      worksRef.current

    if (!element) {
      return
    }

    const state =
      getCycleState()

    if (!state) {
      return
    }

    const now =
      performance.now()

    /*
     * Prevent repeated activation of the same
     * transition.
     */
    if (
      lastAutoScrollCycleRef.current ===
      cycle &&
      lastAutoScrollDirectionRef.current ===
      direction &&
      (
        now -
        lastAutoScrollTimeRef.current
      ) <
      AUTO_SCROLL_COOLDOWN
    ) {
      return
    }

    lastAutoScrollCycleRef.current =
      cycle

    lastAutoScrollDirectionRef.current =
      direction

    lastAutoScrollTimeRef.current =
      now

    /*
     * Current absolute document position of Works.
     */
    const rect =
      element.getBoundingClientRect()

    const worksDocumentTop =
      rect.top +
      window.scrollY

    /*
     * Convert normalized Works progress
     * into an absolute document Y position.
     */
    const targetY =
      worksDocumentTop +
      targetProgress *
      state.total

    const startY =
      window.scrollY

    const distance =
      targetY -
      startY

    if (
      Math.abs(distance) <
      3
    ) {
      return
    }

    /*
     * We are now controlling the scroll.
     */
    autoScrollActiveRef.current =
      true

    const duration =
      Math.max(
        300,
        Math.min(
          1100,
          (
            Math.abs(distance) /
            AUTO_SCROLL_SPEED
          ) *
          1000,
        ),
      )

    const startTime =
      performance.now()

    const ease =
      (value) => {
        /*
         * Smooth but restrained.
         *
         * It should feel like momentum continuing,
         * not like a snap.
         */
        return (
          value < 0.5
            ? 2 *
            value *
            value
            : 1 -
            (
              Math.pow(
                -2 *
                value +
                2,
                2,
              ) /
              2
            )
        )
      }

    const frame = (
      timestamp,
    ) => {
      if (
        !autoScrollActiveRef.current
      ) {
        autoScrollFrameRef.current =
          null

        return
      }

      const elapsed =
        timestamp -
        startTime

      const raw =
        clamp(
          elapsed /
          duration,
        )

      const eased =
        ease(raw)

      const nextY =
        startY +
        (
          distance *
          eased
        )

      window.scrollTo(
        0,
        nextY,
      )

      if (
        raw >= 1
      ) {
        window.scrollTo(
          0,
          targetY,
        )

        autoScrollActiveRef.current =
          false

        autoScrollFrameRef.current =
          null

        return
      }

      autoScrollFrameRef.current =
        window.requestAnimationFrame(
          frame,
        )
    }

    autoScrollFrameRef.current =
      window.requestAnimationFrame(
        frame,
      )
  }

  /*
   * ----------------------------------------------------------
   * CHECK FOR A STOP INSIDE CLOUD FORMATION
   * ----------------------------------------------------------
   */

  const checkStoppedPosition = () => {
    /*
     * If automatic movement is already running,
     * don't start another one.
     */
    if (
      autoScrollActiveRef.current
    ) {
      return
    }

    const state =
      getCycleState()

    if (!state) {
      return
    }

    const {
      localProgress,
      cycle,
      cycleStart,
      cycleLength,
    } = state

    const direction =
      scrollDirectionRef.current

    /*
     * We need a known direction.
     */
    if (
      direction === 0
    ) {
      return
    }

    /*
     * ========================================================
     * FORWARD
     * ========================================================
     *
     * The important area is:
     *
     *       0.20
     *        ↓
     *     cloud begins
     *        ↓
     *       0.56
     *        ↓
     *     card handoff
     *
     * If the user stops anywhere in this region,
     * finish the cloud.
     */

    if (
      direction > 0 &&
      localProgress >= CLOUD_ASSIST_START &&
      localProgress <= CLOUD_ASSIST_END
    ) {
      const targetProgress =
        cycleStart +
        (
          cycleLength *
          CLOUD_HANDOFF
        )

      continueScroll({
        targetProgress,
        cycle,
        direction: 'forward',
      })

      return
    }

    /*
     * ========================================================
     * BACKWARD
     * ========================================================
     *
     * When travelling upward, if the user stops inside
     * the cloud transition, return gently to the clean
     * text state.
     */

    if (
      direction < 0 &&
      localProgress >
      CLOUD_FORM_START &&
      localProgress <=
      (
        CLOUD_HANDOFF -
        CLOUD_GUARD
      )
    ) {
      const targetProgress =
        cycleStart +
        (
          cycleLength *
          (
            CLOUD_FORM_START -
            0.02
          )
        )

      continueScroll({
        targetProgress,
        cycle,
        direction: 'backward',
      })
    }
  }

  /*
   * ----------------------------------------------------------
   * MAIN SCROLL LISTENER
   * ----------------------------------------------------------
   */

  useEffect(() => {
    const handleScroll = () => {
      const now =
        performance.now()

      const currentY =
        window.scrollY

      const previousY =
        lastScrollYRef.current

      const previousTime =
        lastScrollTimeRef.current

      const deltaY =
        currentY -
        previousY

      const deltaTime =
        Math.max(
          1,
          now -
          previousTime,
        )

      /*
       * Ignore microscopic browser movement.
       */
      if (
        Math.abs(deltaY) >
        0.2
      ) {
        scrollDirectionRef.current =
          deltaY > 0
            ? 1
            : -1
      }

      lastScrollYRef.current =
        currentY

      lastScrollTimeRef.current =
        now

      /*
       * Always update the visual progress.
       */
      const nextProgress =
        calculateProgress()

      setProgress(
        nextProgress,
      )

      /*
       * Reset the "user stopped" timer.
       */
      if (
        scrollIdleTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          scrollIdleTimerRef.current,
        )
      }

      /*
       * Only check after the user has actually
       * stopped generating scroll events.
       */
      scrollIdleTimerRef.current =
        window.setTimeout(
          checkStoppedPosition,
          SCROLL_IDLE_TIME,
        )
    }

    setProgress(
      calculateProgress(),
    )

    window.addEventListener(
      'scroll',
      handleScroll,
      {
        passive: true,
      },
    )

    const handleResize = () => {
      setProgress(
        calculateProgress(),
      )
    }

    window.addEventListener(
      'resize',
      handleResize,
    )

    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll,
      )

      if (
        scrollIdleTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          scrollIdleTimerRef.current,
        )
      }
    }
  }, [])

  /*
   * ----------------------------------------------------------
   * USER INPUT INTERRUPTS AUTO MOTION
   * ----------------------------------------------------------
   *
   * This is critical.
   *
   * The user always wins.
   * ----------------------------------------------------------
   */

  useEffect(() => {
    const interrupt = () => {
      if (
        autoScrollActiveRef.current
      ) {
        cancelAutoScroll()
      }
    }

    const handleWheel = () => {
      interrupt()
    }

    const handleTouchStart = () => {
      interrupt()
    }

    const handlePointerDown = () => {
      interrupt()
    }

    const handleKeyDown = (
      event,
    ) => {
      const keys = [
        'ArrowDown',
        'ArrowUp',
        'PageDown',
        'PageUp',
        'Home',
        'End',
        ' ',
      ]

      if (
        keys.includes(
          event.key,
        )
      ) {
        interrupt()
      }
    }

    window.addEventListener(
      'wheel',
      handleWheel,
      {
        passive: true,
      },
    )

    window.addEventListener(
      'touchstart',
      handleTouchStart,
      {
        passive: true,
      },
    )

    window.addEventListener(
      'pointerdown',
      handlePointerDown,
      {
        passive: true,
      },
    )

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        'wheel',
        handleWheel,
      )

      window.removeEventListener(
        'touchstart',
        handleTouchStart,
      )

      window.removeEventListener(
        'pointerdown',
        handlePointerDown,
      )

      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [])

  /*
   * ----------------------------------------------------------
   * CLEANUP
   * ----------------------------------------------------------
   */

  useEffect(() => {
    return () => {
      cancelAutoScroll()

      if (
        scrollIdleTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          scrollIdleTimerRef.current,
        )
      }
    }
  }, [])

  return (
    <Box
      ref={
        worksRef
      }
      sx={{
        position: 'relative',

        minHeight: '600vh',

        background: '#050403',

        isolation: 'isolate',
      }}
    >
      <WorkNebulaText
        progress={
          progress
        }
        cardRect={
          cardRect
        }
      />

      <WorkTilesContainer
        progress={
          progress
        }
        onCardLayout={
          setCardRect
        }
      />
    </Box>
  )
}

export default Works