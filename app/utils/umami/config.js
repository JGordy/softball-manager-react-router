import { BaseConfig } from "../config/base.js";

/**
 * Umami configuration module
 * Single source of truth for Umami environment variables
 */
class UmamiConfig extends BaseConfig {
    constructor() {
        super();
        this._websiteId = null;
        this._apiKey = null;
        this._clientUserId = null;
        this._clientSecret = null;
        this._apiEndpoint = null;
    }

    get websiteId() {
        return this.getEnv("_websiteId", "UMAMI_WEBSITE_ID");
    }

    get apiKey() {
        return this.getEnv("_apiKey", "UMAMI_API_KEY");
    }

    get clientUserId() {
        return this.getEnv(
            "_clientUserId",
            "UMAMI_API_CLIENT_USER_ID",
            process.env.UMAMI_API_CLIENT_ID,
        );
    }

    get clientSecret() {
        return this.getEnv("_clientSecret", "UMAMI_API_CLIENT_SECRET");
    }

    get apiEndpoint() {
        return this.getEnv(
            "_apiEndpoint",
            "UMAMI_API_ENDPOINT",
            "https://api.umami.is/v1",
        );
    }

    /**
     * Validate that required environment variables are set
     * @throws {Error} If required variables are missing
     */
    validate() {
        const checks = [{ label: "UMAMI_WEBSITE_ID", value: this.websiteId }];

        // Logic check: need either API key or (User ID + Secret)
        if (!this.apiKey && (!this.clientUserId || !this.clientSecret)) {
            checks.push({
                label: "UMAMI_API_KEY (or UMAMI_API_CLIENT_ID and UMAMI_API_CLIENT_SECRET)",
                value: false,
            });
        }

        this.throwIfMissing("Umami", checks);
        this._validated = true;
    }
}

// Export a singleton instance
export const umamiConfig = new UmamiConfig();
