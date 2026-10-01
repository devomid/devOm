import { Box } from '@mui/material'
import {
    motion,
    useTransform,
} from 'framer-motion'

import ContactCardFace from './ContactCardFace'
import { contactCardStyles } from './contactCardStyle'

const HomeContactCard = ({
    scrollProgress,
    introComplete,
}) => {

    /*
     * ============================================================
     * VERTICAL ENTRANCE
     * ============================================================
     */

    const y = useTransform(
        scrollProgress,
        [
            0.40,
            0.54,
            0.64,
        ],
        [
            '105vh',
            '10vh',
            '0vh',
        ],
    )

    /*
     * ============================================================
     * 3D FLIP
     *
     * Front
     *   ↓
     * Edge
     *   ↓
     * Back
     *   ↓
     * Edge
     *   ↓
     * Front
     * ============================================================
     */

    const rotateY = useTransform(
        scrollProgress,
        [
            0.40,
            0.49,
            0.55,
            0.64,
        ],
        [
            0,
            180,
            180,
            360,
        ],
    )

    return (
        <motion.div
            style={{
                position: 'absolute',
                top: 0,
                right: 0,

                width: '100%',
                height: '100%',

                y: introComplete
                    ? y
                    : '105vh',

                pointerEvents: 'none',

                perspective: '1400px',
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    right: '10vw',

                    transform:
                        'translateY(-50%)',

                    width: contactCardStyles.card.width,
                    aspectRatio:
                        contactCardStyles.card.aspectRatio,

                    perspective:
                        '1400px',
                }}
            >
                <motion.div
                    style={{
                        position: 'relative',

                        width: '100%',
                        height: '100%',

                        rotateY,

                        transformStyle:
                            'preserve-3d',
                    }}
                >
                    <ContactCardFace />

                    <ContactCardFace back />
                </motion.div>
            </Box>
        </motion.div>
    )
}

export default HomeContactCard