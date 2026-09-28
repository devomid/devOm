import {
    forwardRef,
} from 'react'

const HowIBuildCircle = forwardRef(
    (
        {
            stage,
            visible,
            active,
            onPointerEnter,
            onPointerLeave,
            onFocus,
            onBlur,
            onPointerDown,
        },
        ref,
    ) => {
        return (
            <button
                ref={ref}
                type="button"
                className={[
                    'how-i-build-circle',
                    visible
                        ? 'how-i-build-circle--visible'
                        : '',
                    active
                        ? 'how-i-build-circle--active'
                        : '',
                ].join(' ')}
                onPointerEnter={
                    onPointerEnter
                }
                onPointerLeave={
                    onPointerLeave
                }
                onFocus={
                    onFocus
                }
                onBlur={
                    onBlur
                }
                onPointerDown={
                    onPointerDown
                }
                tabIndex={
                    visible
                        ? 0
                        : -1
                }
                aria-hidden={
                    !visible
                }
            > <span
                className="how-i-build-circle__number"
            >
                    {
                        stage.number
                    } </span>

                <span
                    className="how-i-build-circle__title"
                >
                    {
                        stage.title
                    }
                </span>

                <span
                    className="how-i-build-circle__description"
                >
                    {
                        stage.description
                    }
                </span>
            </button>
        )
    },

)

HowIBuildCircle.displayName =
'HowIBuildCircle'

export default HowIBuildCircle
