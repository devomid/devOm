
import {
    useState,
} from 'react'


const BUILD_STAGES = [
    {
        id: 'idea',
        number: '01',
        title: 'IDEA',
        description:
            'Turn an idea into a clear product problem.',
    },

    {
        id: 'architecture',
        number: '02',
        title: 'ARCHITECTURE',
        description:
            'Design the system before building it.',
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
            'Connect interfaces, APIs, data, and services.',
    },

    {
        id: 'harden',
        number: '05',
        title: 'HARDEN',
        description:
            'Test, validate, handle failure, and refine.',
    },

    {
        id: 'ship',
        number: '06',
        title: 'SHIP',
        description:
            'Build, deploy, release, and iterate.',
    },
]


export default function HowIBuildContainer() {
    const [
        activeStage,
        setActiveStage,
    ] = useState(null)

    return (
        <div
            className="how-i-build-container"
        >
            <div
                className="how-i-build-stages"
            >
                {BUILD_STAGES.map(
                    (stage) => {
                        const active =
                            activeStage ===
                            stage.id

                        return (
                            <button
                                key={
                                    stage.id
                                }
                                type="button"
                                className={[
                                    'how-i-build-stage',
                                    active
                                        ? 'how-i-build-stage--active'
                                        : '',
                                ].join(' ')}
                                onPointerEnter={() =>
                                    setActiveStage(
                                        stage.id,
                                    )
                                }
                                onPointerLeave={() =>
                                    setActiveStage(
                                        null,
                                    )
                                }
                                onFocus={() =>
                                    setActiveStage(
                                        stage.id,
                                    )
                                }
                                onBlur={() =>
                                    setActiveStage(
                                        null,
                                    )
                                }
                            >
                                <span
                                    className="how-i-build-stage__number"
                                >
                                    {
                                        stage.number
                                    }
                                </span>

                                <span
                                    className="how-i-build-stage__title"
                                >
                                    {
                                        stage.title
                                    }
                                </span>

                                <span
                                    className="how-i-build-stage__description"
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
    )
}