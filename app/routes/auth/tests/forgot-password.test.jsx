import { useActionData } from "react-router";

import { render, screen, cleanup } from "@/utils/test-utils";
import { createAdminClient } from "@/utils/appwrite/server";

import { redirectIfAuthenticated } from "../utils/redirectIfAuthenticated";
import ForgotPassword, { loader, action } from "../forgot-password";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useActionData: jest.fn(),
    Form: ({ children, ...props }) => <form {...props}>{children}</form>,
    Link: ({ children, to, ...props }) => (
        <a href={to} {...props}>
            {children}
        </a>
    ),
}));

jest.mock("../utils/redirectIfAuthenticated", () => ({
    redirectIfAuthenticated: jest.fn(),
}));

jest.mock("@/utils/appwrite/server", () => ({
    createAdminClient: jest.fn(),
}));

jest.mock("@/utils/analytics", () => ({
    trackEvent: jest.fn(),
}));

describe("Forgot Password Route", () => {
    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    describe("loader", () => {
        it("calls redirectIfAuthenticated", async () => {
            const request = new Request("http://localhost/forgot-password");
            await loader({ request });
            expect(redirectIfAuthenticated).toHaveBeenCalledWith(request);
        });
    });

    describe("action", () => {
        it("returns error if email missing", async () => {
            const formData = new FormData();
            const request = new Request("http://localhost/forgot-password", {
                method: "POST",
                body: formData,
            });

            const result = await action({ request });
            expect(result.success).toBe(false);
            expect(result.message).toBe("Email is required");
        });

        it("sends recovery email successfully", async () => {
            const formData = new FormData();
            formData.append("email", "test@test.com");
            const request = new Request("http://localhost/forgot-password", {
                method: "POST",
                body: formData,
            });

            const mockAccount = {
                createRecovery: jest.fn().mockResolvedValue({}),
            };
            createAdminClient.mockReturnValue({ account: mockAccount });

            const result = await action({ request });

            expect(mockAccount.createRecovery).toHaveBeenCalledWith(
                "test@test.com",
                "http://localhost/recovery",
            );
            expect(result.success).toBe(true);
            expect(result.message).toContain("recovery link has been sent");
        });

        it("returns error message on Appwrite failure", async () => {
            const formData = new FormData();
            formData.append("email", "test@test.com");
            const request = new Request("http://localhost/forgot-password", {
                method: "POST",
                body: formData,
            });

            const mockAccount = {
                createRecovery: jest
                    .fn()
                    .mockRejectedValue(new Error("Email not found")),
            };
            createAdminClient.mockReturnValue({ account: mockAccount });

            const result = await action({ request });
            expect(result.success).toBe(false);
            expect(result.message).toBe("Email not found");
        });
    });

    describe("Component", () => {
        it("renders form", () => {
            render(<ForgotPassword />);
            expect(screen.getByText("Forgot Password?")).toBeInTheDocument();
            expect(
                screen.getByRole("button", { name: /Send Reset Link/i }),
            ).toBeInTheDocument();
        });

        it("shows success alert", () => {
            useActionData.mockReturnValue({
                success: true,
                message: "Check your email",
            });
            render(<ForgotPassword />);
            expect(screen.getByText("Email Sent")).toBeInTheDocument();
            expect(screen.getByText("Check your email")).toBeInTheDocument();
        });

        it("shows error alert", () => {
            useActionData.mockReturnValue({
                success: false,
                message: "Error Occurred",
            });
            render(<ForgotPassword />);
            expect(screen.getByText("Error Occurred")).toBeInTheDocument();
        });
    });
});
