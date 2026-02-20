import { umamiConfig } from "./config.js";

/**
 * Umami API Service
 * Handles server-side calls to Umami analytics
 */
export const umamiService = {
    _token: null,

    async getAuthHeader() {
        // 1. Cloud API Key (Preferred)
        if (umamiConfig.apiKey) {
            return {
                "x-umami-api-key": umamiConfig.apiKey,
            };
        }

        // 2. Token-based auth (for self-hosted or if ID/Secret provided)
        if (this._token) {
            return {
                Authorization: `Bearer ${this._token}`,
            };
        }

        // If we have credentials but no token, try to login
        if (umamiConfig.clientUserId && umamiConfig.clientSecret) {
            await this.login();
            if (this._token) {
                return {
                    Authorization: `Bearer ${this._token}`,
                };
            }
        }

        return {};
    },

    async login() {
        const endpoint = umamiConfig.apiEndpoint;
        const response = await fetch(`${endpoint}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: umamiConfig.clientUserId,
                secret: umamiConfig.clientSecret,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            this._token = data.token;
        } else {
            console.error("Umami login failed:", await response.text());
        }
    },

    async getStats(startAt, endAt) {
        umamiConfig.validate();
        const headers = await this.getAuthHeader();
        const websiteId = umamiConfig.websiteId;
        const endpoint = umamiConfig.apiEndpoint;

        // Ensure endpoint doesn't have double slashes if it already ends in one
        const baseUrl = endpoint.endsWith("/")
            ? endpoint.slice(0, -1)
            : endpoint;

        // The Umami Cloud API typically uses /v1 or /api
        // Based on testing, the correct path is /websites/{id}/stats
        const url = new URL(`${baseUrl}/websites/${websiteId}/stats`);

        url.searchParams.append(
            "startAt",
            startAt || Date.now() - 24 * 60 * 60 * 1000,
        ); // Default 24h
        url.searchParams.append("endAt", endAt || Date.now());

        const response = await fetch(url.toString(), { headers });
        if (!response.ok) {
            // If 401 and we were using a token, maybe it expired
            if (response.status === 401 && this._token) {
                this._token = null; // Clear token and retry once
                const retryHeaders = await this.getAuthHeader();
                const retryResponse = await fetch(url.toString(), {
                    headers: retryHeaders,
                });
                if (retryResponse.ok) return await retryResponse.json();
            }

            console.error("Umami stats error:", await response.text());
            return null;
        }

        return await response.json();
    },

    async getActiveUsers() {
        umamiConfig.validate();
        const headers = await this.getAuthHeader();
        const websiteId = umamiConfig.websiteId;
        const endpoint = umamiConfig.apiEndpoint;

        const baseUrl = endpoint.endsWith("/")
            ? endpoint.slice(0, -1)
            : endpoint;
        const response = await fetch(
            `${baseUrl}/websites/${websiteId}/active`,
            {
                headers,
            },
        );

        if (!response.ok) {
            console.error("Umami active users error:", await response.text());
            return null;
        }

        return await response.json();
    },

    async getMetrics(type, startAt, endAt) {
        umamiConfig.validate();
        const headers = await this.getAuthHeader();
        const websiteId = umamiConfig.websiteId;
        const endpoint = umamiConfig.apiEndpoint;

        const baseUrl = endpoint.endsWith("/")
            ? endpoint.slice(0, -1)
            : endpoint;

        const url = new URL(`${baseUrl}/websites/${websiteId}/metrics`);

        url.searchParams.append("type", type || "url");
        url.searchParams.append(
            "startAt",
            startAt || Date.now() - 24 * 60 * 60 * 1000,
        );
        url.searchParams.append("endAt", endAt || Date.now());

        const response = await fetch(url.toString(), { headers });
        if (!response.ok) {
            console.error("Umami metrics error:", await response.text());
            return null;
        }

        return await response.json();
    },
};
