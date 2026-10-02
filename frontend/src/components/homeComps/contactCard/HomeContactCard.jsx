import { Box } from '@mui/material'
import {
    motion,
    useTransform,
    useMotionTemplate,

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
     *
     * Front side enters from below.
     * Around the middle of the movement, the X flip begins.
     * ============================================================
     */

    const y = useTransform(
        scrollProgress,
        [
            0.00,
            0.48,
            0.53,
            0.60,
            0.66,
        ],
        [
            '105vh',
            '105vh',
            '105vh',
            '45vh',
            '0vh',
        ],
    )

    /*
     * ============================================================
     * FIRST FLIP — X AXIS
     *
     * Front
     *   ↓
     * Edge
     *   ↓
     * Back
     *
     * The card is front-facing during the first ~25% of
     * its entrance, then slowly flips around X.
     * ============================================================
     */

    const rotateX = useTransform(
        scrollProgress,
        [
            0.00,
            0.51,
            0.55,
            0.60,
        ],
        [
            0,
            0,
            90,
            180,
        ],
    )

    const rotateY = useTransform(
        scrollProgress,
        [
            0.60,
            0.63,
            0.66,
        ],
        [
            0,
            90,
            180,
        ],
    )

    const cardTransform = useMotionTemplate`
    rotateX(${rotateX}deg)
    rotateY(${rotateY}deg)
`

    return (
        <motion.div
            style={{
                position: 'absolute',
                top: 0,
                right: 0,

                width: '100%',
                height: '100%',

                y,

                pointerEvents: 'none',

                perspective: '1400px',

                opacity: introComplete ? 1 : 0,
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    right: '10vw',

                    transform:
                        'translateY(-50%)',

                    width:
                        contactCardStyles.card.width,

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

                        transform: cardTransform,

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