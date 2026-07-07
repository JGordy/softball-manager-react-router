import { useFetcher } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";

import RemoveTeamDrawer from "../RemoveTeamDrawer";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useFetcher: jest.fn(),
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

const mockTeam = { $id: "team-123", name: "Thunder Cats" };

describe("RemoveTeamDrawer", () => {
    const mockSubmit = jest.fn();

    const mockFetcher = {
        submit: mockSubmit,
        state: "idle",
        data: undefined,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useFetcher.mockReturnValue(mockFetcher);
    });

    it("renders nothing when closed", () => {
        render(
            <RemoveTeamDrawer
                opened={false}
                onClose={() => {}}
                team={mockTeam}
            />,
        );
        expect(screen.queryByText(/remove team/i)).not.toBeInTheDocument();
    });

    it("renders the drawer with team name when opened", () => {
        render(
            <RemoveTeamDrawer
                opened={true}
                onClose={() => {}}
                team={mockTeam}
            />,
        );
        expect(screen.getByText(mockTeam.name)).toBeInTheDocument();
        expect(
            screen.getByRole("textbox", { name: /type the team name/i }),
        ).toBeInTheDocument();
    });

    it("keeps the confirm button disabled when input is empty", () => {
        render(
            <RemoveTeamDrawer
                opened={true}
                onClose={() => {}}
                team={mockTeam}
            />,
        );
        const button = screen.getByRole("button", { name: /remove team/i });
        expect(button).toBeDisabled();
    });

    it("keeps the confirm button disabled when input does not match the team name", () => {
        render(
            <RemoveTeamDrawer
                opened={true}
                onClose={() => {}}
                team={mockTeam}
            />,
        );
        const input = screen.getByRole("textbox", {
            name: /type the team name/i,
        });
        fireEvent.change(input, { target: { value: "thunder" } });

        const button = screen.getByRole("button", { name: /remove team/i });
        expect(button).toBeDisabled();
    });

    it("enables the confirm button when input exactly matches the team name", () => {
        render(
            <RemoveTeamDrawer
                opened={true}
                onClose={() => {}}
                team={mockTeam}
            />,
        );
        const input = screen.getByRole("textbox", {
            name: /type the team name/i,
        });
        fireEvent.change(input, { target: { value: mockTeam.name } });

        const button = screen.getByRole("button", { name: /remove team/i });
        expect(button).not.toBeDisabled();
    });

    it("submits delete-team action when confirmed and button clicked", () => {
        render(
            <RemoveTeamDrawer
                opened={true}
                onClose={() => {}}
                team={mockTeam}
            />,
        );
        const input = screen.getByRole("textbox", {
            name: /type the team name/i,
        });
        fireEvent.change(input, { target: { value: mockTeam.name } });

        const button = screen.getByRole("button", { name: /remove team/i });
        fireEvent.click(button);

        expect(mockSubmit).toHaveBeenCalledWith(
            { _action: "delete-team" },
            { method: "post", action: `/team/${mockTeam.$id}` },
        );
    });

    it("shows loading state while fetcher is submitting", () => {
        useFetcher.mockReturnValue({ ...mockFetcher, state: "submitting" });

        render(
            <RemoveTeamDrawer
                opened={true}
                onClose={() => {}}
                team={mockTeam}
            />,
        );
        const input = screen.getByRole("textbox", {
            name: /type the team name/i,
        });
        expect(input).toBeDisabled();
    });

    it("resets the input when the drawer is reopened", () => {
        const { rerender } = render(
            <RemoveTeamDrawer
                opened={true}
                onClose={() => {}}
                team={mockTeam}
            />,
        );
        const input = screen.getByRole("textbox", {
            name: /type the team name/i,
        });
        fireEvent.change(input, { target: { value: "some text" } });

        // Close then reopen
        rerender(
            <RemoveTeamDrawer
                opened={false}
                onClose={() => {}}
                team={mockTeam}
            />,
        );
        rerender(
            <RemoveTeamDrawer
                opened={true}
                onClose={() => {}}
                team={mockTeam}
            />,
        );

        const resetInput = screen.getByRole("textbox", {
            name: /type the team name/i,
        });
        expect(resetInput).toHaveValue("");
    });
});
