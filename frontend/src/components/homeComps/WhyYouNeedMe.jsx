import { Box } from '@mui/material';
import {
    motion,
    useMotionTemplate,
    useTransform,
} from 'framer-motion';

const WhyYouNeedMe = ({
    scrollProgress,
    introComplete,
}) => {

    /*
     * ============================================================
     * ENTRANCE → HOLD → COLLAPSE
     *
     * One continuous X timeline.
     *
     * The card enters from the right,
     * settles into position,
     * holds,
     * then physically collapses.
     * ============================================================
     */

    const x = useTransform(
        scrollProgress,
        [
            0.00,
            0.04,
            0.10,
            0.16,
            0.22,
            0.28,
            0.42,
            0.46,
            0.50,
            0.54,
        ],
        [
            '70vw',
            '70vw',
            '48vw',
            '24vw',
            '6vw',
            '0vw',
            '0vw',
            '-0.5vw',
            '-2vw',
            '0vw',
        ],
    );

    /*
     * ============================================================
     * ENTRANCE BLUR → SHARP → COLLAPSE BLUR
     * ============================================================
     */

    const blur = useTransform(
        scrollProgress,
        [
            0.00,
            0.04,
            0.10,
            0.16,
            0.22,
            0.28,
            0.42,
            0.47,
            0.52,
            0.56,
        ],
        [
            16,
            16,
            12,
            7,
            2,
            0,
            0,
            3,
            10,
            24,
        ],
    );

    /*
     * ============================================================
     * ENTRANCE OPACITY → HOLD → EXIT
     * ============================================================
     */

    const opacity = useTransform(
        scrollProgress,
        [
            0.00,
            0.04,
            0.08,
            0.14,
            0.20,
            0.42,
            0.48,
            0.53,
            0.56,
        ],
        [
            0,
            0,
            0.45,
            0.82,
            1,
            1,
            0.92,
            0.45,
            0,
        ],
    );

    /*
     * ============================================================
     * MATERIAL COLLAPSE
     * ============================================================
     */

    const scaleX = useTransform(
        scrollProgress,
        [
            0.00,
            0.42,
            0.46,
            0.50,
            0.54,
        ],
        [
            0.96,
            1,
            0.98,
            0.78,
            0.12,
        ],
    );

    const scaleY = useTransform(
        scrollProgress,
        [
            0.00,
            0.42,
            0.46,
            0.50,
            0.54,
        ],
        [
            0.96,
            1,
            0.96,
            0.68,
            0.10,
        ],
    );

    const y = useTransform(
        scrollProgress,
        [
            0.00,
            0.42,
            0.46,
            0.50,
            0.54,
        ],
        [
            0,
            0,
            '0.5vh',
            '1.5vh',
            '0vh',
        ],
    );

    const filter = useMotionTemplate`blur(${blur}px)`;

    return (
        <motion.div
            style={{
                position: 'absolute',
                top: 0,
                right: 0,

                width: '100%',
                height: '100%',

                x,
                y,

                scaleX,
                scaleY,

                opacity,

                filter,

                pointerEvents: 'none',
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    right: '6vw',

                    transform:
                        'translateY(-50%)',

                    width:
                        'min(900px, 68vw)',

                    height:
                        'min(620px, 68vh)',

                    borderRadius: '28px',

                    border:
                        '1px solid rgba(255, 255, 255, 0.16)',

                    background:
                        'rgba(255, 255, 255, 0.06)',

                    backdropFilter:
                        'blur(18px)',

                    WebkitBackdropFilter:
                        'blur(18px)',

                    boxShadow:
                        '0 20px 70px rgba(0, 0, 0, 0.18)',

                    boxSizing: 'border-box',
                }}
            />
        </motion.div>
    );
};

export default WhyYouNeedMe;