import { Box } from '@mui/material';
import { motion, useTransform, useSpring } from 'framer-motion';

const WhyYouNeedMe = ({
    scrollProgress,
    introComplete,
}) => {

    const xTarget = useTransform(
        scrollProgress,
        [
            0.28,
            0.36,
            0.46,
            0.54,
        ],
        [
            '100vw',
            '62vw',
            '14vw',
            '0vw',
        ]
    );

    const x = useTransform(
        scrollProgress,
        [
            0.22,
            0.27,
            0.32,
            0.36,
            0.40,
        ],
        [
            '72vw',
            '48vw',
            '25vw',
            '7vw',
            '0vw',
        ]
    );

    const rotateY = useTransform(
        scrollProgress,
        [
            0.28,
            0.32,
            0.36,
            0.40,
        ],
        [
            -18,
            -11,
            -4,
            0,
        ]
    );

    const rotateZ = useTransform(
        scrollProgress,
        [
            0.28,
            0.34,
            0.38,
            0.40,
        ],
        [
            2,
            1,
            0.25,
            0,
        ]
    );

    const scale = useTransform(
        scrollProgress,
        [
            0.28,
            0.34,
            0.38,
            0.40,
        ],
        [
            0.90,
            0.95,
            0.985,
            1,
        ]
    );

    const opacity = useTransform(
        scrollProgress,
        [
            0.30,
            0.33,
            0.37,
            0.39,
        ],
        [
            0.65,
            0.75,
            0.95,
            1,
        ]
    );

    return (
        <motion.div
            style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100%',
                height: '100%',

                x: introComplete
                    ? x
                    : '72vw',

                rotateY: introComplete
                    ? rotateY
                    : -18,

                rotateZ: introComplete
                    ? rotateZ
                    : 2,

                scale: introComplete
                    ? scale
                    : 0.90,

                opacity: opacity,

                transformPerspective: 1400,

                pointerEvents: 'none',
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    right: '6vw',
                    transform: 'translateY(-50%)',

                    width: 'min(900px, 68vw)',
                    height: 'min(620px, 68vh)',

                    borderRadius: '28px',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                    boxShadow:
                        '0 20px 70px rgba(0, 0, 0, 0.18)',

                    boxSizing: 'border-box',
                }}
            />
        </motion.div>
    );
};

export default WhyYouNeedMe;