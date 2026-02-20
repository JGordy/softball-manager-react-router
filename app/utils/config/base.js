/**
 * Base configuration class
 * Shared logic for environment variable configuration and validation
 */
export class BaseConfig {
    constructor() {
        this._validated = false;
    }

    /**
     * Helper to lazily load an environment variable
     * @param {string} key - The property name (e.g. '_endpoint')
     * @param {string} envKey - The environment variable name (e.g. 'APPWRITE_ENDPOINT')
     * @param {any} defaultValue - Optional default value
     * @returns {any}
     */
    getEnv(key, envKey, defaultValue = null) {
        if (!this[key]) {
            this[key] = process.env[envKey] || defaultValue;
        }
        return this[key];
    }

    /**
     * Throw an error if any required variables are missing
     * @param {string} serviceName - Name of the service (for error message)
     * @param {Array<{label: string, value: any}>} checks - Array of checks to perform
     * @throws {Error}
     */
    throwIfMissing(serviceName, checks) {
        const missing = checks
            .filter((check) => !check.value)
            .map((check) => check.label);

        if (missing.length > 0) {
            throw new Error(
                `Missing required ${serviceName} environment variables: ${missing.join(", ")}`,
            );
        }
    }
}
