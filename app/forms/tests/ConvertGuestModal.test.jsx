import { render, screen, fireEvent, waitFor } from "@/utils/test-utils";
import ConvertGuestModal from "../ConvertGuestModal";

const mockSubmit = jest.fn();
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useFetcher: () => ({
        submit: mockSubmit,
        state: "idle",
    }),
}));

const mockCloseAllModals = jest.fn();
jest.mock("@/hooks/useModal", () => ({
    __esModule: true,
    default: () => ({
        closeAllModals: mockCloseAllModals,
        openModal: jest.fn(),
    }),
}));

const mockInvitePlayersBrowser = jest.fn();
jest.mock("@/actions/invitations", () => ({
    invitePlayersBrowser: (...args) => mockInvitePlayersBrowser(...args),
}));

const mockShowNotification = jest.fn();
jest.mock("@/utils/showNotification", () => ({
    showNotification: (...args) => mockShowNotification(...args),
}));

describe("ConvertGuestModal", () => {
    const mockGuest = {
        $id: "guest-123",
        firstName: "Alex",
        lastName: "Morgan",
        gender: "Female",
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockInvitePlayersBrowser.mockResolvedValue({
            success: true,
            results: [{ userId: "new-user-456", email: "alex@example.com" }],
        });
    });

    it("renders null if no guest player provided", () => {
        render(
            <ConvertGuestModal
                guestPlayer={null}
                teamId="team-1"
                actionRoute="/team/team-1"
            />,
        );
        expect(
            screen.queryByLabelText(/Email Address/i),
        ).not.toBeInTheDocument();
    });

    it("renders pre-filled fields and email input", () => {
        render(
            <ConvertGuestModal
                guestPlayer={mockGuest}
                teamId="team-1"
                actionRoute="/team/team-1"
            />,
        );

        expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/First Name/i)).toHaveValue("Alex");
        expect(screen.getByLabelText(/Last Name/i)).toHaveValue("Morgan");
        expect(
            screen.getByRole("button", { name: /^Send Invite$/i }),
        ).toBeInTheDocument();
        expect(screen.getByText(/Stat Attribution/i)).toBeInTheDocument();
    });

    it("invites player via browser SDK and submits conversion action", async () => {
        render(
            <ConvertGuestModal
                guestPlayer={mockGuest}
                teamId="team-1"
                actionRoute="/team/team-1"
            />,
        );

        fireEvent.change(screen.getByLabelText(/Email Address/i), {
            target: { value: "alex@example.com" },
        });

        fireEvent.click(screen.getByRole("button", { name: /^Send Invite$/i }));

        await waitFor(() => {
            expect(mockInvitePlayersBrowser).toHaveBeenCalledWith(
                expect.objectContaining({
                    teamId: "team-1",
                    players: [
                        { email: "alex@example.com", name: "Alex Morgan" },
                    ],
                }),
            );
        });

        await waitFor(() => {
            expect(mockSubmit).toHaveBeenCalledWith(
                {
                    _action: "convert-guest-player",
                    guestPlayerId: "guest-123",
                    teamId: "team-1",
                    email: "alex@example.com",
                    firstName: "Alex",
                    lastName: "Morgan",
                    gender: "Female",
                    newUserId: "new-user-456",
                },
                {
                    method: "post",
                    action: "/team/team-1",
                },
            );
            expect(mockCloseAllModals).toHaveBeenCalled();
            expect(mockShowNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    variant: "success",
                }),
            );
        });
    });

    it("shows error notification if browser invitation fails", async () => {
        mockInvitePlayersBrowser.mockResolvedValueOnce({
            success: false,
            message: "Failed to send invitation.",
        });

        render(
            <ConvertGuestModal
                guestPlayer={mockGuest}
                teamId="team-1"
                actionRoute="/team/team-1"
            />,
        );

        fireEvent.change(screen.getByLabelText(/Email Address/i), {
            target: { value: "bad@example.com" },
        });

        fireEvent.click(screen.getByRole("button", { name: /^Send Invite$/i }));

        await waitFor(() => {
            expect(mockShowNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    variant: "error",
                    message: "Failed to send invitation.",
                }),
            );
            expect(mockSubmit).not.toHaveBeenCalled();
        });
    });
});
