/**
 * Appwrite configuration module
 * Single source of truth for Appwrite environment variables
 */

class AppwriteConfig {
    constructor() {
        this._endpoint = null;
        this._projectId = null;
        this._apiKey = null;
        this._validated = false;
    }

    get endpoint() {
        if (!this._endpoint) {
            this._endpoint = process.env.APPWRITE_ENDPOINT;
        }
        return this._endpoint;
    }

    get projectId() {
        if (!this._projectId) {
            this._projectId = process.env.APPWRITE_PROJECT_ID;
        }
        return this._projectId;
    }

    get apiKey() {
        if (!this._apiKey) {
            this._apiKey = process.env.APPWRITE_API_KEY;
        }
        return this._apiKey;
    }

    /**
     * Validate that required environment variables are set
     * @param {boolean} requireApiKey - Whether to require the API key (for admin operations)
     * @throws {Error} If required variables are missing
     */
    validate(requireApiKey = false) {
        const missing = [];

        if (!this.endpoint) missing.push("APPWRITE_ENDPOINT");
        if (!this.projectId) missing.push("APPWRITE_PROJECT_ID");
        if (requireApiKey && !this.apiKey) missing.push("APPWRITE_API_KEY");

        if (missing.length > 0) {
            throw new Error(
                `Missing required Appwrite environment variables: ${missing.join(", ")}`,
            );
        }

        this._validated = true;
    }
}

// Export a singleton instance
export const appwriteConfig = new AppwriteConfig();
