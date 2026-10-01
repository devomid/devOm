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

    const x = useSpring(
        xTarget,
        {
            stiffness: 42,
            damping: 32,
            mass: 2.4,
        }
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
                    : '100vw',
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