import { BaseConfig } from "../config/base.js";

/**
 * Appwrite configuration module
 * Single source of truth for Appwrite environment variables
 */
class AppwriteConfig extends BaseConfig {
    constructor() {
        super();
        this._endpoint = null;
        this._projectId = null;
        this._apiKey = null;
        this._validated = false;
    }

    get endpoint() {
        return this.getEnv("_endpoint", "APPWRITE_ENDPOINT");
    }

    get projectId() {
        return this.getEnv("_projectId", "APPWRITE_PROJECT_ID");
    }

    get apiKey() {
        return this.getEnv("_apiKey", "APPWRITE_API_KEY");
    }

    /**
     * Validate that required environment variables are set
     * @param {boolean} requireApiKey - Whether to require the API key (for admin operations)
     * @throws {Error} If required variables are missing
     */
    validate(requireApiKey = false) {
        const checks = [
            { label: "APPWRITE_ENDPOINT", value: this.endpoint },
            { label: "APPWRITE_PROJECT_ID", value: this.projectId },
        ];

        if (requireApiKey) {
            checks.push({ label: "APPWRITE_API_KEY", value: this.apiKey });
        }

        this.throwIfMissing("Appwrite", checks);
        this._validated = true;
    }
}

// Export a singleton instance
export const appwriteConfig = new AppwriteConfig();
