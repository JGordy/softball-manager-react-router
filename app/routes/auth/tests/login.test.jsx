import { useActionData } from "react-router";

import { render, screen, cleanup } from "@/utils/test-utils";
import {
    createAdminClient,
    serializeSessionCookie,
} from "@/utils/appwrite/server";
import { showNotification } from "@/utils/showNotification";

import { redirectIfAuthenticated } from "../utils/redirectIfAuthenticated";
import Login, { loader, action } from "../login";

// Mock react-router
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    redirect: jest.fn((url, init) => ({ status: 302, url, init })),
    useActionData: jest.fn(),
    useNavigation: jest.fn(() => ({ state: "idle" })),
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
    serializeSessionCookie: jest.fn(),
}));

jest.mock("@/utils/showNotification", () => ({
    showNotification: jest.fn(),
}));

jest.mock("@/utils/analytics", () => ({
    trackEvent: jest.fn(),
}));

describe("Login Route", () => {
    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    describe("loader", () => {
        it("redirects if already authenticated", async () => {
            const mockRedirect = { status: 302, url: "/" };
            redirectIfAuthenticated.mockResolvedValue(mockRedirect);

            const result = await loader({
                request: new Request("http://localhost/login"),
            });
            expect(result).toBe(mockRedirect);
        });

        it("returns mapped error message from URL", async () => {
            redirectIfAuthenticated.mockResolvedValue(null);
            const request = new Request(
                "http://localhost/login?error=auth_failure",
            );

            const result = await loader({ request });
            expect(result.urlError).toBe(
                "Authentication failed. Please try again.",
            );
        });

        it("returns generic error if not in mapping", async () => {
            redirectIfAuthenticated.mockResolvedValue(null);
            const request = new Request(
                "http://localhost/login?error=something_else",
            );

            const result = await loader({ request });
            expect(result.urlError).toBe("something_else");
        });
    });

    describe("action", () => {
        it("returns error if email or password missing", async () => {
            const formData = new FormData();
            const request = new Request("http://localhost/login", {
                method: "POST",
                body: formData,
            });

            const result = await action({ request });
            expect(result.error).toBe("Email and password are required");
        });

        it("logs in successfully and redirects with cookie", async () => {
            const formData = new FormData();
            formData.append("email", "test@test.com");
            formData.append("password", "password123");
            const request = new Request("http://localhost/login", {
                method: "POST",
                body: formData,
            });

            const mockAccount = {
                createEmailPasswordSession: jest
                    .fn()
                    .mockResolvedValue({ secret: "session-secret" }),
            };
            createAdminClient.mockReturnValue({ account: mockAccount });
            serializeSessionCookie.mockReturnValue(
                "appwrite-session=session-secret; Path=/",
            );

            const result = await action({ request });

            expect(mockAccount.createEmailPasswordSession).toHaveBeenCalledWith(
                "test@test.com",
                "password123",
            );
            expect(result.url).toBe("/dashboard");
            expect(result.init.headers["Set-Cookie"]).toBe(
                "appwrite-session=session-secret; Path=/",
            );
        });

        it("returns error message on login failure", async () => {
            const formData = new FormData();
            formData.append("email", "test@test.com");
            formData.append("password", "wrong");
            const request = new Request("http://localhost/login", {
                method: "POST",
                body: formData,
            });

            const mockAccount = {
                createEmailPasswordSession: jest
                    .fn()
                    .mockRejectedValue(new Error("Invalid credentials")),
            };
            createAdminClient.mockReturnValue({ account: mockAccount });

            const result = await action({ request });
            expect(result.error).toBe("Invalid credentials");
        });
    });

    describe("Component", () => {
        it("renders login form", () => {
            render(<Login loaderData={{}} />);
            expect(
                screen.getByPlaceholderText("youremail@email.com"),
            ).toBeInTheDocument();
            expect(
                screen.getByPlaceholderText("Your password"),
            ).toBeInTheDocument();
            expect(
                screen.getByRole("button", { name: /Login/i }),
            ).toBeInTheDocument();
        });

        it("shows error from loaderData", () => {
            render(<Login loaderData={{ urlError: "Loader Error" }} />);
            expect(showNotification).toHaveBeenCalledWith({
                variant: "error",
                message: "Loader Error",
            });
            expect(screen.getByText("Loader Error")).toBeInTheDocument();
        });

        it("shows error from actionData", () => {
            useActionData.mockReturnValue({ error: "Action Error" });
            render(<Login loaderData={{}} />);
            expect(showNotification).toHaveBeenCalledWith({
                variant: "error",
                message: "Action Error",
            });
            expect(screen.getByText("Action Error")).toBeInTheDocument();
        });
    });
});
