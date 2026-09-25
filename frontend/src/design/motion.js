export const motion = {
    duration: {
        instant: 0,
        fast: 0.18,
        normal: 0.35,
        slow: 0.6,
        dramatic: 1,
    },

    easing: {
        standard: [0.2, 0.8, 0.2, 1],
        emphasized: [0.16, 1, 0.3, 1],
        entrance: [0.22, 1, 0.36, 1],
        exit: [0.4, 0, 1, 1],
        linear: "linear",
    },

    distance: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 32,
        xl: 64,
    },

    scale: {
        subtle: 1.01,
        normal: 1.03,
        emphasis: 1.06,
    },

    opacity: {
        hidden: 0,
        subtle: 0.35,
        visible: 1,
    },
    spring: {
        gentle: {
            type: "spring",
            stiffness: 120,
            damping: 20,
            mass: 0.8,
        },

        standard: {
            type: "spring",
            stiffness: 180,
            damping: 24,
            mass: 0.8,
        },

        expressive: {
            type: "spring",
            stiffness: 100,
            damping: 14,
            mass: 0.8,
        },
    },

    parallax: {
        background: 0.08,
        middle: 0.18,
        foreground: 0.32,
    },
};