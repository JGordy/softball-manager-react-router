import { render, screen } from "@/utils/test-utils";
import * as reactRouter from "react-router";
import * as useModalHook from "@/hooks/useModal";

import AddGuestPlayer from "../AddGuestPlayer";

const mockSubmit = jest.fn();
const mockCloseAllModals = jest.fn();

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useSubmit: () => mockSubmit,
    useNavigation: () => ({ state: "idle" }),
    useActionData: jest.fn(),
    Form: ({ children, onSubmit, ...props }) => (
        <form onSubmit={onSubmit} {...props}>
            {children}
        </form>
    ),
}));

jest.mock("@/forms/FormWrapper", () => ({ children, action, confirmText }) => (
    <form data-testid="form-wrapper">
        {children}
        <button type="submit">{confirmText}</button>
    </form>
));

jest.mock("@/hooks/useModal", () => ({
    __esModule: true,
    default: jest.fn(),
}));

describe("AddGuestPlayer Form", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        useModalHook.default.mockReturnValue({
            closeAllModals: mockCloseAllModals,
        });

        reactRouter.useActionData.mockReturnValue(null);
    });

    it("renders required input fields when creating a guest player", () => {
        render(<AddGuestPlayer teamId="team1" eventId="event1" />);

        expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText("Male", { exact: true })).toBeChecked();
        expect(screen.getByText("Create & Add to Lineup")).toBeInTheDocument();
    });

    it("renders correct hidden inputs", () => {
        const { container } = render(
            <AddGuestPlayer teamId="team1" eventId="event1" guestId="guest1" />,
        );

        expect(container.querySelector('input[name="teamId"]')).toHaveValue(
            "team1",
        );
        expect(container.querySelector('input[name="eventId"]')).toHaveValue(
            "event1",
        );
        expect(container.querySelector('input[name="userId"]')).toHaveValue(
            "guest1",
        );
    });

    it("fills inputs with default values when in edit mode", () => {
        const defaults = {
            firstName: "Jane",
            lastName: "Doe",
            gender: "Female",
        };

        render(
            <AddGuestPlayer
                action="update-guest-player"
                teamId="team1"
                eventId="event1"
                defaults={defaults}
            />,
        );

        expect(screen.getByDisplayValue("Jane")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Doe")).toBeInTheDocument();
        expect(screen.getByLabelText(/Female/i)).toBeChecked();
        expect(screen.getByText("Update Guest")).toBeInTheDocument();
    });

    it("successfully calls closeAllModals when actionData returns true with player data", () => {
        reactRouter.useActionData.mockReturnValue(null);

        const { rerender } = render(
            <AddGuestPlayer teamId="team1" eventId="event1" />,
        );

        // Now simulate a form submission returning success data
        const mockActionData = {
            success: true,
            response: { player: { $id: "guestX", firstName: "Test" } },
        };
        reactRouter.useActionData.mockReturnValue(mockActionData);

        rerender(<AddGuestPlayer teamId="team1" eventId="event1" />);

        expect(mockCloseAllModals).toHaveBeenCalled();
    });

    it("does not call closeAllModals when actionData is null or unsuccessful", () => {
        reactRouter.useActionData.mockReturnValue({ success: false });

        render(<AddGuestPlayer teamId="team1" eventId="event1" />);

        expect(mockCloseAllModals).not.toHaveBeenCalled();
    });
});
