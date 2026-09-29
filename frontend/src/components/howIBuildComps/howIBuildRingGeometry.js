export const HOW_I_BUILD_RING_COUNT =
    6


export const HOW_I_BUILD_RING_Y =
    -2.05


export const HOW_I_BUILD_RING_SPACING =
    1.95


export const getHowIBuildRingCenterX = (
    index,
) => {
    const totalWidth =
        (
            HOW_I_BUILD_RING_COUNT -
            1
        ) *
        HOW_I_BUILD_RING_SPACING

    return (
        index *
        HOW_I_BUILD_RING_SPACING -
        totalWidth / 2
    )
}


export const getHowIBuildRingCenters = () => {
    return Array.from(
        {
            length:
                HOW_I_BUILD_RING_COUNT,
        },
        (
            _,
            index,
        ) => ({
            x:
                getHowIBuildRingCenterX(
                    index,
                ),

            y:
                HOW_I_BUILD_RING_Y,
        }),
    )
}