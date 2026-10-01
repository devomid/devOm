import { Box } from '@mui/material'
import { contactCardStyles } from './contactCardStyles'

const ContactCardFace = ({ back = false }) => {
    return (
        <Box
            sx={{
                ...contactCardStyles.face,
                ...(back
                    ? contactCardStyles.backFace
                    : {}),
            }}
        />
    )
}

export default ContactCardFace