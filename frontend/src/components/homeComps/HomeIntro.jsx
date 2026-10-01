import {
    Box,
} from '@mui/material'

import HomeNebulaText
    from './HomeNebulaText'


const HomeIntro = ({
    onIntroComplete,
    onScrollIndicatorReady,
    scrollProgress,
    introComplete,
}) => {
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

                zIndex:
                    1,
            }}
        >
            <HomeNebulaText
                onIntroComplete={
                    onIntroComplete
                }
                onScrollIndicatorReady={
                    onScrollIndicatorReady
                }
                scrollProgress={
                    scrollProgress
                }
                introComplete={
                    introComplete
                }
            />
        </Box>
    )
}

export default HomeIntro