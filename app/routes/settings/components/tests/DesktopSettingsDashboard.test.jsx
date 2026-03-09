import { MemoryRouter } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";

import DesktopSettingsDashboard from "../DesktopSettingsDashboard";

const mockTeams = [
    {
        $id: "team1",
        name: "Test Team 1",
    },
];

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    Form: ({ children }) => <form data-testid="mock-form">{children}</form>,
    useOutletContext: () => ({
        user: {
            $id: "user-123",
            email: "test@example.com",
            name: "Test User",
            phone: "15551234567",
        },
        isDesktop: true,
    }),
    useFetcher: () => ({
        submit: jest.fn(),
        data: null,
        state: "idle",
    }),
}));

const mockModal = {
    openModal: jest.fn(),
    closeAllModals: jest.fn(),
};

jest.mock("@/hooks/useModal", () => ({
    __esModule: true,
    default: () => mockModal,
}));

jest.mock("@/context/NotificationsContext", () => ({
    useNotifications: () => ({
        token: "fake-token",
        isSupported: true,
        permission: "granted",
        isSubscribedToTeam: jest.fn(),
        subscribeToTeamInfo: jest.fn(),
        unsubscribeFromTeamInfo: jest.fn(),
    }),
}));

describe("DesktopSettingsDashboard", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders the dashboard layout correctly", () => {
        render(
            <MemoryRouter>
                <DesktopSettingsDashboard teams={mockTeams} />
            </MemoryRouter>,
        );

        expect(
            screen.getByTestId("desktop-settings-dashboard"),
        ).toBeInTheDocument();

        // Card Titles
        expect(screen.getByText("Account Profile")).toBeInTheDocument();
        expect(screen.getByText("Login Options")).toBeInTheDocument();
        expect(screen.getByText("Notifications")).toBeInTheDocument();
        expect(screen.getByText("Resources & Support")).toBeInTheDocument();
    });

    it("opens the update contact modal when pencil icon is clicked", () => {
        render(
            <MemoryRouter>
                <DesktopSettingsDashboard teams={mockTeams} />
            </MemoryRouter>,
        );

        const editButton = screen.getByRole("button", { name: "Edit Profile" });
        fireEvent.click(editButton);

        expect(mockModal.openModal).toHaveBeenCalledWith(
            expect.objectContaining({ title: "Update Contact Information" }),
        );
    });
});
