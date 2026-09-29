import {
    useRef,
} from 'react'

import HowIBuildNebulaText
    from '../components/howIBuildComps/HowIBuildNebulaText'


export default function HowIBuild() {

    const interactionRef =
        useRef({
            x: 0,
            y: 0,
            active: false,
            strength: 0,
        })

    return (
        <main
            className="how-i-build"
            style={{
                position:
                    'relative',

                width:
                    '100%',

                height:
                    '100svh',

                minHeight:
                    '100svh',

                overflow:
                    'hidden',
            }}
        >
            <HowIBuildNebulaText
                interactionRef={
                    interactionRef
                }
            />
        </main>
    )
}
