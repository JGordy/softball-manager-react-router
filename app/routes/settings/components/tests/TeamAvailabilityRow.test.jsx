import { render, screen, fireEvent } from "@/utils/test-utils";
import TeamAvailabilityRow from "../TeamAvailabilityRow";

describe("TeamAvailabilityRow Component", () => {
    const mockTeam = {
        $id: "team-1",
        name: "Test Team",
    };

    it("renders team name and current value", () => {
        render(
            <TeamAvailabilityRow
                team={mockTeam}
                value="accepted"
                onChange={jest.fn()}
            />,
        );

        expect(screen.getByText("Test Team")).toBeInTheDocument();
        const attendingRadio = screen.getByLabelText("Attending");
        expect(attendingRadio).toBeChecked();
    });

    it("calls onChange when selection changes", () => {
        const onChange = jest.fn();
        render(
            <TeamAvailabilityRow
                team={mockTeam}
                value="none"
                onChange={onChange}
            />,
        );

        const attendingBtn = screen.getByText("Attending");
        fireEvent.click(attendingBtn);

        expect(onChange).toHaveBeenCalledWith("accepted");
    });

    it("defaults to 'none' if value is missing", () => {
        render(
            <TeamAvailabilityRow
                team={mockTeam}
                value={undefined}
                onChange={jest.fn()}
            />,
        );

        const noneRadio = screen.getByLabelText("None");
        expect(noneRadio).toBeChecked();
    });

    it("disables control when disabled prop is true", () => {
        render(
            <TeamAvailabilityRow
                team={mockTeam}
                value="none"
                onChange={jest.fn()}
                disabled={true}
            />,
        );

        const noneRadio = screen.getByLabelText("None");
        const attendingRadio = screen.getByLabelText("Attending");

        expect(noneRadio).toBeDisabled();
        expect(attendingRadio).toBeDisabled();
    });
});
