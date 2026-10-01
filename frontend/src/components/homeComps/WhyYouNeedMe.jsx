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
            0.28,
            0.34,
            0.40,
            0.46,
            0.52,
        ],
        [
            '110vw',
            '58vw',
            '18vw',
            '3vw',
            '0vw',
        ]
    );

    const rotateY = useTransform(
        scrollProgress,
        [
            0.28,
            0.34,
            0.40,
            0.46,
            0.52,
        ],
        [
            -22,
            -15,
            -6,
            1.5,
            0,
        ]
    );

    const rotateZ = useTransform(
        scrollProgress,
        [
            0.28,
            0.36,
            0.44,
            0.52,
        ],
        [
            2.5,
            1.2,
            0.3,
            0,
        ]
    );

    const scale = useTransform(
        scrollProgress,
        [
            0.28,
            0.36,
            0.44,
            0.52,
        ],
        [
            0.88,
            0.94,
            0.985,
            1,
        ]
    );

    const opacity = useTransform(
        scrollProgress,
        [
            0.28,
            0.34,
            0.40,
            0.46,
        ],
        [
            0,
            0.35,
            0.75,
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
                    : '110vw',

                rotateY: introComplete
                    ? rotateY
                    : -22,

                rotateZ: introComplete
                    ? rotateZ
                    : 2.5,

                scale: introComplete
                    ? scale
                    : 0.88,

                opacity: introComplete
                    ? opacity
                    : 0,

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