import { Box } from '@mui/material';
import { glass, layout, } from '../../design';

const NavBar = () => {
    return (
        <Box
            component="nav"
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                maxWidth: layout.container.maxWidth,
                height: layout.header.heightDesktop,
                background: glass.floating.background,
                backdropFilter: glass.floating.backdropFilter,
                WebkitBackdropFilter: glass.floating.backdropFilter,
                borderBottom: glass.floating.border,
                boxShadow: glass.floating.shadow,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000,
            }}
        >
            navbar
        </Box>
    );
};

export default NavBar;