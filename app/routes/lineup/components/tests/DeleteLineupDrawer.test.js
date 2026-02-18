import { render, screen, fireEvent, waitFor } from "@/utils/test-utils";
import DeleteLineupDrawer from "../DeleteLineupDrawer";

// Mock dependencies
jest.mock("react-router", () => ({
    useFetcher: jest.fn(),
    Form: ({ children, ...props }) => <form {...props}>{children}</form>,
}));

jest.mock(
    "@/components/DrawerContainer",
    () =>
        ({ children, title, opened, onClose }) =>
            opened ? (
                <div data-testid="drawer">
                    <h1>{title}</h1>
                    <button onClick={onClose}>Close</button>
                    {children}
                </div>
            ) : null,
);

describe("DeleteLineupDrawer Component", () => {
    const mockFetcher = {
        submit: jest.fn(),
        state: "idle",
        data: null,
        Form: ({ children, ...props }) => <form {...props}>{children}</form>,
    };

    const defaultProps = {
        opened: true,
        onClose: jest.fn(),
        game: { $id: "game1" },
        actionUrl: "/events/game1/lineup",
        lineupHandlers: {
            setState: jest.fn(),
        },
        setHasBeenEdited: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        require("react-router").useFetcher.mockReturnValue(mockFetcher);
    });

    it("renders confirmation message", () => {
        render(<DeleteLineupDrawer {...defaultProps} />);

        expect(screen.getByText("Delete Lineup")).toBeInTheDocument();
        expect(
            screen.getByText("Are you sure you want to delete this lineup?"),
        ).toBeInTheDocument();
        expect(
            screen.getByText("This action cannot be undone."),
        ).toBeInTheDocument();
    });

    it("handles delete action", () => {
        render(<DeleteLineupDrawer {...defaultProps} />);

        const deleteButton = screen.getByText("Yes, Delete Lineup");
        fireEvent.click(deleteButton);

        expect(defaultProps.lineupHandlers.setState).toHaveBeenCalledWith(null);
        expect(mockFetcher.submit).toHaveBeenCalledWith(
            expect.any(FormData),
            expect.objectContaining({
                method: "post",
                action: "/events/game1/lineup",
            }),
        );
        expect(defaultProps.setHasBeenEdited).toHaveBeenCalledWith(false);
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("handles cancel action", () => {
        render(<DeleteLineupDrawer {...defaultProps} />);

        fireEvent.click(screen.getByText("No, Cancel"));

        expect(defaultProps.onClose).toHaveBeenCalled();
        expect(mockFetcher.submit).not.toHaveBeenCalled();
    });
});
