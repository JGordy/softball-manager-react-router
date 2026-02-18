import { screen, cleanup } from "@testing-library/react";
import { render } from "@/utils/test-utils";
import UserAvatar from "../UserAvatar";

// Mock the config ensures predictable endpoint
jest.mock("@/utils/appwrite/config", () => ({
    appwriteConfig: {
        endpoint: "https://mock-appwrite.io/v1",
    },
}));

describe("UserAvatar Component", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders user preference avatar URL when available", () => {
        const user = {
            name: "Test User",
            prefs: {
                avatarUrl: "https://example.com/my-avatar.png",
            },
        };
        render(<UserAvatar user={user} />);

        const img = screen.getByRole("img");
        expect(img).toHaveAttribute("src", "https://example.com/my-avatar.png");
        expect(img).toHaveAttribute("alt", "Test User");
    });

    it("generates initials avatar URL using name fallback", () => {
        const user = {
            name: "John Doe",
            prefs: {},
        };
        render(<UserAvatar user={user} size={50} />);

        const img = screen.getByRole("img");
        const expectedUrl = `https://mock-appwrite.io/v1/avatars/initials?name=John%20Doe&width=50&height=50`;
        expect(img).toHaveAttribute("src", expectedUrl);
    });

    it("generates initials avatar using email when name is missing", () => {
        const user = {
            email: "john@example.com",
            prefs: {},
        };
        render(<UserAvatar user={user} />);

        const img = screen.getByRole("img");
        // Check contains part of the URL since query params order is deterministic but safer to verify params
        expect(img.getAttribute("src")).toContain("name=john%40example.com");
    });

    it("defaults to 'User' when no user data provided", () => {
        render(<UserAvatar />);

        const img = screen.getByRole("img");
        expect(img).toHaveAttribute("alt", "User Avatar");
        expect(img.getAttribute("src")).toContain("name=User");
    });

    it("applies custom size styles", () => {
        render(<UserAvatar size={100} />);
        const img = screen.getByRole("img");
        expect(img).toHaveStyle({ width: "100px", height: "100px" });
    });
});
