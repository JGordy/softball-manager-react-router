import { useFetcher } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";

import TeamLineupContainer from "../TeamLineupContainer";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useFetcher: jest.fn(),
}));

jest.mock("../Batting/BattingOrderEditor", () => ({ handleReorder }) => (
    <div data-testid="batting-editor">
        <button
            onClick={() =>
                handleReorder({
                    source: { droppableId: "lineup", index: 0 },
                    destination: { droppableId: "reserves", index: 0 },
                })
            }
        >
            Mock Reorder
        </button>
    </div>
));

jest.mock(
    "../Fielding/FieldingDepthChart",
    () =>
        ({ handlePositionUpdate }) => (
            <div data-testid="fielding-chart">
                <button onClick={() => handlePositionUpdate("P", ["p1"])}>
                    Mock Position Update
                </button>
            </div>
        ),
);

describe("TeamLineupContainer Component", () => {
    const mockSubmit = jest.fn();
    const mockSetLineup = jest.fn();
    const mockSetReserves = jest.fn();
    const mockSetIdealPositioning = jest.fn();
    const mockTeam = { $id: "t1" };
    const mockPlayers = [{ $id: "p1" }, { $id: "p2" }];

    beforeEach(() => {
        jest.clearAllMocks();
        useFetcher.mockReturnValue({ submit: mockSubmit });

        render(
            <TeamLineupContainer
                team={mockTeam}
                players={mockPlayers}
                lineup={["p1"]}
                reserves={["p2"]}
                setLineup={mockSetLineup}
                setReserves={mockSetReserves}
                idealPositioning={{}}
                setIdealPositioning={mockSetIdealPositioning}
            />,
        );
    });

    it("renders batting order tab by default", () => {
        expect(screen.getByTestId("batting-editor")).toBeInTheDocument();
    });

    it("switches to fielding tab", () => {
        fireEvent.click(screen.getByText("Fielding Depth Chart"));
        expect(screen.getByTestId("fielding-chart")).toBeInTheDocument();
    });

    it("submits batting order on reorder", () => {
        fireEvent.click(screen.getByText("Mock Reorder"));

        expect(mockSetLineup).toHaveBeenCalled();
        expect(mockSetReserves).toHaveBeenCalled();
        expect(mockSubmit).toHaveBeenCalledWith(
            expect.any(FormData),
            expect.objectContaining({ action: "/team/t1/lineup" }),
        );
    });

    it("submits fielding positions on update", () => {
        fireEvent.click(screen.getByText("Fielding Depth Chart"));
        fireEvent.click(screen.getByText("Mock Position Update"));

        expect(mockSetIdealPositioning).toHaveBeenCalledWith({ P: ["p1"] });
        expect(mockSubmit).toHaveBeenCalledWith(
            expect.any(FormData),
            expect.objectContaining({ action: "/team/t1/lineup" }),
        );
    });
});
