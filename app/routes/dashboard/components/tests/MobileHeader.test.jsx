import { MemoryRouter } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";
import MobileHeader from "../MobileHeader";

// Mock DashboardMenu
jest.mock("../DashboardMenu", () => ({
    __esModule: true,
    default: () => <div data-testid="dashboard-menu" />,
}));

describe("MobileHeader Component", () => {
    const mockUser = {
        $id: "user-123",
        name: "Joe Dimaggio",
        prefs: { avatarUrl: "https://example.com/avatar.jpg" },
    };

    const mockTeam = {
        $id: "team-1",
        name: "Ormewood Park Sliders",
        primaryColor: "#6B0F1A",
    };

    const mockTeamList = [
        mockTeam,
        { $id: "team-2", name: "Atlanta Braves", primaryColor: "#1d4ed8" },
    ];

    const renderHeader = (props = {}) => {
        return render(
            <MemoryRouter>
                <MobileHeader
                    user={mockUser}
                    isVerified={true}
                    activeTeam={mockTeam}
                    teamList={mockTeamList}
                    userId="user-123"
                    {...props}
                />
            </MemoryRouter>,
        );
    };

    it("renders user avatar and greeting with first name", () => {
        renderHeader();
        expect(screen.getByText("Hello, Joe!")).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: "User Profile" }),
        ).toHaveAttribute("href", "/user/user-123");
    });

    it("renders active team nickname in display typography", () => {
        renderHeader();
        expect(screen.getByText("SLIDERS")).toBeInTheDocument();
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
