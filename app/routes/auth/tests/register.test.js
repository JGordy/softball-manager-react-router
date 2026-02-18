import { useNavigate, useNavigation } from "react-router";
import { screen, cleanup } from "@testing-library/react";

import { render } from "@/utils/test-utils";
import {
    createAdminClient,
    createSessionClientFromSecret,
    serializeSessionCookie,
} from "@/utils/appwrite/server";
import { createDocument } from "@/utils/databases";
import { hasBadWords } from "@/utils/badWordsApi";
import { showNotification } from "@/utils/showNotification";
import { trackEvent, identifyUser } from "@/utils/analytics";

import { redirectIfAuthenticated } from "../utils/redirectIfAuthenticated";
import Register, { loader, action } from "../register";

// Mock react-router
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    redirect: jest.fn((url, init) => ({ status: 302, url, init })),
    data: jest.fn((payload, init) => ({ payload, ...init })),
    useActionData: jest.fn(),
    useNavigate: jest.fn(),
    useNavigation: jest.fn(),
    Form: ({ children, ...props }) => <form {...props}>{children}</form>,
    Link: ({ children, to, ...props }) => (
        <a href={to} {...props}>
            {children}
        </a>
    ),
    useComputedColorScheme: jest.fn(() => "light"),
}));

jest.mock("../utils/redirectIfAuthenticated", () => ({
    redirectIfAuthenticated: jest.fn(),
}));

jest.mock("@/utils/appwrite/server", () => ({
    createAdminClient: jest.fn(),
    createSessionClientFromSecret: jest.fn(),
    serializeSessionCookie: jest.fn(),
}));

jest.mock("@/utils/databases", () => ({
    createDocument: jest.fn(),
}));

jest.mock("@/utils/badWordsApi", () => ({
    hasBadWords: jest.fn(),
}));

jest.mock("@/utils/showNotification", () => ({
    showNotification: jest.fn(),
}));

jest.mock("@/utils/analytics", () => ({
    trackEvent: jest.fn(),
    identifyUser: jest.fn(),
}));

describe("Register Route", () => {
    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    describe("loader", () => {
        it("calls redirectIfAuthenticated", async () => {
            const request = new Request("http://localhost/register");
            await loader({ request });
            expect(redirectIfAuthenticated).toHaveBeenCalledWith(request);
        });
    });

    describe("action", () => {
        it("returns error if fields missing", async () => {
            const formData = new FormData();
            const request = new Request("http://localhost/register", {
                method: "POST",
                body: formData,
            });

            const result = await action({ request });
            expect(result.error).toBe("Email, password and name are required.");
        });

        it("returns error if name has bad words", async () => {
            const formData = new FormData();
            formData.append("email", "test@test.com");
            formData.append("password", "password123");
            formData.append("name", "BadWord");
            const request = new Request("http://localhost/register", {
                method: "POST",
                body: formData,
            });

            hasBadWords.mockResolvedValue(true);

            const result = await action({ request });
            expect(result.error).toBe(
                "Name contains inappropriate language. Please choose a different name.",
            );
        });

        it("registers successfully", async () => {
            const formData = new FormData();
            formData.append("email", "test@test.com");
            formData.append("password", "password123");
            formData.append("name", "John Smith");
            const request = new Request("http://localhost/register", {
                method: "POST",
                body: formData,
            });

            hasBadWords.mockResolvedValue(false);
            const mockAccount = {
                create: jest.fn().mockResolvedValue({ $id: "user1" }),
                createEmailPasswordSession: jest
                    .fn()
                    .mockResolvedValue({ secret: "session-secret" }),
            };
            const mockSessionAccount = {
                createVerification: jest.fn().mockResolvedValue({}),
            };
            createAdminClient.mockReturnValue({ account: mockAccount });
            createSessionClientFromSecret.mockReturnValue({
                account: mockSessionAccount,
            });
            serializeSessionCookie.mockReturnValue("cookie-string");

            const result = await action({ request });

            expect(mockAccount.create).toHaveBeenCalled();
            expect(createDocument).toHaveBeenCalledWith(
                "users",
                "user1",
                expect.any(Object),
            );
            expect(mockSessionAccount.createVerification).toHaveBeenCalled();
            expect(result.headers["Set-Cookie"]).toBe("cookie-string");
            expect(result.payload.success).toBe(true);
        });

        it("returns error if registration fails", async () => {
            const formData = new FormData();
            formData.append("email", "test@test.com");
            formData.append("password", "password123");
            formData.append("name", "John Smith");
            const request = new Request("http://localhost/register", {
                method: "POST",
                body: formData,
            });

            hasBadWords.mockResolvedValue(false);
            const mockAccount = {
                create: jest
                    .fn()
                    .mockRejectedValue(new Error("Registration failed")),
            };
            createAdminClient.mockReturnValue({ account: mockAccount });

            const result = await action({ request });

            expect(result.error).toBe("Registration failed");
        });
    });

    describe("Component", () => {
        const mockNavigate = jest.fn();

        beforeEach(() => {
            useNavigate.mockReturnValue(mockNavigate);
            useNavigation.mockReturnValue({ state: "idle" });
        });

        it("renders registration form", () => {
            render(<Register />);
            expect(
                screen.getByPlaceholderText("Your name"),
            ).toBeInTheDocument();
            expect(
                screen.getByPlaceholderText("youremail@email.com"),
            ).toBeInTheDocument();
            expect(
                screen.getByPlaceholderText("Your password"),
            ).toBeInTheDocument();
            expect(
                screen.getByRole("button", { name: /Register/i }),
            ).toBeInTheDocument();
        });

        it("shows error notification on action error", () => {
            render(<Register actionData={{ error: "Reg Error" }} />);
            expect(showNotification).toHaveBeenCalledWith({
                variant: "error",
                message: "Reg Error",
            });
        });

        it("tracks event and redirects on registration success", () => {
            render(
                <Register actionData={{ success: true, userId: "user1" }} />,
            );
            expect(identifyUser).toHaveBeenCalledWith("user1");
            expect(trackEvent).toHaveBeenCalledWith("registration-success");
            expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
        });
    });
});
