import "@testing-library/jest-dom";

// Polyfill Response for jsdom environment
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
        async json() {
            return typeof this.body === "string"
                ? JSON.parse(this.body)
                : this.body;
        }
        static json(data, init = {}) {
            return new Response(data, init);
        }
    };
}

if (typeof globalThis.Request === "undefined") {
    globalThis.Request = class Request {
        constructor(url, init = {}) {
            this.url = url;
            this.method = init.method || "GET";
            this.body = init.body;
            this.headers = new Map();
            if (init.headers) {
                Object.entries(init.headers).forEach(([key, value]) => {
                    this.headers.set(key.toLowerCase(), value);
                });
            }
        }
        async json() {
            return JSON.parse(this.body);
        }
        async formData() {
            return this.body;
        }
    };
}

if (typeof globalThis.FormData === "undefined") {
    globalThis.FormData = class FormData {
        constructor() {
            this.map = new Map();
        }
        append(key, value) {
            this.map.set(key, value);
        }
        get(key) {
            return this.map.get(key);
        }
    };
}
