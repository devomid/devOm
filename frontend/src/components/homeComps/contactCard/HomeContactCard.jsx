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
     *
     * The card stays below the viewport until the Why card
     * has started collapsing.
     *
     * Then it rises into its final position.
     * ============================================================
     */

    const y = useTransform(
        scrollProgress,
        [
            0.00,
            0.48,
            0.51,
            0.57,
            0.63,
            0.66,
        ],
        [
            '105vh',
            '105vh',
            '105vh',
            '55vh',
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

    const rotateX = useTransform(
        scrollProgress,
        [
            0.00,
            0.57,
            0.60,
            0.64,
            0.68,
            0.72,
        ],
        [
            0,
            0,
            180,
            180,
            0,
            0,
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

                y,

                pointerEvents: 'none',

                perspective: '1400px',

                /*
                 * Keep it invisible during the actual intro.
                 * Once intro is complete, scroll controls its
                 * position continuously — no transform handoff.
                 */
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

                        rotateX,

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