import { render, screen, fireEvent } from "@/utils/test-utils";

import * as gamesActions from "@/actions/games";
import * as attendanceActions from "@/actions/attendance";
import * as awardsActions from "@/actions/awards";
import * as gamesLoaders from "@/loaders/games";
import * as dateTimeUtils from "@/utils/dateTime";
import * as modalHooks from "@/hooks/useModal";

import EventDetails, { loader, action } from "../details";

// Mock dependencies
jest.mock("react-router", () => ({
    useNavigate: jest.fn(),
    useNavigation: jest.fn(),
    useOutletContext: jest.fn(),
    Form: ({ children, ...props }) => <form {...props}>{children}</form>,
}));

jest.mock("@/components/BackButton", () => () => <button>Back</button>);
jest.mock(
    "@/components/DrawerContainer",
    () =>
        ({ children, opened, title }) =>
            opened ? (
                <div role="dialog" aria-label={title}>
                    {children}
                </div>
            ) : null,
);

jest.mock("@/actions/games");
jest.mock("@/actions/attendance");
jest.mock("@/actions/awards");
jest.mock("@/loaders/games");
jest.mock("@/utils/dateTime");
jest.mock("@/hooks/useModal");

// Mock child components
jest.mock("../components/AwardsContainer", () => () => (
    <div data-testid="awards-container" />
));
jest.mock("../components/DetailsCard", () => () => (
    <div data-testid="details-card" />
));
jest.mock("../components/GameMenu", () => ({ openDeleteDrawer }) => (
    <button onClick={openDeleteDrawer}>Open Delete Drawer</button>
));
jest.mock("../components/RosterDetails", () => () => (
    <div data-testid="roster-details" />
));
jest.mock("../components/Scoreboard", () => () => (
    <div data-testid="scoreboard" />
));
jest.mock("../components/WeatherCard", () => () => (
    <div data-testid="weather-card" />
));
jest.mock("../components/GamedayCard", () => () => (
    <div data-testid="gameday-card" />
));

