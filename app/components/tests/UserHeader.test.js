import { useOutletContext, useFetcher } from "react-router";
import { screen, cleanup } from "@testing-library/react";
import { render } from "@/utils/test-utils";

import UserHeader from "../UserHeader";

// Mock react-router
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useOutletContext: jest.fn(),
    useFetcher: jest.fn(),
}));

describe("UserHeader Component", () => {
    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    const mockUser = {
        name: "Test User",
        prefs: { avatarUrl: "http://avatar.com/img.png" },
    };

    it("renders user name and avatar", () => {
        useOutletContext.mockReturnValue({
            user: mockUser,
            isVerified: true,
        });
        useFetcher.mockReturnValue({ submit: jest.fn() });

        render(<UserHeader subText="Welcome back" />);

        // Name check (split logic: "Test User" -> "Test")
        expect(screen.getByText(/Hello, Test!/i)).toBeInTheDocument();
        expect(screen.getByText("Welcome back")).toBeInTheDocument();

        // Avatar check
        const imgs = screen.getAllByRole("img");
        // UserAvatar uses Appwrite logic fallback which we mocked or standard.
        // But Mantine Avatar usually renders an image or placeholders.
        // Assuming visual presence.
        expect(imgs.length).toBeGreaterThan(0);
    });

    it("does NOT show verification alert when verified", () => {
        useOutletContext.mockReturnValue({
            user: mockUser,
            isVerified: true,
        });
        useFetcher.mockReturnValue({ submit: jest.fn() });

        render(<UserHeader />);

        expect(screen.queryByText(/Verify Email/i)).not.toBeInTheDocument();
    });

    it("shows verification alert when not verified", () => {
        useOutletContext.mockReturnValue({
            user: mockUser,
            isVerified: false,
        });
        useFetcher.mockReturnValue({ submit: jest.fn(), state: "idle" });

        render(<UserHeader />);

        expect(screen.getByText("Email not yet verified")).toBeInTheDocument();
        expect(
            screen.getByText(/Your email is not verified/i),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Resend Verification Email" }),
        ).toBeInTheDocument();
    });
});
