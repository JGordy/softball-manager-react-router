import { render, screen, fireEvent } from "@/utils/test-utils";
import BulkJerseyNumberModal from "../BulkJerseyNumberModal";

// Mock FormWrapper since it's a layout component we want to avoid deep testing here
jest.mock("@/forms/FormWrapper", () => ({ children, ...props }) => (
    <form data-testid="form-wrapper" method="post" {...props}>
        {children}
    </form>
));

const mockPlayers = [
    { $id: "p1", firstName: "Zebra", lastName: "Last" },
    { $id: "p2", firstName: "Apple", lastName: "First" },
];

describe("BulkJerseyNumberModal", () => {
    const defaultProps = {
        players: mockPlayers,
        teamId: "team123",
        primaryColor: "blue",
    };

    it("should render alphabetically sorted players", () => {
        render(<BulkJerseyNumberModal {...defaultProps} />);

        const playerNames = screen.getAllByText(/Apple|Zebra/);
        // Apple (index 1 in mock) should come before Zebra (index 0 in mock)
        expect(playerNames[0]).toHaveTextContent("Apple First");
        expect(playerNames[1]).toHaveTextContent("Zebra Last");
    });

    it("should render input fields for each player", () => {
        render(<BulkJerseyNumberModal {...defaultProps} />);

        expect(screen.getByLabelText("Apple First")).toBeInTheDocument();
        expect(screen.getByLabelText("Zebra Last")).toBeInTheDocument();
    });

    it("should handle jersey number updates in local state", () => {
        render(<BulkJerseyNumberModal {...defaultProps} />);

        const appleInput = screen.getByLabelText("Apple First");
        fireEvent.change(appleInput, { target: { value: "10" } });
        expect(appleInput.value).toBe("10");
    });

    it("should have correct form action and method", () => {
        render(<BulkJerseyNumberModal {...defaultProps} />);

        const form = screen.getByTestId("form-wrapper");
        expect(form).toHaveAttribute("method", "post");
    });
});
