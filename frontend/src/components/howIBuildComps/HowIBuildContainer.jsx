
import {
    useEffect,
    useRef,
    useState,
} from 'react'

import HowIBuildNebulaText from './HowIBuildNebulaText'


/*
 * ============================================================
 * HOW I BUILD — CONTAINER
 * ============================================================
 *
 * Layout:
 *
 *                 HOW I BUILD
 *
 *
 *          ○       ○       ○       ○       ○       ○
 *         IDEA   ARCH...   BUILD   INTEGRATE HARDEN  SHIP
 *
 *
 * The Three.js nebula is positioned behind this container.
 *
 * The labels are DOM elements so they remain crisp and
 * independently controllable.
 */


/* ============================================================
 * DATA
 * ========================================================== */

const BUILD_STAGES = [
    {
        id: 'idea',
        number: '01',
        title: 'IDEA',
        description:
            'Define the problem, the product, and what needs to exist.',
    },

    {
        id: 'architecture',
        number: '02',
        title: 'ARCHITECTURE',
        description:
            'Shape the system before writing the system.',
    },

    {
        id: 'build',
        number: '03',
        title: 'BUILD',
        description:
            'Turn the architecture into working software.',
    },

    {
        id: 'integrate',
        number: '04',
        title: 'INTEGRATE',
        description:
            'Connect interfaces, APIs, data, authentication, and services.',
    },

    {
        id: 'harden',
        number: '05',
        title: 'HARDEN',
        description:
            'Test the edges, handle failure, and make the product reliable.',
    },

    {
        id: 'ship',
        number: '06',
        title: 'SHIP',
        description:
            'Build, deploy, release, observe, and iterate.',
    },
]


/* ============================================================
 * COMPONENT
 * ========================================================== */

export default function HowIBuildContainer() {
    const containerRef = useRef(null)

    const [activeStage, setActiveStage] =
        useState(null)

    const [introComplete, setIntroComplete] =
        useState(false)

    /*
     * The particle text takes approximately 2.8 seconds
     * to form.
     *
     * Keep this synchronized with the nebula component.
     */

    useEffect(() => {
        const timer = setTimeout(() => {
            setIntroComplete(true)
        }, 3800)

        return () => {
            clearTimeout(timer)
        }
    }, [])


    /* ========================================================
     * MOUSE
     * ====================================================== */

    const handlePointerMove = (event) => {
        const element =
            event.currentTarget

        const rect =
            element.getBoundingClientRect()

        const x =
            event.clientX -
            rect.left

        const y =
            event.clientY -
            rect.top

        element.style.setProperty(
            '--mouse-x',
            `${ x } px`,
        )

        element.style.setProperty(
            '--mouse-y',
            `${ y } px`,
        )
    }


    /* ========================================================
     * POINTER LEAVE
     * ====================================================== */

    const handlePointerLeave = () => {
        setActiveStage(null)
    }


    /* ========================================================
     * RENDER
     * ====================================================== */

    return (
        <section
            ref={containerRef}
            className="how-i-build"
            onPointerMove={
                handlePointerMove
            }
            onPointerLeave={
                handlePointerLeave
            }
        >

            {/* ==================================================
                NEBULA
            ================================================== */}

            <HowIBuildNebulaText />


            {/* ==================================================
                CONTENT
            ================================================== */}

            <div
                className={[
                    'how-i-build__content',
                    introComplete
                        ? 'how-i-build__content--visible'
                        : '',
                ].join(' ')}
            >

                {/* ==============================================
                    STAGE LABELS
                ============================================== */}

                <div
                    className="how-i-build__stages"
                >

                    {BUILD_STAGES.map(
                        (stage, index) => {
                            const isActive =
                                activeStage ===
                                stage.id

                            return (
                                <button
                                    key={stage.id}
                                    type="button"
                                    className={[
                                        'how-i-build__stage',
                                        isActive
                                            ? 'how-i-build__stage--active'
                                            : '',
                                    ].join(' ')}
                                    onPointerEnter={() => {
                                        setActiveStage(
                                            stage.id,
                                        )
                                    }}
                                    onFocus={() => {
                                        setActiveStage(
                                            stage.id,
                                        )
                                    }}
                                    onBlur={() => {
                                        setActiveStage(
                                            null,
                                        )
                                    }}
                                >

                                    <span
                                        className="how-i-build__stage-number"
                                    >
                                        {stage.number}
                                    </span>

                                    <span
                                        className="how-i-build__stage-title"
                                    >
                                        {stage.title}
                                    </span>

                                    <span
                                        className="how-i-build__stage-description"
                                    >
                                        {
                                            stage.description
                                        }
                                    </span>

                                </button>
                            )
                        },
                    )}

                </div>

            </div>

        </section>
    )
}