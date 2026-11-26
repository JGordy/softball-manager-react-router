import { render, screen } from "@/utils/test-utils";
import DefensivePlaybookPage, { loader, meta } from "../defensive-playbook";

// Mock react-router useLoaderData
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useLoaderData: jest.fn(),
}));

describe("Defensive Playbook Route", () => {
    it("returns proper SEO and OpenGraph meta configuration", () => {
        const metaTags = meta();
        expect(metaTags).toEqual([
            { title: "Defensive Playbook | RostrHQ" },
            {
                name: "description",
                content:
                    "Interactive slow-pitch softball defensive playbook and 10-player field alignment engine for ASA/USA Softball and USSSA.",
            },
        ]);
    });

    it("loader loads all plays and categories successfully", async () => {
        const data = await loader();
        expect(data).toBeDefined();
        expect(Array.isArray(data.plays)).toBe(true);
        expect(data.plays.length).toBeGreaterThanOrEqual(70);
        expect(Array.isArray(data.categories)).toBe(true);
        expect(data.categories).toContain("Bases Empty");
        expect(data.categories).toContain("Bases Loaded");
    });

    it("renders page with loader data", async () => {
        const { useLoaderData } = require("react-router");
        const data = await loader();
        useLoaderData.mockReturnValue(data);

        render(<DefensivePlaybookPage />);

        expect(
            screen.getAllByRole("heading", { name: "Defensive Playbook" })
                .length,
        ).toBeGreaterThan(0);
        expect(
            screen.getByRole("button", {
                name: "Select play or situation",
            }),
        ).toBeInTheDocument();
        expect(screen.getByText("Select Scenario")).toBeInTheDocument();
    });
});