describe("EventDetails Route", () => {
    const mockNavigate = jest.fn();
    const mockNavigation = { state: "idle", formData: null };
    const mockUser = { $id: "user123" };
    const mockCloseAllModals = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        require("react-router").useNavigate.mockReturnValue(mockNavigate);
        require("react-router").useNavigation.mockReturnValue(mockNavigation);
        require("react-router").useOutletContext.mockReturnValue({
            user: mockUser,
        });
        modalHooks.default.mockReturnValue({
            closeAllModals: mockCloseAllModals,
        });
        dateTimeUtils.getGameDayStatus.mockReturnValue("upcoming");
    });

    const mockLoaderData = {
        game: {
            $id: "game123",
            gameDate: "2023-01-01",
            result: "W",
            playerChart: {},
        },
        deferredData: {},
        managerIds: ["user123"], // Current user is manager
        scorekeeperIds: [],
        season: { id: "season1" },
        teams: [{ id: "team1" }],
        weatherPromise: Promise.resolve({}),
    };

    describe("Loader", () => {
        it("calls getEventById with correct params", async () => {
            const params = { eventId: "evt123" };
            const request = { url: "http://test.com" };
            await loader({ params, request });
            expect(gamesLoaders.getEventById).toHaveBeenCalledWith({
                eventId: "evt123",
                request,
            });
        });
    });

    describe("Action", () => {
        it("handles update-game action", async () => {
            const formData = new FormData();
            formData.append("_action", "update-game");
            formData.append("someField", "value");

            await action({
                request: { formData: () => Promise.resolve(formData) },
                params: { eventId: "evt1" },
            });

            expect(gamesActions.updateGame).toHaveBeenCalledWith({
                eventId: "evt1",
                values: { someField: "value" },
            });
        });

        it("handles delete-game action", async () => {
            const formData = new FormData();
            formData.append("_action", "delete-game");

            await action({
                request: { formData: () => Promise.resolve(formData) },
                params: { eventId: "evt1" },
            });

            expect(gamesActions.deleteGame).toHaveBeenCalledWith({
                eventId: "evt1",
                values: {},
            });
        });

        it("handles update-attendance action", async () => {
            const formData = new FormData();
            formData.append("_action", "update-attendance");

            await action({
                request: { formData: () => Promise.resolve(formData) },
                params: { eventId: "evt1" },
            });

            expect(
                attendanceActions.updatePlayerAttendance,
            ).toHaveBeenCalledWith({
                eventId: "evt1",
                values: {},
            });
        });

        it("handles send-votes action", async () => {
            const formData = new FormData();
            formData.append("_action", "send-votes");

            await action({
                request: { formData: () => Promise.resolve(formData) },
                params: { eventId: "evt1" },
            });

            expect(awardsActions.sendAwardVotes).toHaveBeenCalledWith({
                eventId: "evt1",
                values: {},
            });
        });
    });

    describe("Component", () => {
        it("renders 'Game Not Found' if gameDeleted is true", () => {
            render(<EventDetails loaderData={{ gameDeleted: true }} />);
            expect(screen.getByText("Game Not Found")).toBeInTheDocument();
            expect(screen.queryByTestId("scoreboard")).not.toBeInTheDocument();
        });

        it("renders main components when data is present", () => {
            render(<EventDetails loaderData={mockLoaderData} />);

            expect(screen.getByText("Back")).toBeInTheDocument();
            expect(screen.getByTestId("scoreboard")).toBeInTheDocument();
            expect(screen.getByTestId("details-card")).toBeInTheDocument();
            expect(screen.getByTestId("gameday-card")).toBeInTheDocument();
            expect(screen.getByTestId("roster-details")).toBeInTheDocument();
            // Since game is upcoming (default mock), rendering WeatherCard
            expect(screen.getByTestId("weather-card")).toBeInTheDocument();
        });

        it("renders AwardsContainer instead of WeatherCard if game is past", () => {
            dateTimeUtils.getGameDayStatus.mockReturnValue("past");
            render(<EventDetails loaderData={mockLoaderData} />);

            expect(screen.getByTestId("awards-container")).toBeInTheDocument();
            expect(
                screen.queryByTestId("weather-card"),
            ).not.toBeInTheDocument();
        });

        it("renders GameMenu and Delete Drawer only for managers", () => {
            render(<EventDetails loaderData={mockLoaderData} />); // User is manager
            expect(screen.getByText("Open Delete Drawer")).toBeInTheDocument();
        });

        it("does NOT render GameMenu for non-managers", () => {
            const nonManagerData = {
                ...mockLoaderData,
                managerIds: ["otherUser"],
            };
            render(<EventDetails loaderData={nonManagerData} />);
            expect(
                screen.queryByText("Open Delete Drawer"),
            ).not.toBeInTheDocument();
        });

        it("handles delete drawer interaction", async () => {
            render(<EventDetails loaderData={mockLoaderData} />);

            // Drawer closed initially
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

            // Open drawer
            fireEvent.click(screen.getByText("Open Delete Drawer"));
            expect(
                screen.getByRole("dialog", { name: "Delete Game" }),
            ).toBeInTheDocument();
            expect(
                screen.getByText(/Are you sure you want to delete this game/),
            ).toBeInTheDocument();
        });

        it("handles successful action completion (close modals)", () => {
            const { rerender } = render(
                <EventDetails loaderData={mockLoaderData} actionData={null} />,
            );

            // Simulate action success response
            rerender(
                <EventDetails
                    loaderData={mockLoaderData}
                    actionData={{ success: true }}
                />,
            );

            expect(mockCloseAllModals).toHaveBeenCalled();
            expect(mockNavigate).not.toHaveBeenCalled(); // Not deleted, just success
        });

        it("handles delete action completion (navigate back)", () => {
            const { rerender } = render(
                <EventDetails loaderData={mockLoaderData} actionData={null} />,
            );

            rerender(
                <EventDetails
                    loaderData={mockLoaderData}
                    actionData={{ success: true, deleted: true }}
                />,
            );

            expect(mockCloseAllModals).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith(-1);
        });
    });
});
