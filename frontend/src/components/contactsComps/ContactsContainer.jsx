import {
    useCallback,
    useEffect,
    useRef,
} from 'react'

import ContactsNebulaText from './ContactsNebulaText'

const ContactsContainer = () => {
    const containerRef =
        useRef(null)

    const interactionRef =
        useRef({
            x: 0,
            y: 0,
            active: false,
            strength: 0,
        })

    const updateInteraction = useCallback(
        (
            clientX,
            clientY,
            active = true,
        ) => {
            const container =
                containerRef.current

            if (!container) {
                return
            }

            const rect =
                container.getBoundingClientRect()

            interactionRef.current.x =
                clientX -
                rect.left

            interactionRef.current.y =
                clientY -
                rect.top

            interactionRef.current.active =
                active

            interactionRef.current.strength =
                active
                    ? 1
                    : 0
        },
        [],
    )

    const handlePointerDown = useCallback(
        (event) => {
            updateInteraction(
                event.clientX,
                event.clientY,
                true,
            )
        },
        [
            updateInteraction,
        ],
    )

    const handlePointerMove = useCallback(
        (event) => {
            if (
                event.pointerType ===
                'mouse' &&
                event.buttons === 0
            ) {
                return
            }

            updateInteraction(
                event.clientX,
                event.clientY,
                true,
            )
        },
        [
            updateInteraction,
        ],
    )

    const handlePointerUp = useCallback(
        () => {
            interactionRef.current.active =
                false
        },
        [],
    )

    const handlePointerCancel =
        useCallback(
            () => {
                interactionRef.current.active =
                    false
            },
            [],
        )

    useEffect(() => {
        const preventScroll =
            (event) => {
                event.preventDefault()
            }

        const container =
            containerRef.current

        if (!container) {
            return undefined
        }

        container.addEventListener(
            'wheel',
            preventScroll,
            {
                passive: false,
            },
        )

        container.addEventListener(
            'touchmove',
            preventScroll,
            {
                passive: false,
            },
        )

        return () => {
            container.removeEventListener(
                'wheel',
                preventScroll,
            )

            container.removeEventListener(
                'touchmove',
                preventScroll,
            )
        }
    }, [])

    return (
        <main
            ref={
                containerRef
            }
            onPointerDown={
                handlePointerDown
            }
            onPointerMove={
                handlePointerMove
            }
            onPointerUp={
                handlePointerUp
            }
            onPointerCancel={
                handlePointerCancel
            }
            style={{
                position:
                    'relative',

                width:
                    '100%',

                height:
                    '100dvh',

                minHeight:
                    '100dvh',

                overflow:
                    'hidden',

                overscrollBehavior:
                    'none',

                touchAction:
                    'none',

                background:
                    '#050403',

                isolation:
                    'isolate',
            }}
        >
            <ContactsNebulaText
                interactionRef={
                    interactionRef
                }
            />
        </main>
    )
}

export default ContactsContainer