import { MemoryRouter } from "react-router";
import { ModalsProvider } from "@mantine/modals";
import { render, screen, fireEvent } from "@/utils/test-utils";
import MobileHeader from "../MobileHeader";

// Mock DashboardMenu
jest.mock("../DashboardMenu", () => ({
    __esModule: true,
    default: () => <div data-testid="dashboard-menu" />,
}));

jest.mock("@/utils/avatars", () => ({
    getUserPhotoUrl: jest.fn(({ userId }) =>
        userId ? `https://mock-appwrite.io/avatars/${userId}` : undefined,
    ),
}));

describe("MobileHeader Component", () => {
    const mockUser = {
        $id: "user-123",
        name: "Joe Dimaggio",
    };

    const mockTeamList = [
        {
            $id: "team-1",
            name: "Ormewood Park Sliders",
            primaryColor: "#6B0F1A",
        },
        { $id: "team-2", name: "Atlanta Braves", primaryColor: "#1d4ed8" },
    ];

    const renderHeader = (props = {}) => {
        return render(
            <ModalsProvider>
                <MemoryRouter>
                    <MobileHeader
                        user={mockUser}
                        teamList={mockTeamList}
                        userId="user-123"
                        {...props}
                    />
                </MemoryRouter>
            </ModalsProvider>,
        );
    };

    it("renders user avatar linking to user profile", () => {
        renderHeader();
        expect(
            screen.getByRole("link", { name: "User Profile" }),
        ).toHaveAttribute("href", "/user/user-123");
        const avatarImg = screen.getByAltText("Joe Dimaggio");
        expect(avatarImg).toHaveAttribute(
            "src",
            "https://mock-appwrite.io/avatars/user-123",
        );
    });

    it("renders RostrHQ branding logo in the center", () => {
        renderHeader();
        const brandingImg = screen.getByRole("img", { name: "RostrHQ" });
        expect(brandingImg).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "RostrHQ" })).toHaveAttribute(
            "href",
            "/dashboard",
        );
    });

    it("opens team search modal when search button is clicked", () => {
        renderHeader();
        const searchBtn = screen.getByRole("button", { name: "Search teams" });
        fireEvent.click(searchBtn);

        expect(screen.getByText("Find Team")).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText("Search teams..."),
        ).toBeInTheDocument();
    });
});
