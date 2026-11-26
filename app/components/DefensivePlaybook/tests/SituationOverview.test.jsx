import { render, screen, fireEvent } from "@/utils/test-utils";
import SituationOverview, { MiniDiamond } from "../SituationOverview";

describe("SituationOverview Component", () => {
    const mockPlay = {
        id: "test-play",
        title: "Ground Ball to Shortstop",
        category: "Runner on 1st",
        subCategory: "Double Play",
        situation: {
            outs: 1,
            runners: ["1B"],
            batterHand: "R",
            hitType: "Sharp ground ball to 6",
            description: "6-4-3 double play",
        },
    };

    describe("MiniDiamond", () => {
        it("renders empty diamond with proper aria-label when bases are empty", () => {
            render(<MiniDiamond runners={[]} />);
            const diamondSvg = screen.getByRole("img", {
                name: /Runners: Bases Empty/i,
            });
            expect(diamondSvg).toBeInTheDocument();
        });

        it("renders occupied runners in aria-label", () => {
            render(<MiniDiamond runners={["1B", "3B"]} />);
            const diamondSvg = screen.getByRole("img", {
                name: /Runners: 1B, 3B/i,
            });
            expect(diamondSvg).toBeInTheDocument();
        });
    });

    describe("SituationOverview layout & interactions", () => {
        it("returns null when no play is provided", () => {
            const { container } = render(<SituationOverview play={null} />);
            expect(container.querySelector(".situationContainer")).toBeNull();
        });

        it("renders play headline and situation information accurately", () => {
            render(<SituationOverview play={mockPlay} />);

            expect(
                screen.getByText("Ground Ball to Shortstop"),
            ).toBeInTheDocument();
            expect(screen.getByText("Runner on 1B")).toBeInTheDocument();
            expect(screen.getByText("(1)")).toBeInTheDocument();
            expect(screen.getByText("RHH")).toBeInTheDocument();
            expect(screen.getByText("Double Play")).toBeInTheDocument();
        });

        it("formats base state text for multiple runners and bases loaded", () => {
            const runners12 = {
                ...mockPlay,
                situation: { ...mockPlay.situation, runners: ["1B", "2B"] },
            };
            const { rerender } = render(<SituationOverview play={runners12} />);
            expect(screen.getByText("Runners on 1B & 2B")).toBeInTheDocument();

            const loaded = {
                ...mockPlay,
                situation: {
                    ...mockPlay.situation,
                    runners: ["1B", "2B", "3B"],
                },
            };
            rerender(<SituationOverview play={loaded} />);
            expect(screen.getByText("Bases Loaded")).toBeInTheDocument();

            const empty = {
                ...mockPlay,
                situation: { ...mockPlay.situation, runners: [] },
            };
            rerender(<SituationOverview play={empty} />);
            expect(screen.getByText("Bases Empty")).toBeInTheDocument();
        });

        it("renders batter stance correctly for left-handed hitters", () => {
            const lhhPlay = {
                ...mockPlay,
                situation: { ...mockPlay.situation, batterHand: "L" },
            };
            render(<SituationOverview play={lhhPlay} />);
            expect(screen.getByText("LHH")).toBeInTheDocument();
        });

        it("calls onOpenSelector when clicking the Select Scenario pill button", () => {
            const onOpenSelector = jest.fn();
            render(
                <SituationOverview
                    play={mockPlay}
                    onOpenSelector={onOpenSelector}
                />,
            );

            const btn = screen.getByRole("button", {
                name: "Select play or situation",
            });
            expect(btn).toBeInTheDocument();
            fireEvent.click(btn);
            expect(onOpenSelector).toHaveBeenCalledTimes(1);
        });
    });
});
