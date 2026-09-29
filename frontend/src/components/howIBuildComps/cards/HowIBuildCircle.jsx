import Box from '@mui/material/Box'
import { glass } from '../../../design/glass';


export default function HowIBuildCircle({
    stage,
    visible,
    left,
    top,
    onClick,
}) {
    return (
        <Box
            component="button"

            type="button"

            onClick={
                onClick
            }

            sx={{
                position:
                    'absolute',

                left,

                top,

                transform:
                    'translate(-50%, -50%)',

                width:
                    82,

                height:
                    82,

                padding:
                    0,

                margin:
                    0,

                borderRadius:
                    '50%',

                border: glass.floating.border,

                background: glass.floating.background,
                backdropFilter: glass.floating.backdropFilter,
                boxShadow: glass.floating.shadow,
                color:
                    '#ffffff',

                display:
                    'flex',

                alignItems:
                    'center',

                justifyContent:
                    'center',

                cursor:
                    'pointer',

                opacity:
                    visible
                        ? 1
                        : 0,

                pointerEvents: 'auto',
                transition:
                    'opacity 350ms ease',

                boxSizing:
                    'border-box',
            }}
        >
            <Box
                sx={{
                    display:
                        'flex',

                    flexDirection:
                        'column',

                    alignItems:
                        'center',

                    justifyContent:
                        'center',

                    gap:
                        '4px',

                    pointerEvents:
                        'none',
                }}
            >
                <Box
                    component="span"
                    sx={{
                        fontSize:
                            11,

                        opacity:
                            0.55,
                    }}
                >
                    {
                        stage.number
                    }
                </Box>

                <Box
                    component="span"
                    sx={{
                        fontSize:
                            13,

                        fontWeight:
                            700,

                        letterSpacing:
                            '0.08em',
                    }}
                >
                    {
                        stage.title
                    }
                </Box>
            </Box>
        </Box>
    )
}
