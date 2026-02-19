import { useOutletContext, MemoryRouter } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";

import { createTeam } from "@/actions/teams";
import { getUserTeams } from "@/loaders/teams";
import useModal from "@/hooks/useModal";

import Dashboard, { loader, action } from "../dashboard";

// Mock react-router
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useOutletContext: jest.fn(),
    useNavigation: jest.fn(() => ({ state: "idle" })),
    useFetcher: jest.fn(() => ({
        submit: jest.fn(),
        data: null,
        state: "idle",
    })),
}));

// Mock icons
jest.mock("@tabler/icons-react", () => ({
    IconPlus: () => <div data-testid="icon-plus" />,
}));

// Mock hooks
jest.mock("@/hooks/useModal", () => ({
    __esModule: true,
    default: jest.fn(),
}));

// Mock actions and loaders
jest.mock("@/actions/teams", () => ({
    createTeam: jest.fn(),
}));
jest.mock("@/loaders/teams", () => ({
    getUserTeams: jest.fn(),
}));

// Mock utils
jest.mock("@/utils/getGames", () => ({
    __esModule: true,
    default: jest.fn(() => ({ futureGames: [], pastGames: [] })),
}));

// Mock GameCard
jest.mock("@/components/GameCard", () => ({
    __esModule: true,
    default: ({ game }) => <div data-testid={`game-card-${game.$id}`} />,
}));

// Mock DashboardMenu
jest.mock("../components/DashboardMenu", () => ({
    __esModule: true,
    default: () => <div data-testid="dashboard-menu" />,
}));

describe("Dashboard Route", () => {
    const mockUser = { $id: "user-123", name: "Test User" };
    const mockTeams = {
        managing: [
            { $id: "team-1", name: "Managing Team", primaryColor: "#ff0000" },
        ],
        playing: [
            { $id: "team-2", name: "Playing Team", primaryColor: "#00ff00" },
        ],
        userId: "user-123",
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useOutletContext.mockReturnValue({ user: mockUser });
        useModal.mockReturnValue({
            openModal: jest.fn(),
            closeAllModals: jest.fn(),
        });
    });

    describe("loader", () => {
        it("fetches user teams", async () => {
            getUserTeams.mockResolvedValue(mockTeams);
            const result = await loader({
                request: new Request("http://localhost/"),
            });

            expect(getUserTeams).toHaveBeenCalled();
            expect(result).toEqual({
                teams: {
                    managing: mockTeams.managing,
                    playing: mockTeams.playing,
                },
                userId: "user-123",
            });
        });
    });

    describe("action", () => {
        it("calls createTeam for add-team action", async () => {
            const formData = new FormData();
            formData.append("_action", "add-team");
            formData.append("userId", "user-123");
            formData.append("name", "New Team");

            await action({
                request: new Request("http://localhost/", {
                    method: "POST",
                    body: formData,
                }),
            });

            expect(createTeam).toHaveBeenCalledWith({
                userId: "user-123",
                values: { name: "New Team" },
            });
        });
    });

    describe("Component", () => {
        const renderDashboard = (
            loaderData = { teams: { managing: [], playing: [] } },
        ) => {
            return render(
                <MemoryRouter>
                    <Dashboard loaderData={loaderData} />
                </MemoryRouter>,
            );
        };

        it("renders 'Create your first team' button when no teams exist", () => {
            renderDashboard();
            expect(
                screen.getByText("Create your first team"),
            ).toBeInTheDocument();
        });

        it("renders a single team card when one team exists", () => {
            renderDashboard({
                teams: { managing: [mockTeams.managing[0]], playing: [] },
            });
            expect(screen.getByText("Managing Team")).toBeInTheDocument();
            expect(
                screen.queryByText("Create your first team"),
            ).not.toBeInTheDocument();
        });

        it("renders carousel when multiple teams exist", () => {
            renderDashboard({
                teams: {
                    managing: mockTeams.managing,
                    playing: mockTeams.playing,
                },
            });
            expect(screen.getByText("Managing Team")).toBeInTheDocument();
            expect(screen.getByText("Playing Team")).toBeInTheDocument();
        });

        it("opens add team modal when clicking create button", () => {
            const mockOpenModal = jest.fn();
            useModal.mockReturnValue({
                openModal: mockOpenModal,
                closeAllModals: jest.fn(),
            });

            renderDashboard();
            fireEvent.click(screen.getByText("Create your first team"));

            expect(mockOpenModal).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Add a New Team",
                }),
            );
        });
    });
});
