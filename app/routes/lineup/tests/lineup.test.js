import { render, screen } from "@/utils/test-utils";
import * as gamesLoaders from "@/loaders/games";
import * as lineupsActions from "@/actions/lineups";
import * as addPlayerAvailability from "@/utils/addPlayerAvailability";
import * as validateLineupUtils from "../utils/validateLineup";

import Lineup, { loader, action } from "../lineup";

// Mock dependencies
jest.mock("react-router", () => ({
    useNavigate: jest.fn(),
    useNavigation: jest.fn(),
    useOutletContext: jest.fn(),
    useParams: jest.fn(),
    useFetcher: jest.fn(),
    Form: ({ children, ...props }) => <form {...props}>{children}</form>,
}));

jest.mock("@/components/BackButton", () => () => <button>Back</button>);

jest.mock("@/loaders/games");
jest.mock("@/actions/lineups");
jest.mock("@/utils/addPlayerAvailability");
jest.mock("../utils/validateLineup");

// Mock child components
jest.mock("../components/LineupContainer", () => () => (
    <div data-testid="lineup-container" />
));
jest.mock("../components/LineupMenu", () => () => (
    <div data-testid="lineup-menu" />
));
jest.mock("../components/LineupValidationMenu", () => () => (
    <div data-testid="lineup-validation-menu" />
));

describe("Lineup Route", () => {
    const mockNavigate = jest.fn();
    const mockNavigation = { state: "idle", formData: null };
    const mockUser = { $id: "user123" };
    const mockParams = { eventId: "evt123" };

    beforeEach(() => {
        jest.clearAllMocks();
        require("react-router").useNavigate.mockReturnValue(mockNavigate);
        require("react-router").useNavigation.mockReturnValue(mockNavigation);
        require("react-router").useOutletContext.mockReturnValue({
            user: mockUser,
        });
        require("react-router").useParams.mockReturnValue(mockParams);

        // Setup default mock returns
        addPlayerAvailability.default.mockReturnValue([]);
        validateLineupUtils.validateLineup.mockReturnValue({});
    });

    const mockLoaderData = {
        game: {
            $id: "game123",
        },
        managerIds: ["user123"], // Current user is manager
        players: [],
        attendance: [],
        teams: [{ id: "team1" }],
        playerChart: [],
        deferredData: {},
    };

    describe("Loader", () => {
        it("calls getEventWithPlayerCharts with correct params", async () => {
            const params = { eventId: "evt123" };
            const request = { url: "http://test.com" };
            await loader({ params, request });
            expect(gamesLoaders.getEventWithPlayerCharts).toHaveBeenCalledWith({
                eventId: "evt123",
                request,
            });
        });
    });

    describe("Action", () => {
        it("handles save-chart action", async () => {
            const formData = new FormData();
            formData.append("_action", "save-chart");
            formData.append("someField", "value");

            await action({
                request: { formData: () => Promise.resolve(formData) },
                params: { eventId: "evt1" },
            });

            expect(lineupsActions.savePlayerChart).toHaveBeenCalledWith({
                eventId: "evt1",
                values: { someField: "value" },
            });
        });

        it("handles finalize-chart action", async () => {
            const formData = new FormData();
            formData.append("_action", "finalize-chart");
            formData.append("someField", "value");

            await action({
                request: { formData: () => Promise.resolve(formData) },
                params: { eventId: "evt1" },
            });

            expect(lineupsActions.savePlayerChart).toHaveBeenCalledWith({
                eventId: "evt1",
                values: { someField: "value" },
                sendNotification: true,
            });
        });
    });

    describe("Component", () => {
        it("renders main components when data is present", () => {
            render(<Lineup loaderData={mockLoaderData} />);

            expect(screen.getByText("Back")).toBeInTheDocument();
            expect(screen.getByTestId("lineup-container")).toBeInTheDocument();

            // Manager view components
            expect(screen.getByTestId("lineup-menu")).toBeInTheDocument();
            expect(
                screen.getByTestId("lineup-validation-menu"),
            ).toBeInTheDocument();
        });

        it("does NOT render manager components for non-managers", () => {
            const nonManagerData = {
                ...mockLoaderData,
                managerIds: ["otherUser"],
            };

            render(<Lineup loaderData={nonManagerData} />);

            expect(screen.getByTestId("lineup-container")).toBeInTheDocument();
            expect(screen.queryByTestId("lineup-menu")).not.toBeInTheDocument();
            expect(
                screen.queryByTestId("lineup-validation-menu"),
            ).not.toBeInTheDocument();
        });

        it("calls validateLineup with correct data", () => {
            const mockChart = [{ $id: "p1" }];
            const dataWithChart = {
                ...mockLoaderData,
                playerChart: mockChart,
            };

            render(<Lineup loaderData={dataWithChart} />);

            expect(validateLineupUtils.validateLineup).toHaveBeenCalledWith(
                mockChart,
                mockLoaderData.teams[0],
            );
        });
    });
});
