import {
    useEffect,
    useRef,
    useState,
} from 'react'

import {
    Box,
} from '@mui/material'

import HomeNebulaText
    from './HomeNebulaText'

import HomeHero
    from './HomeHero'

import {
    HOME_CONTENT,
    HOME_TIMING,
} from '../../db/home'


const INTRO_STAGE = {
    IDEA:
        'idea',

    IDENTITY:
        'identity',

    CAPABILITIES:
        'capabilities',

    COMPLETE:
        'complete',
}


const HomeIntro = ({
    onComplete,
}) => {
    const [
        stage,
        setStage,
    ] = useState(
        INTRO_STAGE.IDEA,
    )

    const [
        ideaDisturbance,
        setIdeaDisturbance,
    ] = useState(false)

    const [
        identityReveal,
        setIdentityReveal,
    ] = useState(false)

    const [
        identityDisturbance,
        setIdentityDisturbance,
    ] = useState(false)

    const [
        identityVisible,
        setIdentityVisible,
    ] = useState(false)

    const [
        identityPositioned,
        setIdentityPositioned,
    ] = useState(false)

    const [
        capabilitiesReveal,
        setCapabilitiesReveal,
    ] = useState(false)

    const [
        capabilitiesDisturbance,
        setCapabilitiesDisturbance,
    ] = useState(false)

    const [
        capabilitiesVisible,
        setCapabilitiesVisible,
    ] = useState(false)

    const timersRef =
        useRef([])

    const completedRef =
        useRef(false)


    const schedule = (
        callback,
        delay,
    ) => {
        const timer =
            window.setTimeout(
                callback,
                delay,
            )

        timersRef.current.push(
            timer,
        )

        return timer
    }


    useEffect(
        () => {
            let cancelled =
                false

            const run =
                async () => {
                    /*
                     * ----------------------------------------
                     * 1. IDEA
                     * ----------------------------------------
                     */

                    setStage(
                        INTRO_STAGE.IDEA,
                    )

                    await new Promise(
                        resolve =>
                            schedule(
                                resolve,
                                HOME_TIMING
                                    .idea
                                    .form,
                            ),
                    )

                    if (
                        cancelled
                    ) {
                        return
                    }

                    await new Promise(
                        resolve =>
                            schedule(
                                resolve,
                                HOME_TIMING
                                    .idea
                                    .hold,
                            ),
                    )

                    if (
                        cancelled
                    ) {
                        return
                    }

                    /*
                     * Wind blows the idea away.
                     */

                    setIdeaDisturbance(
                        true,
                    )

                    await new Promise(
                        resolve =>
                            schedule(
                                resolve,
                                HOME_TIMING
                                    .idea
                                    .disturbance,
                            ),
                    )

                    if (
                        cancelled
                    ) {
                        return
                    }

                    setIdeaDisturbance(
                        false,
                    )

                    /*
                     * ----------------------------------------
                     * 2. devOm
                     * ----------------------------------------
                     */

                    setStage(
                        INTRO_STAGE.IDENTITY,
                    )

                    setIdentityVisible(
                        true,
                    )

                    await new Promise(
                        resolve =>
                            schedule(
                                resolve,
                                HOME_TIMING
                                    .identity
                                    .form +
                                HOME_TIMING
                                    .identity
                                    .holdBeforeReveal,
                            ),
                    )

                    if (
                        cancelled
                    ) {
                        return
                    }

                    /*
                     * Real MUI Typography appears behind
                     * the NebulaText.
                     */

                    setIdentityReveal(
                        true,
                    )

                    await new Promise(
                        resolve =>
                            schedule(
                                resolve,
                                HOME_TIMING
                                    .identity
                                    .reveal,
                            ),
                    )

                    if (
                        cancelled
                    ) {
                        return
                    }

                    /*
                     * Now the NebulaText is blown away,
                     * exposing the real typography.
                     */

                    setIdentityDisturbance(
                        true,
                    )

                    await new Promise(
                        resolve =>
                            schedule(
                                resolve,
                                HOME_TIMING
                                    .identity
                                    .disturbance,
                            ),
                    )

                    if (
                        cancelled
                    ) {
                        return
                    }

                    setIdentityDisturbance(
                        false,
                    )

                    await new Promise(
                        resolve =>
                            schedule(
                                resolve,
                                HOME_TIMING
                                    .identity
                                    .settle,
                            ),
                    )

                    if (
                        cancelled
                    ) {
                        return
                    }

                    /*
                     * The real devOm moves to the final
                     * hero position.
                     */

                    setIdentityPositioned(
                        true,
                    )

                    await new Promise(
                        resolve =>
                            schedule(
                                resolve,
                                HOME_TIMING
                                    .identity
                                    .move,
                            ),
                    )

                    if (
                        cancelled
                    ) {
                        return
                    }

                    /*
                     * ----------------------------------------
                     * 3. CAPABILITIES
                     * ----------------------------------------
                     */

                    setStage(
                        INTRO_STAGE.CAPABILITIES,
                    )

                    setCapabilitiesVisible(
                        false,
                    )

                    await new Promise(
                        resolve =>
                            schedule(
                                resolve,
                                HOME_TIMING
                                    .capabilities
                                    .form,
                            ),
                    )

                    if (
                        cancelled
                    ) {
                        return
                    }

                    await new Promise(
                        resolve =>
                            schedule(
                                resolve,
                                HOME_TIMING
                                    .capabilities
                                    .holdBeforeReveal,
                            ),
                    )

                    if (
                        cancelled
                    ) {
                        return
                    }

                    /*
                     * MUI text appears behind the
                     * NebulaText.
                     */

                    setCapabilitiesReveal(
                        true,
                    )

                    setCapabilitiesVisible(
                        true,
                    )

                    await new Promise(
                        resolve =>
                            schedule(
                                resolve,
                                HOME_TIMING
                                    .capabilities
                                    .reveal,
                            ),
                    )

                    if (
                        cancelled
                    ) {
                        return
                    }

                    /*
                     * Blow the NebulaText away.
                     */

                    setCapabilitiesDisturbance(
                        true,
                    )

                    await new Promise(
                        resolve =>
                            schedule(
                                resolve,
                                HOME_TIMING
                                    .capabilities
                                    .disturbance,
                            ),
                    )

                    if (
                        cancelled
                    ) {
                        return
                    }

                    setCapabilitiesDisturbance(
                        false,
                    )

                    await new Promise(
                        resolve =>
                            schedule(
                                resolve,
                                HOME_TIMING
                                    .capabilities
                                    .settle,
                            ),
                    )

                    if (
                        cancelled
                    ) {
                        return
                    }

                    /*
                     * ----------------------------------------
                     * COMPLETE
                     * ----------------------------------------
                     */

                    setStage(
                        INTRO_STAGE.COMPLETE,
                    )

                    if (
                        !completedRef.current
                    ) {
                        completedRef.current =
                            true

                        onComplete?.()
                    }
                }

            run()

            return () => {
                cancelled =
                    true

                timersRef.current.forEach(
                    timer =>
                        window.clearTimeout(
                            timer,
                        ),
                )

                timersRef.current =
                    []
            }
        },
        [],
    )


    const ideaActive =
        stage ===
        INTRO_STAGE.IDEA

    const identityActive =
        stage ===
        INTRO_STAGE.IDENTITY ||
        stage ===
        INTRO_STAGE.CAPABILITIES ||
        stage ===
        INTRO_STAGE.COMPLETE

    const capabilitiesActive =
        stage ===
        INTRO_STAGE.CAPABILITIES ||
        stage ===
        INTRO_STAGE.COMPLETE


    return (
        <Box
            sx={{
                position:
                    'absolute',

                inset:
                    0,

                width:
                    '100%',

                height:
                    '100%',

                overflow:
                    'hidden',

                pointerEvents:
                    'none',
            }}
        >
            {ideaActive && (
                <HomeNebulaText
                    key="home-idea"

                    text={
                        HOME_CONTENT.idea
                    }

                    nebulaEnabled={
                        !ideaDisturbance
                            ? true
                            : true
                    }

                    textStrength={
                        ideaDisturbance
                            ? 0
                            : 1
                    }

                    disturbance={
                        ideaDisturbance
                    }

                    disturbanceDirection="right"

                    typographyOpacity={0}

                    zIndex={4}
                />
            )}

            {identityActive && (
                <HomeNebulaText
                    key="home-identity"

                    text={
                        HOME_CONTENT.identity
                    }

                    typographySx={{
                        fontFamily:
                            '"Neue Montreal", "Helvetica Neue", Arial, sans-serif',

                        fontSize:
                            'clamp(4.5rem, 9vw, 9rem)',

                        fontWeight:
                            700,

                        lineHeight:
                            0.95,

                        letterSpacing:
                            '-0.055em',

                        whiteSpace:
                            'nowrap',

                        color:
                            'inherit',
                    }}

                    showTypography={
                        identityReveal
                    }

                    typographyOpacity={
                        identityReveal
                            ? 1
                            : 0
                    }

                    nebulaEnabled={
                        stage ===
                            INTRO_STAGE.IDENTITY
                            ? true
                            : false
                    }

                    textStrength={
                        identityDisturbance
                            ? 0
                            : 1
                    }

                    disturbance={
                        identityDisturbance
                    }

                    disturbanceDirection="right"

                    zIndex={4}
                />
            )}

            {capabilitiesActive && (
                <HomeNebulaText
                    key="home-capabilities"

                    lines={
                        HOME_CONTENT
                            .capabilities
                    }

                    text={
                        HOME_CONTENT
                            .capabilities
                        [0]
                    }

                    typographySx={{
                        width:
                            'min(78vw, 1100px)',

                        textAlign:
                            'left',

                        fontFamily:
                            '"Neue Montreal", "Helvetica Neue", Arial, sans-serif',

                        fontSize:
                            'clamp(2.5rem, 5.5vw, 6rem)',

                        fontWeight:
                            600,

                        lineHeight:
                            1.02,

                        letterSpacing:
                            '-0.045em',

                        whiteSpace:
                            'pre-line',

                        color:
                            'inherit',
                    }}

                    showTypography={
                        capabilitiesReveal
                    }

                    typographyOpacity={
                        capabilitiesReveal
                            ? 1
                            : 0
                    }

                    nebulaEnabled={
                        stage ===
                        INTRO_STAGE.CAPABILITIES
                    }

                    textStrength={
                        capabilitiesDisturbance
                            ? 0
                            : 1
                    }

                    disturbance={
                        capabilitiesDisturbance
                    }

                    disturbanceDirection="right"

                    zIndex={4}
                />
            )}

            <HomeHero
                identityVisible={
                    identityVisible
                }

                identityPositioned={
                    identityPositioned
                }

                capabilitiesVisible={
                    capabilitiesVisible &&
                    capabilitiesReveal
                }
            />
        </Box>
    )
}

export default HomeIntro