import { useActionData, useOutletContext } from "react-router";
import { render, screen } from "@/utils/test-utils";

import { getTeamById } from "@/loaders/teams";
import { saveBattingOrder, saveFieldingPositions } from "@/actions/lineups";
import { trackEvent } from "@/utils/analytics";

import TeamLineup, { loader, action } from "../lineup";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useOutletContext: jest.fn(),
    useActionData: jest.fn(),
}));

jest.mock("@/loaders/teams");
jest.mock("@/actions/lineups");
jest.mock("@/utils/analytics");

jest.mock("../components/TeamLineupContainer", () => () => (
    <div data-testid="lineup-container" />
));
jest.mock("@/components/BackButton", () => ({ text, to }) => (
    <div data-testid="back-button" data-text={text} data-to={to} />
));

describe("TeamLineup Route", () => {
    const mockUser = { $id: "user1" };
    const mockTeam = {
        $id: "team1",
        idealLineup: JSON.stringify({ lineup: ["p1"], reserves: ["p2"] }),
        idealPositioning: JSON.stringify({ P: ["p1"] }),
    };
    const mockPlayers = [
        { $id: "p1", firstName: "Player", lastName: "1" },
        { $id: "p2", firstName: "Player", lastName: "2" },
    ];
    const mockLoaderData = {
        teamData: mockTeam,
        players: mockPlayers,
        managerIds: ["user1"],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useOutletContext.mockReturnValue({ user: mockUser });
        useActionData.mockReturnValue(null);
    });

    describe("loader", () => {
        it("calls getTeamById with correct params", async () => {
            const params = { teamId: "team1" };
            const request = { url: "http://localhost" };
            await loader({ params, request });
            expect(getTeamById).toHaveBeenCalledWith({
                teamId: "team1",
                request,
            });
        });
    });

    describe("action", () => {
        it("calls saveBattingOrder for save-batting-order action", async () => {
            const formData = new FormData();
            formData.append("_action", "save-batting-order");
            formData.append("idealLineup", JSON.stringify({ lineup: ["p1"] }));
            const request = { formData: () => Promise.resolve(formData) };
            const params = { teamId: "team1" };

            await action({ request, params });
            expect(saveBattingOrder).toHaveBeenCalledWith({
                teamId: "team1",
                values: { idealLineup: JSON.stringify({ lineup: ["p1"] }) },
            });
        });

        it("calls saveFieldingPositions for save-fielding-positions action", async () => {
            const formData = new FormData();
            formData.append("_action", "save-fielding-positions");
            formData.append("idealPositioning", JSON.stringify({ P: ["p1"] }));
            const request = { formData: () => Promise.resolve(formData) };
            const params = { teamId: "team1" };

            await action({ request, params });
            expect(saveFieldingPositions).toHaveBeenCalledWith({
                teamId: "team1",
                values: { idealPositioning: JSON.stringify({ P: ["p1"] }) },
            });
        });
    });

    describe("Component", () => {
        it("renders back button and container", () => {
            render(<TeamLineup loaderData={mockLoaderData} />);

            const backButton = screen.getByTestId("back-button");
            expect(backButton).toBeInTheDocument();
            expect(backButton).toHaveAttribute("data-to", "/team/team1");
            expect(screen.getByTestId("lineup-container")).toBeInTheDocument();
        });

        it("tracks event when actionData indicates success", () => {
            useActionData.mockReturnValue({
                success: true,
                event: { name: "test-event", data: { foo: "bar" } },
            });

            render(<TeamLineup loaderData={mockLoaderData} />);

            expect(trackEvent).toHaveBeenCalledWith("test-event", {
                foo: "bar",
            });
        });

        it("parses empty or invalid idealLineup correctly", () => {
            const emptyLoaderData = {
                ...mockLoaderData,
                teamData: { ...mockTeam, idealLineup: null },
            };
            render(<TeamLineup loaderData={emptyLoaderData} />);
            expect(screen.getByTestId("lineup-container")).toBeInTheDocument();
        });
    });
});
