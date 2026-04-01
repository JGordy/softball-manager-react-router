import { useOutletContext } from "react-router";
import { render, screen } from "@/utils/test-utils";

import * as teamsLoaders from "@/loaders/teams";
import EventsList, { loader } from "../list";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useNavigation: () => ({ state: "idle" }),
    useOutletContext: jest.fn(),
}));

jest.mock("../components/MobileEvents", () => ({ teams }) => (
    <div data-testid="mobile-events">{teams?.managing?.length}</div>
));
jest.mock("../components/DesktopEvents", () => ({ teams }) => (
    <div data-testid="desktop-events">{teams?.managing?.length}</div>
));
jest.mock("@/loaders/teams");
jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn().mockResolvedValue({}),
}));

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
        it("calls getUserTeams with client payload", async () => {
            teamsLoaders.getUserTeams.mockResolvedValue({
                managing: ["t1"],
                playing: ["t2"],
                userId: "u1",
            });
            const request = new Request("http://localhost/events");
            await loader({ request });
            expect(teamsLoaders.getUserTeams).toHaveBeenCalledWith({
                client: expect.any(Object),
            });
        });
        it("calls getUserTeams and returns formatted data", async () => {
            teamsLoaders.getUserTeams.mockResolvedValue({
                managing: ["t1"],
                playing: ["t2"],
                userId: "u1",
            });

            const request = { url: "http://test.com" };
            const result = await loader({ request });

            expect(teamsLoaders.getUserTeams).toHaveBeenCalledWith({
                client: expect.any(Object),
            });
            expect(result).toEqual({
                userId: "u1",
                teams: { managing: ["t1"], playing: ["t2"] },
            });
        });
    });

    describe("Component", () => {
        it("renders MobileEvents with teams when isDesktop is false", () => {
            useOutletContext.mockReturnValue({ isDesktop: false });
            render(<EventsList loaderData={mockLoaderData} />);
            expect(screen.getByTestId("mobile-events")).toBeInTheDocument();
            expect(screen.getByText("1")).toBeInTheDocument(); // length of managing teams
        });

        it("renders DesktopEvents with teams when isDesktop is true", () => {
            useOutletContext.mockReturnValue({ isDesktop: true });
            render(<EventsList loaderData={mockLoaderData} />);
            expect(screen.getByTestId("desktop-events")).toBeInTheDocument();
            expect(screen.getByText("1")).toBeInTheDocument();
        });
    });
});
