export const contactCardStyles = {
    card: {
        position: 'relative',
        width: 'min(420px, 86vw)',
        aspectRatio: '1.75 / 1',

        transformStyle: 'preserve-3d',

        borderRadius: '24px',

        boxSizing: 'border-box',
    },

    face: {
        position: 'absolute',
        inset: 0,

        width: '100%',
        height: '100%',

        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.16)',
        background: 'rgba(255, 255, 255, 0.06)',

        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',

        boxShadow:
            '0 20px 60px rgba(0, 0, 0, 0.18)',

        boxSizing: 'border-box',

        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
    },

    backFace: {
        transform: 'rotateX(180deg)',
    },
}