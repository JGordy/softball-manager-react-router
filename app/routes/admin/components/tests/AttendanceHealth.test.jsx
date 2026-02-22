import { render, screen } from "@/utils/test-utils";
import { AttendanceHealth } from "../AttendanceHealth";

describe("AttendanceHealth", () => {
    const mockAttendance = {
        accepted: 80,
        declined: 10,
        tentative: 10,
        total: 100,
    };

    it("renders attendance metrics correctly", () => {
        render(<AttendanceHealth attendance={mockAttendance} />);

        expect(screen.getByText("Platform Attendance")).toBeInTheDocument();
        expect(screen.getByText("Show-up Rate")).toBeInTheDocument();
        expect(
            screen.getByText('80 of 100 responses are "Accepted"'),
        ).toBeInTheDocument();
        expect(screen.getByText("80%")).toBeInTheDocument();
        expect(screen.getByText("Accepted: 80")).toBeInTheDocument();
        expect(screen.getByText("Tentative: 10")).toBeInTheDocument();
        expect(screen.getByText("Declined: 10")).toBeInTheDocument();
    });

    it("handles zero attendance data gracefully", () => {
        render(
            <AttendanceHealth
                attendance={{
                    accepted: 0,
                    total: 0,
                    declined: 0,
                    tentative: 0,
                }}
            />,
        );

        expect(
            screen.getByText('0 of 0 responses are "Accepted"'),
        ).toBeInTheDocument();
        expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("handles missing attendance data gracefully", () => {
        render(<AttendanceHealth attendance={null} />);

        expect(
            screen.getByText('0 of 0 responses are "Accepted"'),
        ).toBeInTheDocument();
        expect(screen.getByText("0%")).toBeInTheDocument();
    });
});
