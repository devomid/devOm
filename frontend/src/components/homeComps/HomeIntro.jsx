import {
    Box,
} from '@mui/material'

import HomeNebulaText
    from './HomeNebulaText'


const HomeIntro = () => {
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
            <HomeNebulaText />
        </Box>
    )
}

export default HomeIntro