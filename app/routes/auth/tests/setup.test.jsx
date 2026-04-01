import { useActionData, useNavigation } from "react-router";

import { render, screen, cleanup } from "@/utils/test-utils";
import { getCurrentUser, getAppwriteClient } from "@/utils/appwrite/context";
import { showNotification } from "@/utils/showNotification";

import Setup, { loader, action } from "../setup";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    redirect: jest.fn((url) => ({ status: 302, url })),
    useActionData: jest.fn(),
    useNavigation: jest.fn(),
    Form: ({ children, ...props }) => <form {...props}>{children}</form>,
}));

jest.mock("@/utils/appwrite/context", () => ({
    getCurrentUser: jest.fn(),
    getAppwriteClient: jest.fn(),
}));

jest.mock("@/utils/showNotification", () => ({
    showNotification: jest.fn(),
}));

describe("Setup Route", () => {
    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    describe("loader", () => {
        it("redirects to /login if no user", async () => {
            getCurrentUser.mockResolvedValue(null);
            const result = await loader({ request: {} });
            expect(result.url).toBe("/login");
        });

        it("redirects to /dashboard if profile complete", async () => {
            getCurrentUser.mockResolvedValue({ name: "John Doe" });
            const result = await loader({ request: {} });
            expect(result.url).toBe("/dashboard");
        });

        it("allows access to setup page if profile is incomplete (name is 'User')", async () => {
            /**
             * The loader decides whether to:
             * 1. Redirect to /login (if not logged in)
             * 2. Redirect to /dashboard (if the profile is already complete)
             * 3. Return the user data (if the profile is incomplete)
             *
             * This test confirms that for an incomplete profile, the loader does not
             * redirect and instead returns the user object to render the onboarding form.
             */
            const user = { name: "User" };
            getCurrentUser.mockResolvedValue(user);

            const result = await loader({ request: {} });

            expect(result.user).toBe(user);
        });
    });

    describe("action", () => {
        it("returns error if name is missing", async () => {
            const formData = new FormData();
            const result = await action({
                request: { formData: async () => formData },
            });
            expect(result.error).toBe("Name is required.");
        });

        it("updates name and redirects to /dashboard", async () => {
            const formData = new FormData();
            formData.append("name", "John Smith");
            const mockAccount = { updateName: jest.fn().mockResolvedValue({}) };
            getAppwriteClient.mockReturnValue({ account: mockAccount });

            const result = await action({
                request: { formData: async () => formData },
            });

            expect(mockAccount.updateName).toHaveBeenCalledWith("John Smith");
            expect(result.url).toBe("/dashboard");
        });

        it("returns error and does not redirect if updateName fails", async () => {
            const formData = new FormData();
            formData.append("name", "John Smith");
            const mockAccount = {
                updateName: jest
                    .fn()
                    .mockRejectedValue(new Error("Update failed")),
            };
            getAppwriteClient.mockReturnValue({ account: mockAccount });

            const result = await action({
                request: { formData: async () => formData },
            });

            expect(mockAccount.updateName).toHaveBeenCalledWith("John Smith");
            expect(result.error).toBeDefined();
            expect(result.url).toBeUndefined();
        });
    });

    describe("Component", () => {
        beforeEach(() => {
            useNavigation.mockReturnValue({ state: "idle" });
        });

        it("renders setup form", () => {
            render(<Setup />);
            expect(
                screen.getByText("Complete Your Profile"),
            ).toBeInTheDocument();
            expect(
                screen.getByPlaceholderText("e.g. John Smith"),
            ).toBeInTheDocument();
        });

        it("shows error notification on action error", () => {
            useActionData.mockReturnValue({ error: "Update Failed" });
            render(<Setup />);
            expect(showNotification).toHaveBeenCalledWith({
                variant: "error",
                message: "Update Failed",
            });
        });
    });
});
