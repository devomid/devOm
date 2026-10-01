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
     * ENTRANCE
     *
     * DO NOT CHANGE.
     * This is the entrance motion that already feels right.
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
     * LAZY EXIT
     *
     * The collapse starts quietly.
     *
     * It compresses horizontally first,
     * then vertically,
     * then becomes very small.
     *
     * The different timings create the feeling of
     * something heavy losing its structure rather than
     * simply shrinking.
     * ============================================================
     */

    const exitScaleX = useTransform(
        scrollProgress,
        [
            0.42,
            0.46,
            0.485,
            0.515,
            0.55,
            0.58,
        ],
        [
            1,
            0.995,
            0.96,
            0.72,
            0.30,
            0.08,
        ],
    );

    const exitScaleY = useTransform(
        scrollProgress,
        [
            0.42,
            0.46,
            0.50,
            0.53,
            0.56,
            0.58,
        ],
        [
            1,
            0.998,
            0.94,
            0.78,
            0.36,
            0.10,
        ],
    );

    /*
     * Slightly delayed physical displacement.
     *
     * The card does not immediately move while collapsing.
     * It first compresses under its own weight.
     */

    const exitY = useTransform(
        scrollProgress,
        [
            0.42,
            0.47,
            0.50,
            0.53,
            0.56,
            0.58,
        ],
        [
            '0vh',
            '0vh',
            '0.3vh',
            '1.2vh',
            '2.8vh',
            '4vh',
        ],
    );

    /*
     * A very small sideways drift.
     *
     * Intentionally restrained.
     */

    const exitX = useTransform(
        scrollProgress,
        [
            0.42,
            0.48,
            0.52,
            0.56,
            0.58,
        ],
        [
            '0vw',
            '0vw',
            '-0.5vw',
            '-1vw',
            '-1.5vw',
        ],
    );

    /*
     * The blur waits before becoming obvious.
     */

    const exitBlur = useTransform(
        scrollProgress,
        [
            0.42,
            0.47,
            0.50,
            0.54,
            0.58,
        ],
        [
            0,
            0.5,
            3,
            10,
            24,
        ],
    );

    /*
     * Opacity is deliberately the LAST thing to disappear.
     *
     * The physical collapse happens first.
     */

    const exitOpacity = useTransform(
        scrollProgress,
        [
            0.42,
            0.48,
            0.52,
            0.56,
            0.58,
        ],
        [
            1,
            1,
            0.88,
            0.48,
            0,
        ],
    );

    const filter = useMotionTemplate`blur(${blur}px)`;

    const collapseFilter =
        useMotionTemplate`blur(${exitBlur}px)`;

    /*
     * ============================================================
     * COMPOSE ENTRANCE + EXIT
     * ============================================================
     */

    const finalScaleX = useTransform(
        scrollProgress,
        [
            0.00,
            0.42,
            0.46,
            0.485,
            0.515,
            0.55,
            0.58,
        ],
        [
            0.96,
            1,
            0.995,
            0.96,
            0.72,
            0.30,
            0.08,
        ],
    );

    const finalScaleY = useTransform(
        scrollProgress,
        [
            0.00,
            0.42,
            0.46,
            0.50,
            0.53,
            0.56,
            0.58,
        ],
        [
            0.96,
            1,
            0.998,
            0.94,
            0.78,
            0.36,
            0.10,
        ],
    );

    return (
        <motion.div
            style={{
                position: 'absolute',
                top: 0,
                right: 0,

                width: '100%',
                height: '100%',

                x,

                y: exitY,

                scaleX: finalScaleX,
                scaleY: finalScaleY,

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