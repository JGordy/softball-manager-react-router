import { useOutletContext } from "react-router";
import { render, screen } from "@/utils/test-utils";

import * as teamsLoaders from "@/loaders/teams";
import EventsList, { loader } from "../list";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useOutletContext: jest.fn(),
}));

jest.mock("../components/MobileEvents", () => () => (
    <div data-testid="mobile-events" />
));
jest.mock("../components/DesktopEvents", () => () => (
    <div data-testid="desktop-events" />
));
jest.mock("@/loaders/teams");

describe("EventsList Route", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockLoaderData = {
        userId: "user1",
        teams: {
            managing: [{ $id: "team1", name: "Team 1" }],
            playing: [{ $id: "team2", name: "Team 2" }],
        },
    };

    describe("Loader", () => {
        it("calls getUserTeams and returns formatted data", async () => {
            teamsLoaders.getUserTeams.mockResolvedValue({
                managing: ["t1"],
                playing: ["t2"],
                userId: "u1",
            });

            const request = { url: "http://test.com" };
            const result = await loader({ request });

            expect(teamsLoaders.getUserTeams).toHaveBeenCalledWith({ request });
            expect(result).toEqual({
                userId: "u1",
                teams: { managing: ["t1"], playing: ["t2"] },
            });
        });
    });

    describe("Component", () => {
        it("renders MobileEvents when isDesktop is false", () => {
            useOutletContext.mockReturnValue({ isDesktop: false });
            render(<EventsList loaderData={mockLoaderData} />);
            expect(screen.getByTestId("mobile-events")).toBeInTheDocument();
        });

        it("renders DesktopEvents when isDesktop is true", () => {
            useOutletContext.mockReturnValue({ isDesktop: true });
            render(<EventsList loaderData={mockLoaderData} />);
            expect(screen.getByTestId("desktop-events")).toBeInTheDocument();
        });
    });
});
