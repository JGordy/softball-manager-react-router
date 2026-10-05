import { render, screen } from "@/utils/test-utils";
import ConvertGuestModal from "../ConvertGuestModal";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useSubmit: () => jest.fn(),
    useNavigation: () => ({ state: "idle" }),
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

describe("ConvertGuestModal", () => {
    const mockGuest = {
        $id: "guest-123",
        firstName: "Alex",
        lastName: "Morgan",
        gender: "Female",
    };

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
});
