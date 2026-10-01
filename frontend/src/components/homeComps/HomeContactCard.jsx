import { Box } from '@mui/material';
import { motion, useTransform } from 'framer-motion';

const HomeContactCard = ({
    scrollProgress,
    introComplete,
}) => {

    const y = useTransform(
        scrollProgress,
        [0.34, 0.58],
        ['100vh', '0vh']
    );

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
                    : '100vh',
                pointerEvents: 'none',
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: 'calc(100vh + 40px)',
                    right: '10vw',

                    width: 'min(420px, 86vw)',
                    aspectRatio: '1.75 / 1',

                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                    boxShadow:
                        '0 20px 60px rgba(0, 0, 0, 0.18)',

                    boxSizing: 'border-box',
                    flexShrink: 0,
                }}
            />
        </motion.div>
    );
};

export default HomeContactCard;