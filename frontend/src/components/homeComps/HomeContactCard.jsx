import { Box } from '@mui/material';

const HomeContactCard = () => {
    return (
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
    );
};

export default HomeContactCard;