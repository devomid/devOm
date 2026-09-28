import { useRef } from 'react'
import HowIBuildNebulaText from '../components/howIBuildComps/HowIBuildNebulaText'
import HowIBuildContainer from '../components/howIBuildComps/HowIBuildContainer'


export default function HowIBuild() {

  const interactionRef = useRef({
    x: 0,
    y: 0,
    active: false,
    strength: 0,
  })
  
    return (
        <main
            className="how-i-build"
        >
        <HowIBuildNebulaText
          interactionRef={interactionRef}
        />

        <HowIBuildContainer
          interactionRef={interactionRef}
        />
        </main>
    )
}