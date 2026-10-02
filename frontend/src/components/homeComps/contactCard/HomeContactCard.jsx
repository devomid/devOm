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
     * SEQUENCE
     *
     * 0.00 ───────── 0.48   Card enters from below
     * 0.48 ───────── 0.53   X flip
     * 0.53 ───────── 0.58   Move upward
     * 0.58 ───────── 0.63   Y flip
     * 0.63 ───────── 0.68   Move upward
     * 0.68 ───────── 1.00   Rest
     *
     * Every active phase has the same 0.05 scroll interval.
     * ============================================================
     */

    /*
     * ------------------------------------------------------------
     * VERTICAL POSITION
     * ------------------------------------------------------------
     *
     * First:
     *   card starts below viewport
     *
     * Then:
     *   card enters and reaches the first position
     *
     * Then:
     *   X flip happens WITHOUT moving
     *
     * Then:
     *   card moves upward
     *
     * Then:
     *   Y flip happens WITHOUT moving
     *
     * Then:
     *   card moves upward to final position
     */

    const y = useTransform(
        scrollProgress,
        [
            0.00,
            0.45,
            0.52,
            0.59,
            0.67,
            0.74,
            0.82,
        ],
        [
            '105vh',
            '65vh',
            '50vh',
            '35vh',
            '20vh',
            '10vh',
            '0vh',
        ],
    )

    const rotateX = useTransform(
        scrollProgress,
        [
            0.00,
            0.52,
            0.59,
            0.82,
        ],
        [
            0,
            0,
            180,
            180,
        ],
    )

    const rotateY = useTransform(
        scrollProgress,
        [
            0.00,
            0.67,
            0.74,
            0.82,
        ],
        [
            0,
            0,
            180,
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

                    top: {
                        xs: '25%',
                        sm: '25%',
                        md: '25%',
                        lg: '50%',
                    },
                    right: '10vw',

                    transform: 'translateY(-50%)',

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