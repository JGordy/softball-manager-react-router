import { screen, cleanup } from "@testing-library/react";
import { render } from "@/utils/test-utils";
import UserAvatar from "./UserAvatar";

jest.mock("@/utils/appwrite/client", () => ({
    client: {
        config: {
            endpoint: "https://mock-appwrite.io/v1",
            project: "mock-project",
        },
    },
    avatars: {
        getPhoto: jest.fn((params) => {
            const query = new URLSearchParams(
                Object.entries(params).map(([k, v]) => [k, String(v)]),
            ).toString();
            return `https://mock-appwrite.io/v1/avatars/photo?${query}`;
        }),
    },
}));

describe("UserAvatar Component", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders Appwrite getPhoto URL using userId when available", () => {
        const user = {
            $id: "user-123",
            name: "Test User",
        };
        render(<UserAvatar user={user} />);

        const img = screen.getByRole("img");
        expect(img).toHaveAttribute(
            "src",
            "https://mock-appwrite.io/v1/avatars/photo?width=80&height=80&userId=user-123&name=Test+User",
        );
        expect(img).toHaveAttribute("alt", "Test User");
    });

    it("uses name fallback when userId is missing", () => {
        const user = {
            name: "John Doe",
        };
        render(<UserAvatar user={user} size={50} />);

        const img = screen.getByRole("img");
        expect(img).toHaveAttribute(
            "src",
            "https://mock-appwrite.io/v1/avatars/photo?width=100&height=100&name=John+Doe",
        );
    });

    it("uses email when name and userId are missing", () => {
        const user = {
            email: "john@example.com",
        };
        render(<UserAvatar user={user} />);

        const img = screen.getByRole("img");
        expect(img.getAttribute("src")).toContain("name=john%40example.com");
    });

    it("defaults to 'User' when no user data provided", () => {
        render(<UserAvatar />);

        const img = screen.getByRole("img");
        expect(img).toHaveAttribute("alt", "User Avatar");
        expect(img.getAttribute("src")).toContain("name=User");
    });

    it("applies custom size", () => {
        render(<UserAvatar size={100} />);
        const img = screen.getByRole("img");
        expect(img.getAttribute("src")).toContain("width=200");
    });
});
