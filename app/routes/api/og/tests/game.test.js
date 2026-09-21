import { loader } from "../game";
import * as gamesLoaders from "@/loaders/games";

jest.mock("@/loaders/games", () => ({
    getEventById: jest.fn(),
}));

jest.mock("@/utils/appwrite/server", () => ({
    createAdminClient: jest.fn(() => ({})),
}));

describe("/api/og/game route loader", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders SVG response when requested with .svg", async () => {
        gamesLoaders.getEventById.mockResolvedValue({
            game: {
                $id: "event-123",
                opponent: "Decatur Raiders",
                score: 14,
                opponentScore: 8,
                gameFinal: true,
                location: "Grant Park",
            },
            teams: [{ name: "Ormewood Park Sliders" }],
            season: { name: "Fall 2026" },
        });

        const request = new Request(
            "https://rostrhq.app/api/og/game/event-123.svg",
        );
        const response = await loader({
            request,
            params: { eventId: "event-123.svg" },
        });

        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
        expect(response.headers.get("Cache-Control")).toContain("max-age=3600");

        const text = await response.text();
        expect(text).toContain("ORMEWOOD PARK");
        expect(text).toContain("SLIDERS");
        expect(text).toContain("DECATUR");
        expect(text).toContain("RAIDERS");
        expect(text).toContain("FINAL");
        expect(text).toContain("14");
        expect(text).toContain("8");
    });

    it("renders PNG response by default or when requested with .png", async () => {
        gamesLoaders.getEventById.mockResolvedValue({
            game: {
                $id: "event-456",
                opponent: "Red Hots",
                score: 5,
                opponentScore: 3,
                gameFinal: false,
            },
            teams: [{ name: "Thunder" }],
            season: { name: "Summer 2026" },
        });

        const request = new Request(
            "https://rostrhq.app/api/og/game/event-456.png",
        );
        const response = await loader({
            request,
            params: { eventId: "event-456.png" },
        });

        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toBe("image/png");
        expect(response.headers.get("Cache-Control")).toContain("max-age=30");

        const arrayBuffer = await response.arrayBuffer();
        expect(arrayBuffer.byteLength).toBeGreaterThan(1000);
    });

    it("falls back gracefully when game is not found", async () => {
        gamesLoaders.getEventById.mockResolvedValue(null);

        const request = new Request(
            "https://rostrhq.app/api/og/game/missing.svg",
        );
        const response = await loader({
            request,
            params: { eventId: "missing.svg" },
        });

        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
        const text = await response.text();
        expect(text).toContain("<svg");
    });
});
