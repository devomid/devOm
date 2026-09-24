export const typography = {
    fontFamily: {
        sans: '"Inter", "Helvetica Neue", Arial, sans-serif',
        display: '"Inter", "Helvetica Neue", Arial, sans-serif',
        mono: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
    },

    weight: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
    },

    size: {
        xs: "0.75rem",
        sm: "0.875rem",
        md: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        xxl: "1.5rem",
        xxxl: "2rem",
        displaySm: "3rem",
        displayMd: "4.5rem",
        displayLg: "6rem",
    },

    lineHeight: {
        tight: 1.05,
        snug: 1.15,
        normal: 1.4,
        relaxed: 1.6,
        loose: 1.8,
    },

    letterSpacing: {
        tight: "-0.04em",
        normal: "0",
        wide: "0.04em",
        wider: "0.08em",
    },

    display: {
        hero: {
            fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
            fontSize: "clamp(3.5rem, 8vw, 8rem)",
            fontWeight: 700,
            lineHeight: 0.95,
            letterSpacing: "-0.055em",
        },

        large: {
            fontSize: "clamp(2.75rem, 6vw, 6rem)",
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: "-0.05em",
        },
    },

    heading: {
        xl: {
            fontSize: "clamp(2rem, 4vw, 3.5rem)",
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
        },

        lg: {
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.035em",
        },

        md: {
            fontSize: "1.5rem",
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: "-0.025em",
        },
    },

    body: {
        lg: {
            fontSize: "1.25rem",
            fontWeight: 400,
            lineHeight: 1.6,
        },

        md: {
            fontSize: "1rem",
            fontWeight: 400,
            lineHeight: 1.6,
        },

        sm: {
            fontSize: "0.875rem",
            fontWeight: 400,
            lineHeight: 1.5,
        },
    },

    label: {
        md: {
            fontSize: "0.875rem",
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: "0.02em",
        },

        sm: {
            fontSize: "0.75rem",
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
        },
    },

    caption: {
        fontSize: "0.75rem",
        fontWeight: 400,
        lineHeight: 1.4,
    },
};