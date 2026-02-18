import { useNavigate, useSearchParams } from "react-router";
import { render, screen, waitFor } from "@/utils/test-utils";

import { useNotifications } from "@/hooks/useNotifications";
import {
    acceptTeamInvitation,
    setPasswordForInvitedUser,
} from "@/actions/invitations";

import AcceptInvite, { action, clientAction } from "../accept-invite";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useNavigate: jest.fn(),
    useSearchParams: jest.fn(),
    Form: ({ children, onSubmit, ...props }) => (
        <form {...props} onSubmit={onSubmit}>
            {children}
        </form>
    ),
}));

jest.mock("@/actions/invitations");
jest.mock("@/hooks/useNotifications");
jest.mock("@/utils/showNotification");

describe("AcceptInvite Route", () => {
    const mockNavigate = jest.fn();
    const mockSubscribeToTeam = jest.fn().mockResolvedValue({});
    const mockSearchParams = new URLSearchParams({
        userId: "user123",
        secret: "secret123",
        membershipId: "mem123",
    });

    beforeEach(() => {
        jest.clearAllMocks();
        useNavigate.mockReturnValue(mockNavigate);
        useSearchParams.mockReturnValue([mockSearchParams]);
        useNotifications.mockReturnValue({
            pushTargetId: "push123",
            subscribeToTeam: mockSubscribeToTeam,
        });

        // Mock document.getElementById().requestSubmit()
        document.getElementById = jest.fn().mockReturnValue({
            requestSubmit: jest.fn(),
        });
    });

    describe("action", () => {
        it("calls setPasswordForInvitedUser for set-password action", async () => {
            const formData = new FormData();
            formData.append("_action", "set-password");
            formData.append("password", "newpassword123");
            formData.append("userId", "user123");
            formData.append("email", "test@test.com");
            formData.append("name", "Test User");

            const request = { formData: () => Promise.resolve(formData) };
            await action({ request });

            expect(setPasswordForInvitedUser).toHaveBeenCalledWith({
                userId: "user123",
                email: "test@test.com",
                password: "newpassword123",
                name: "Test User",
            });
        });

        it("returns error for unknown action", async () => {
            const formData = new FormData();
            formData.append("_action", "invalid");
            const request = { formData: () => Promise.resolve(formData) };
            const result = await action({ request });
            expect(result).toEqual({
                success: false,
                message: "Unknown action",
            });
        });
    });

    describe("clientAction", () => {
        it("calls acceptTeamInvitation and returns event on success", async () => {
            const formData = new FormData();
            formData.append("_action", "accept-invite");
            formData.append("membershipId", "mem123");
            formData.append("userId", "user123");
            formData.append("secret", "secret123");

            const request = {
                clone: () => ({
                    formData: () => Promise.resolve(formData),
                }),
                formData: () => Promise.resolve(formData),
            };
            const params = { teamId: "team123" };

            acceptTeamInvitation.mockResolvedValue({ success: true });

            const result = await clientAction({ request, params });

            expect(acceptTeamInvitation).toHaveBeenCalledWith({
                teamId: "team123",
                membershipId: "mem123",
                userId: "user123",
                secret: "secret123",
            });
            expect(result.event.name).toBe("invite-accepted");
        });

        it("calls serverAction for other actions", async () => {
            const formData = new FormData();
            formData.append("_action", "set-password");
            const request = {
                clone: () => ({
                    formData: () => Promise.resolve(formData),
                }),
                formData: () => Promise.resolve(formData),
            };
            const serverAction = jest.fn();

            await clientAction({ request, serverAction, params: {} });
            expect(serverAction).toHaveBeenCalled();
        });
    });

    describe("Component", () => {
        it("renders error state when search params are missing", () => {
            useSearchParams.mockReturnValue([new URLSearchParams()]);
            render(<AcceptInvite params={{ teamId: "team123" }} />);
            expect(screen.getByText("Invitation Error")).toBeInTheDocument();
        });

        it("renders processing state and auto-submits form", () => {
            const mockRequestSubmit = jest.fn();
            document.getElementById = jest.fn().mockReturnValue({
                requestSubmit: mockRequestSubmit,
            });

            render(<AcceptInvite params={{ teamId: "team123" }} />);

            expect(
                screen.getByText("Processing Invitation..."),
            ).toBeInTheDocument();
            expect(mockRequestSubmit).toHaveBeenCalled();
        });

        it("renders set password form after invitation is accepted", () => {
            const actionData = {
                inviteAccepted: true,
                email: "test@test.com",
                name: "Test User",
            };
            render(
                <AcceptInvite
                    params={{ teamId: "team123" }}
                    actionData={actionData}
                />,
            );

            expect(
                screen.getByText("Welcome to the Team!"),
            ).toBeInTheDocument();
            expect(
                screen.getByPlaceholderText("Create a password"),
            ).toBeInTheDocument();
        });

        it("redirects to team page if already confirmed", () => {
            const actionData = { alreadyConfirmed: true };
            render(
                <AcceptInvite
                    params={{ teamId: "team123" }}
                    actionData={actionData}
                />,
            );

            expect(mockNavigate).toHaveBeenCalledWith("/team/team123");
        });

        it("subscribes to team notifications on success", async () => {
            const actionData = { inviteAccepted: true };
            render(
                <AcceptInvite
                    params={{ teamId: "team123" }}
                    actionData={actionData}
                />,
            );

            await waitFor(() => {
                expect(mockSubscribeToTeam).toHaveBeenCalledWith("team123");
            });
        });
    });
});
