import { useFetcher } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";

import PreferencesDrawer from "../PreferencesDrawer";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useFetcher: jest.fn(),
}));

jest.mock(
    "@/components/DrawerContainer",
    () =>
        ({ children, opened }) =>
            opened ? <div data-testid="drawer">{children}</div> : null,
);

describe("PreferencesDrawer Component", () => {
    const mockSubmit = jest.fn();
    const mockFetcher = {
        submit: mockSubmit,
        state: "idle",
        Form: ({ children, onSubmit }) => (
            <form onSubmit={onSubmit}>{children}</form>
        ),
    };
    const mockTeam = {
        $id: "t1",
        prefs: { maxMaleBatters: "2" },
    };
    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useFetcher.mockReturnValue(mockFetcher);
    });

    it("renders with initial values", () => {
        render(
            <PreferencesDrawer
                opened={true}
                onClose={mockOnClose}
                team={mockTeam}
            />,
        );

        expect(
            screen.getByLabelText("Max Consecutive Male Batters"),
        ).toHaveValue("2");
    });

    it("submits the correct data on form submission", () => {
        render(
            <PreferencesDrawer
                opened={true}
                onClose={mockOnClose}
                team={mockTeam}
            />,
        );

        const input = screen.getByLabelText("Max Consecutive Male Batters");
        fireEvent.change(input, { target: { value: "3" } });

        fireEvent.submit(
            screen.getByRole("button", { name: "Save Preferences" }),
        );

        expect(mockSubmit).toHaveBeenCalledWith(
            {
                _action: "update-preferences",
                maxMaleBatters: 3,
            },
            expect.objectContaining({ method: "post" }),
        );
    });

    it("calls onClose when submission is successful", () => {
        const successFetcher = {
            ...mockFetcher,
            data: { success: true },
        };
        useFetcher.mockReturnValue(successFetcher);

        render(
            <PreferencesDrawer
                opened={true}
                onClose={mockOnClose}
                team={mockTeam}
            />,
        );

        expect(mockOnClose).toHaveBeenCalled();
    });
});
