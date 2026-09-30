import { Box } from '@mui/material';

const WhyYouNeedMe = () => {
    return (
        <Box
            sx={{
                position: 'absolute',
                top: '50%',
                right: '6vw',
                transform: 'translateY(-50%)',

                width: 'min(520px, 42vw)',
                height: 'min(620px, 68vh)',

                borderRadius: '28px',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                background: 'rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                boxShadow: '0 20px 70px rgba(0, 0, 0, 0.18)',

                boxSizing: 'border-box',
                flexShrink: 0,
            }}
        />
    );
};

export default WhyYouNeedMe;