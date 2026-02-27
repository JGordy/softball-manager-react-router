import { render, screen } from "@/utils/test-utils";
import PlayerAttendance from "../PlayerAttendance";

// Mock DeferredLoader to just call its children immediately with the data
jest.mock("@/components/DeferredLoader", () => ({
    __esModule: true,
    default: ({ resolve, children, fallback }) => {
        if (!resolve) return fallback;
        return children(Array.isArray(resolve) ? resolve : []);
    },
}));

describe("PlayerAttendance Component", () => {
    it("renders empty state correctly", () => {
        render(<PlayerAttendance attendancePromise={[]} />);
        expect(
            screen.getByText("No attendance records found."),
        ).toBeInTheDocument();
    });

    it("renders acceptance rate and breakdowns correctly", () => {
        const mockAttendance = [
            { status: "accepted" },
            { status: "accepted" },
            { status: "declined" },
            { status: "tentative" },
        ]; // 4 total: 2 accepted (50%), 1 declined (25%), 1 tentative (25%), 0 other

        render(<PlayerAttendance attendancePromise={mockAttendance} />);

        expect(screen.getByText("Total Responses: 4")).toBeInTheDocument();
        expect(screen.getByText("Accepted: 2")).toBeInTheDocument();
        expect(screen.getByText("Declined: 1")).toBeInTheDocument();
        expect(screen.getByText("Tentative: 1")).toBeInTheDocument();

        // The label rendered inside RingProgress
        expect(screen.getByText("50%")).toBeInTheDocument();
        expect(screen.getByText("Acceptance")).toBeInTheDocument();
    });
});
