const isDevelopment = import.meta.env.DEV;

const logger = {
    debug(message, ...data) {
        if (!isDevelopment) return;

        console.debug(`[DEBUG] ${message}`, ...data);
    },

    info(message, ...data) {
        console.info(`[INFO] ${message}`, ...data);
    },

    warn(message, ...data) {
        console.warn(`[WARN] ${message}`, ...data);
    },

    error(message, ...data) {
        console.error(`[ERROR] ${message}`, ...data);
    },
};

export default logger;