import { screen, cleanup } from "@testing-library/react";
import { render } from "@/utils/test-utils";
import PersonalDetails from "../PersonalDetails";

// Mock matchMedia for useMediaQuery hook
beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(), // Deprecated
            removeListener: jest.fn(), // Deprecated
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    });
});

describe("PersonalDetails Component", () => {
    afterEach(() => {
        cleanup();
    });

    const mockPlayer = {
        $id: "p1",
        email: "player@example.com",
        phoneNumber: "123-456-7890",
        gender: "Male",
        walkUpSong: "My Song",
    };

    const mockUser = {
        $id: "u1", // different from player
    };

    it("renders player details correctly", () => {
        render(
            <PersonalDetails
                player={mockPlayer}
                user={mockUser}
                managerView={true}
            />,
        );

        expect(screen.getByText(mockPlayer.email)).toBeInTheDocument();
        expect(screen.getByText(mockPlayer.phoneNumber)).toBeInTheDocument();
    });

    it("shows warning for missing email", () => {
        const incompletePlayer = { ...mockPlayer, email: "" };
        render(
            <PersonalDetails
                player={incompletePlayer}
                user={mockUser}
                managerView={true}
            />,
        );

        expect(screen.getByText(/email not listed/i)).toBeInTheDocument();
    });

    it("shows action buttons for non-current-user when contact info exists", () => {
        render(
            <PersonalDetails
                player={mockPlayer}
                user={mockUser}
                managerView={true}
            />,
        );

        // We look for the anchor action buttons (mailto / tel)
        // Mantine ActionIcons rendered as 'a' tags
        // Using querySelector to find href attributes is easiest given structure
        // Or getByRole usually 'link' if component="a" is properly handled by JSDOM

        // It's rendered as <ActionIcon component="a" href="...">
        const links = screen.getAllByRole("link");
        expect(
            links.some(
                (link) =>
                    link.getAttribute("href") === `mailto:${mockPlayer.email}`,
            ),
        ).toBe(true);
    });

    it("shows phone link on touch devices", () => {
        // Override matchMedia to simulate touch
        const originalMatchMedia = window.matchMedia;

        try {
            window.matchMedia = jest.fn().mockImplementation((query) => ({
                matches:
                    query.includes("hover: none") ||
                    query.includes("pointer: coarse"),
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            }));

            render(
                <PersonalDetails
                    player={mockPlayer}
                    user={mockUser}
                    managerView={true}
                />,
            );

            const links = screen.getAllByRole("link");
            expect(
                links.some(
                    (link) =>
                        link.getAttribute("href") ===
                        `tel:${mockPlayer.phoneNumber}`,
                ),
            ).toBe(true);
        } finally {
            // Restore matchMedia
            window.matchMedia = originalMatchMedia;
        }
    });

    it("does NOT show action buttons for current user viewing their own profile", () => {
        const currentUser = { $id: "p1" };
        render(<PersonalDetails player={mockPlayer} user={currentUser} />);

        const links = screen.queryAllByRole("link");
        // Should only be 0 relevant links. (Might be others on page if full app, but unit test is isolated)
        expect(links.length).toBe(0);
    });
});
