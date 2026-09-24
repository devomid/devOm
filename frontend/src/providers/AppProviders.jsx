import { CssBaseline, ThemeProvider } from "@mui/material";

import { muiTheme } from "../theme/muiTheme";

function AppProviders({ children }) {
    return (
        <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
}

export default AppProviders;