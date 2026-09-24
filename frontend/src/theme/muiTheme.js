import { createTheme } from "@mui/material/styles";

import {
    colors,
    typography,
    spacing,
    radius,
    shadows,
    breakpoints,
} from "../design";

export const muiTheme = createTheme({
    palette: {
        mode: "light",

        primary: {
            main: colors.accent.primary,
        },

        secondary: {
            main: colors.accent.secondary,
        },

        background: {
            default: colors.background.primary,
            paper: colors.surface.primary,
        },

        text: {
            primary: colors.text.primary,
            secondary: colors.text.secondary,
        },

        divider: colors.border.subtle,

        success: {
            main: colors.status.success,
        },

        warning: {
            main: colors.status.warning,
        },

        error: {
            main: colors.status.error,
        },

        info: {
            main: colors.status.info,
        },
    },

    typography: {
        fontFamily: typography.fontFamily.sans,

        fontWeightRegular: typography.weight.regular,
        fontWeightMedium: typography.weight.medium,
        fontWeightBold: typography.weight.bold,

        h1: {
            ...typography.display.large,
        },

        h2: {
            ...typography.heading.xl,
        },

        h3: {
            ...typography.heading.lg,
        },

        h4: {
            ...typography.heading.md,
        },

        body1: {
            ...typography.body.lg,
        },

        body2: {
            ...typography.body.md,
        },

        caption: {
            ...typography.caption,
        },
    },

    shape: {
        borderRadius: Number.parseInt(radius.md, 10),
    },

    spacing: 4,

    shadows: [
        shadows.none,
        shadows.xs,
        shadows.sm,
        shadows.md,
        shadows.lg,
        shadows.xl,
        shadows.xl,
        shadows.xl,
        shadows.xl,
        shadows.xl,
        shadows.xl,
        shadows.xl,
        shadows.xl,
        shadows.xl,
        shadows.xl,
        shadows.xl,
        shadows.xl,
        shadows.xl,
        shadows.xl,
        shadows.xl,
        shadows.xl,
        shadows.xl,
        shadows.xl,
        shadows.xl,
        shadows.xl,
    ],

    breakpoints: {
        values: {
            xs: breakpoints.mobile,
            sm: breakpoints.mobileLarge,
            md: breakpoints.tablet,
            lg: breakpoints.laptop,
            xl: breakpoints.desktop,
        },
    },

    components: {
        MuiCssBaseline: {
            styleOverrides: {
                html: {
                    scrollBehavior: "smooth",
                },

                body: {
                    margin: 0,
                    backgroundColor: colors.background.primary,
                    color: colors.text.primary,
                    fontFamily: typography.fontFamily.sans,
                    WebkitFontSmoothing: "antialiased",
                    MozOsxFontSmoothing: "grayscale",
                },

                "*": {
                    boxSizing: "border-box",
                },

                "::selection": {
                    backgroundColor: colors.accent.primary,
                    color: colors.text.inverse,
                },
            },
        },

        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },

            styleOverrides: {
                root: {
                    borderRadius: radius.pill,
                    textTransform: "none",
                    fontWeight: typography.weight.semibold,
                    paddingInline: spacing.xl,
                    minHeight: "48px",
                },
            },
        },

        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: radius.xl,
                    border: `1px solid ${colors.border.subtle}`,
                    boxShadow: shadows.sm,
                    backgroundColor: colors.surface.primary,
                },
            },
        },

        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                },
            },
        },
    },
});