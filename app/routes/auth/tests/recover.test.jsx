import { useActionData, useNavigate, useSearchParams } from "react-router";

import { render, screen, cleanup, waitFor } from "@/utils/test-utils";
import { createAdminClient } from "@/utils/appwrite/server";

import Recover, { action } from "../recover";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useActionData: jest.fn(),
    useNavigate: jest.fn(),
    useSearchParams: jest.fn(),
    useSubmit: jest.fn(),
    Form: ({ children, ...props }) => <form {...props}>{children}</form>,
}));

jest.mock("@/utils/appwrite/server", () => ({
    createAdminClient: jest.fn(),
}));

describe("Recover Route", () => {
    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    describe("action", () => {
        it("returns error if passwords don't match", async () => {
            const formData = new FormData();
            formData.append("newPassword", "pass1");
            formData.append("confirmPassword", "pass2");
            const request = new Request("http://localhost/recovery", {
                method: "POST",
                body: formData,
            });

            const result = await action({ request });
            expect(result.success).toBe(false);
            expect(result.message).toBe("Passwords do not match");
        });

        it("updates password successfully", async () => {
            const formData = new FormData();
            formData.append("userId", "user1");
            formData.append("secret", "secret123");
            formData.append("newPassword", "newpass123");
            formData.append("confirmPassword", "newpass123");
            const request = new Request("http://localhost/recovery", {
                method: "POST",
                body: formData,
            });

            const mockAccount = {
                updateRecovery: jest.fn().mockResolvedValue({}),
            };
            createAdminClient.mockReturnValue({ account: mockAccount });

            const result = await action({ request });

            expect(mockAccount.updateRecovery).toHaveBeenCalledWith(
                "user1",
                "secret123",
                "newpass123",
            );
            expect(result.success).toBe(true);
        });
    });

    describe("Component", () => {
        const mockNavigate = jest.fn();

        beforeEach(() => {
            useNavigate.mockReturnValue(mockNavigate);
            useSearchParams.mockReturnValue([
                new URLSearchParams("userId=user1&secret=secret123"),
            ]);
        });

        it("renders form when params present", () => {
            render(<Recover />);
            expect(
                screen.getByText("Create a new password"),
            ).toBeInTheDocument();
            // Using text search as label search can be tricky with Mantine's required asterisk
            expect(screen.getByText(/New Password/)).toBeInTheDocument();
            expect(screen.getByText(/Confirm Password/)).toBeInTheDocument();
        });

        it("shows invalid link message when params missing", () => {
            useSearchParams.mockReturnValue([new URLSearchParams("")]);
            render(<Recover />);
            expect(
                screen.getByText(
                    "You have reached an invalid password reset link.",
                ),
            ).toBeInTheDocument();
        });

        it("redirects to login on success", async () => {
            jest.useFakeTimers();
            useActionData.mockReturnValue({
                success: true,
                message: "Success",
            });
            render(<Recover />);

            jest.advanceTimersByTime(2500);
            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith("/login");
            });
        });
    });
});
