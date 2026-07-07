import { useFetcher } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";
import RemovePlayersDrawer from "../RemovePlayersDrawer";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useFetcher: jest.fn(),
    useOutletContext: jest.fn(() => ({ isDesktop: false })),
}));

jest.mock(
    "@/components/DrawerContainer",
    () =>
        ({ children, opened, title }) =>
            opened ? (
                <div data-testid="drawer" data-title={title}>
                    {children}
                </div>
            ) : null,
);

jest.mock(
    "@/forms/FormWrapper",
    () =>
        ({ children, action, actionRoute, confirmText, onSuccess }) => (
            <div
                data-testid="form-wrapper"
                data-action={action}
                data-route={actionRoute}
                data-confirm={confirmText}
            >
                {children}
                <button type="button" onClick={onSuccess}>
                    Submit Mock
                </button>
            </div>
        ),
);

describe("RemovePlayersDrawer Component", () => {
    const mockSubmit = jest.fn();
    const mockFetcher = {
        submit: mockSubmit,
        state: "idle",
    };

    const mockPlayers = [
        {
            $id: "u1",
            firstName: "John",
            lastName: "Doe",
            membershipId: "m1",
            email: "john@example.com",
        },
        {
            $id: "u2",
            firstName: "Jane",
            lastName: "Smith",
            membershipId: "m2",
            email: "jane@example.com",
        },
        {
            $id: "u3",
            firstName: "No",
            lastName: "Member",
            membershipId: null, // Should be filtered out
            email: "nomember@example.com",
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        useFetcher.mockReturnValue(mockFetcher);
    });

    it("renders only players with a membershipId", () => {
        render(
            <RemovePlayersDrawer
                opened={true}
                onClose={jest.fn()}
                players={mockPlayers}
                teamId="t1"
                userId="u1"
            />,
        );

        expect(screen.getByText("John Doe (You)")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        expect(screen.queryByText("No Member")).not.toBeInTheDocument();
    });

    it("toggles player selection and transitions to confirmation flow", () => {
        const handleClose = jest.fn();
        render(
            <RemovePlayersDrawer
                opened={true}
                onClose={handleClose}
                players={mockPlayers}
                teamId="t1"
                userId="u1"
            />,
        );

        // Click on John Doe
        fireEvent.click(screen.getByText("John Doe (You)"));

        // Button should say Remove 1 Selected Player(s)
        const removeBtn = screen.getByRole("button", {
            name: /Remove 1 Selected Player\(s\)/i,
        });
        expect(removeBtn).not.toBeDisabled();

        // Transition to confirmation flow
        fireEvent.click(removeBtn);

        // Check if confirmation alert is shown
        expect(screen.getByTestId("drawer")).toHaveAttribute(
            "data-title",
            "Confirm Removal",
        );
        expect(
            screen.getByText(/Are you sure you want to remove these 1 player/i),
        ).toBeInTheDocument();

        // Verify the hidden inputs within the FormWrapper mock
        const form = screen.getByTestId("form-wrapper");
        expect(form).toHaveAttribute("data-action", "remove-players");
        expect(form).toHaveAttribute("data-route", "/team/t1");

        const hiddenInput = form.querySelector('input[type="hidden"]');
        expect(hiddenInput).toHaveValue(JSON.stringify(["m1"]));

        // Click Mock Submit to verify onClose callback is triggered
        fireEvent.click(screen.getByRole("button", { name: "Submit Mock" }));
        expect(handleClose).toHaveBeenCalled();
    });

    it("can return back to the selection screen from confirmation screen", () => {
        render(
            <RemovePlayersDrawer
                opened={true}
                onClose={jest.fn()}
                players={mockPlayers}
                teamId="t1"
                userId="u1"
            />,
        );

        fireEvent.click(screen.getByText("John Doe (You)"));
        fireEvent.click(
            screen.getByRole("button", {
                name: /Remove 1 Selected Player\(s\)/i,
            }),
        );

        // We should be on confirm screen now. Click "Back to Selection"
        const backBtn = screen.getByRole("button", {
            name: /Back to Selection/i,
        });
        fireEvent.click(backBtn);

        // We should be back on selection screen, showing player listing
        expect(screen.getByTestId("drawer")).toHaveAttribute(
            "data-title",
            "Remove Players",
        );
        expect(screen.getByText("John Doe (You)")).toBeInTheDocument();
    });
});
