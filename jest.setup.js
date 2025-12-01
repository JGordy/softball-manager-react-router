import "@testing-library/jest-dom";

// Polyfill Response for jsdom environment (used by setPasswordForInvitedUser)
if (typeof globalThis.Response === "undefined") {
    globalThis.Response = class Response {
        constructor(body, init = {}) {
            this.body = body;
            this.status = init.status || 200;
            this.statusText = init.statusText || "";
            this._headers = new Map();
            if (init.headers) {
                Object.entries(init.headers).forEach(([key, value]) => {
                    this._headers.set(key.toLowerCase(), value);
                });
            }
            this.headers = {
                get: (name) => this._headers.get(name.toLowerCase()) || null,
                set: (name, value) =>
                    this._headers.set(name.toLowerCase(), value),
                has: (name) => this._headers.has(name.toLowerCase()),
            };
            this.ok = this.status >= 200 && this.status < 300;
        }
    };
}
