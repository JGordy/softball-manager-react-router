// Mock global fetch
global.fetch = jest.fn();

describe("badWordsApi", () => {
    const originalEnv = process.env;
    let badWordsApi;

    beforeEach(async () => {
        jest.resetModules();
        process.env = { ...originalEnv, BAD_WORDS_API_KEY: "test-api-key" };
        fetch.mockClear();

        // Dynamic import to pick up new env vars
        badWordsApi = await import("./badWordsApi");
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe("checkBadWords", () => {
        it("should throw error if API key is missing", async () => {
            jest.resetModules();
            process.env.BAD_WORDS_API_KEY = "";
            const api = await import("./badWordsApi");

            await expect(api.checkBadWords("some text")).rejects.toThrow(
                "BAD_WORDS_API_KEY environment variable is not configured",
            );
        });

        it("should throw error if text is invalid", async () => {
            await expect(badWordsApi.checkBadWords("")).rejects.toThrow(
                "Text parameter is required",
            );
            await expect(badWordsApi.checkBadWords(123)).rejects.toThrow(
                "Text parameter is required",
            );
        });

        it("should call API and return result on success", async () => {
            const mockResponse = {
                bad_words_total: 1,
                bad_words_list: [{ word: "bad" }],
                censored_content: "this is ***",
                content: "this is bad",
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await badWordsApi.checkBadWords("this is bad");

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining("https://api.apilayer.com/bad_words"),
                expect.objectContaining({
                    method: "POST",
                    headers: {
                        apikey: "test-api-key",
                        "Content-Type": "text/plain",
                    },
                    body: "this is bad",
                }),
            );
            expect(result).toEqual(mockResponse);
        });

        it("should throw error on API failure", async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => "Internal Server Error",
            });

            await expect(badWordsApi.checkBadWords("text")).rejects.toThrow(
                "Bad Words API error (500): Internal Server Error",
            );
        });
    });

    describe("hasBadWords", () => {
        it("should return true if bad words found", async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ bad_words_total: 1 }),
            });
            const result = await badWordsApi.hasBadWords("bad");
            expect(result).toBe(true);
        });

        it("should return false if no bad words found", async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ bad_words_total: 0 }),
            });
            const result = await badWordsApi.hasBadWords("good");
            expect(result).toBe(false);
        });

        it("should return false and log error on API failure", async () => {
            const consoleErrorSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => {});
            const consoleWarnSpy = jest
                .spyOn(console, "warn")
                .mockImplementation(() => {});

            fetch.mockRejectedValueOnce(new Error("Network error"));

            const result = await badWordsApi.hasBadWords("text");
            expect(result).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(consoleWarnSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
            consoleWarnSpy.mockRestore();
        });
    });

    describe("censorBadWords", () => {
        it("should return censored content", async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ censored_content: "***" }),
            });
            const result = await badWordsApi.censorBadWords("bad");
            expect(result).toBe("***");
        });

        it("should return original text on error", async () => {
            const consoleErrorSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => {});
            fetch.mockRejectedValueOnce(new Error("Network error"));

            const result = await badWordsApi.censorBadWords("bad");
            expect(result).toBe("bad");
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });

    describe("getBadWordsList", () => {
        it("should return list of bad words", async () => {
            const list = [{ word: "bad" }];
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ bad_words_list: list }),
            });
            const result = await badWordsApi.getBadWordsList("bad");
            expect(result).toEqual(list);
        });

        it("should return empty list on error", async () => {
            const consoleErrorSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => {});
            fetch.mockRejectedValueOnce(new Error("Network error"));

            const result = await badWordsApi.getBadWordsList("bad");
            expect(result).toEqual([]);
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });
});
