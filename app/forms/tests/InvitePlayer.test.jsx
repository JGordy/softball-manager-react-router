import { render, screen, fireEvent, act } from "@/utils/test-utils";
import { trackEvent } from "@/utils/analytics";

import InvitePlayer from "../InvitePlayer";

const mockSubmit = jest.fn();
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useSubmit: () => mockSubmit,
    Form: ({ children, onSubmit, ...props }) => (
        <form onSubmit={onSubmit} {...props}>
            {children}
        </form>
    ),
}));

jest.mock("@/hooks/useModal", () => ({
    __esModule: true,
    default: () => ({
        closeAllModals: jest.fn(),
        openModal: jest.fn(),
    }),
}));

jest.mock("@/utils/analytics", () => ({
    trackEvent: jest.fn(),
}));

describe("InvitePlayer", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders initial single invite row", () => {
        render(<InvitePlayer teamId="team1" teamName="Team A" />);

        expect(
            screen.getAllByPlaceholderText(/player@example.com/i),
        ).toHaveLength(1);
        expect(screen.getAllByPlaceholderText(/John Doe/i)).toHaveLength(1);
    });

    it("adds a row when clicking 'Add row'", () => {
        render(<InvitePlayer teamId="team1" teamName="Team A" />);

        const addButton = screen.getByRole("button", { name: /add another/i });
        fireEvent.click(addButton);

        expect(
            screen.getAllByPlaceholderText(/player@example.com/i),
        ).toHaveLength(2);
    });

    it("removes a row when clicking remove button", () => {
        render(<InvitePlayer teamId="team1" teamName="Team A" />);

        // Add a row first
        fireEvent.click(screen.getByRole("button", { name: /add another/i }));
        expect(
            screen.getAllByPlaceholderText(/player@example.com/i),
        ).toHaveLength(2);

        // Remove one
        const removeButtons = screen
            .getAllByRole("button")
            .filter((btn) => btn.querySelector("svg")); // Trash icon button
        fireEvent.click(removeButtons[0]);

        expect(
            screen.getAllByPlaceholderText(/player@example.com/i),
        ).toHaveLength(1);
    });

    it("handles pasting multiple emails", async () => {
        render(<InvitePlayer teamId="team1" teamName="Team A" />);

        const emailInput = screen.getByPlaceholderText(/player@example.com/i);

        const pasteData = {
            getData: () =>
                "test1@example.com, test2@example.com\ntest3@example.com",
        };

        fireEvent.paste(emailInput, { clipboardData: pasteData });

        expect(
            screen.getAllByPlaceholderText(/player@example.com/i),
        ).toHaveLength(3);
        expect(
            screen.getAllByPlaceholderText(/player@example.com/i)[0],
        ).toHaveValue("test1@example.com");
        expect(
            screen.getAllByPlaceholderText(/player@example.com/i)[1],
        ).toHaveValue("test2@example.com");
        expect(
            screen.getAllByPlaceholderText(/player@example.com/i)[2],
        ).toHaveValue("test3@example.com");
    });

    it("tracks event on submission and calls submit", () => {
        render(<InvitePlayer teamId="team1" teamName="Team A" />);

        // Fill one email
        fireEvent.change(screen.getByPlaceholderText(/player@example.com/i), {
            target: { value: "test@example.com" },
        });

        // Submit form
        fireEvent.click(
            screen.getByRole("button", { name: /send invitations/i }),
        );

        expect(trackEvent).toHaveBeenCalledWith("invite-player", {
            teamId: "team1",
            count: 1,
        });

        expect(mockSubmit).toHaveBeenCalledWith(expect.any(FormData), {
            action: undefined,
            method: "post",
        });

        const formData = mockSubmit.mock.calls[0][0];
        expect(formData.getAll("email")).toContain("test@example.com");
    });
});
