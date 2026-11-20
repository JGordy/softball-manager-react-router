import { render, screen, fireEvent } from "@/utils/test-utils";
import PlaySelector, {
    getPlayLocation,
    getPlayBaseState,
} from "../PlaySelector";

describe("PlaySelector Component and Helpers", () => {
    describe("getPlayLocation", () => {
        it("returns fallback 3B when play is null or undefined", () => {
            expect(getPlayLocation(null)).toBe("3B");
            expect(getPlayLocation(undefined)).toBe("3B");
        });

        it("extracts fielder zone from double play notation", () => {
            expect(getPlayLocation({ title: "6-4-3 Double Play" })).toBe("SS");
            expect(getPlayLocation({ title: "5-4-3 Double Play" })).toBe("3B");
            expect(getPlayLocation({ title: "4-6-3 Double Play" })).toBe("2B");
            expect(getPlayLocation({ title: "3-6-3 Double Play" })).toBe("1B");
            expect(getPlayLocation({ title: "1-6-3 Double Play" })).toBe("P");
            expect(getPlayLocation({ title: "2-3-2 Double Play" })).toBe("C");
        });

        it("extracts infield and outfield zones from title", () => {
            expect(
                getPlayLocation({
                    title: "Ground Ball to Shortstop - Force at 2B",
                }),
            ).toBe("SS");
            expect(
                getPlayLocation({ title: "Ground Ball to 3B - Throw to 1B" }),
            ).toBe("3B");
            expect(
                getPlayLocation({ title: "Ground Ball to 2B - Flip to 1B" }),
            ).toBe("2B");
            expect(
                getPlayLocation({ title: "Sharp Grounder to 1B - Unassisted" }),
            ).toBe("1B");
            expect(getPlayLocation({ title: "Comebacker to Pitcher" })).toBe(
                "P",
            );
            expect(
                getPlayLocation({ title: "Bunt to Catcher - Squeeze" }),
            ).toBe("C");
            expect(
                getPlayLocation({ title: "Line Drive to LF - Single" }),
            ).toBe("LF");
            expect(getPlayLocation({ title: "Fly Ball in LC Gap" })).toBe("LC");
            expect(getPlayLocation({ title: "Hit to RC Gap" })).toBe("RC");
            expect(getPlayLocation({ title: "Fly Ball down RF Line" })).toBe(
                "RF",
            );
            expect(getPlayLocation({ title: "Deep Fly to Dead Center" })).toBe(
                "LC",
            );
        });

        it("falls back to hitType description if title does not specify", () => {
            expect(
                getPlayLocation({
                    title: "Unknown Hit",
                    situation: { hitType: "Grounder to 3B" },
                }),
            ).toBe("3B");
            expect(
                getPlayLocation({
                    title: "Unknown Hit",
                    situation: { hitType: "Fly ball to deep right field" },
                }),
            ).toBe("RF");
        });
    });

    describe("getPlayBaseState", () => {
        it("returns Bases Empty when runners array is empty or undefined", () => {
            expect(getPlayBaseState({})).toBe("Bases Empty");
            expect(getPlayBaseState({ situation: { runners: [] } })).toBe(
                "Bases Empty",
            );
        });

        it("identifies single runner states", () => {
            expect(getPlayBaseState({ situation: { runners: ["1B"] } })).toBe(
                "Runner on 1st",
            );
            expect(getPlayBaseState({ situation: { runners: ["2B"] } })).toBe(
                "Runner on 2nd",
            );
            expect(getPlayBaseState({ situation: { runners: ["3B"] } })).toBe(
                "Runner on 3rd",
            );
        });

        it("identifies multiple runner states and bases loaded", () => {
            expect(
                getPlayBaseState({ situation: { runners: ["1B", "2B"] } }),
            ).toBe("Runners on 1st & 2nd");
            expect(
                getPlayBaseState({ situation: { runners: ["1B", "3B"] } }),
            ).toBe("First & Third");
            expect(
                getPlayBaseState({ situation: { runners: ["2B", "3B"] } }),
            ).toBe("Second & Third");
            expect(
                getPlayBaseState({
                    situation: { runners: ["1B", "2B", "3B"] },
                }),
            ).toBe("Bases Loaded");
        });
    });

    describe("PlaySelector Component", () => {
        const mockPlays = [
            {
                id: "play-1",
                title: "Ground Ball to Shortstop - Out at 1B",
                category: "Bases Empty",
                subCategory: "Infield Grounder",
                situation: {
                    outs: 0,
                    runners: [],
                    batterHand: "R",
                    hitType: "Ground ball to SS",
                },
            },
            {
                id: "play-2",
                title: "Single to Left Field - Runner to 2B",
                category: "Runner on 1st",
                subCategory: "Base Hit",
                situation: {
                    outs: 1,
                    runners: ["1B"],
                    batterHand: "R",
                    hitType: "Line drive to LF",
                },
            },
        ];

        it("renders situation selector inputs and matched play", () => {
            render(<PlaySelector plays={mockPlays} selectedPlayId="play-1" />);

            expect(
                screen.getByText("Base State (Runners)"),
            ).toBeInTheDocument();
            expect(screen.getByText("Outs")).toBeInTheDocument();
            expect(screen.getByText("Hit Type")).toBeInTheDocument();
            expect(
                screen.getByText("Hit Direction / Target Zone"),
            ).toBeInTheDocument();
            expect(screen.getByText("Batter Stance")).toBeInTheDocument();

            // Shows the matched play title and active button
            expect(
                screen.getByText("Ground Ball to Shortstop - Out at 1B"),
            ).toBeInTheDocument();
            expect(
                screen.getByRole("button", { name: "Select matched scenario" }),
            ).toHaveTextContent("Active Scenario");
        });

        it("calls onSelectPlay when Display Scenario button is clicked for a different play", () => {
            const handleSelectPlay = jest.fn();
            render(
                <PlaySelector
                    plays={mockPlays}
                    selectedPlayId="play-2"
                    onSelectPlay={handleSelectPlay}
                />,
            );

            // Active play is play-2 ("Single to Left Field - Runner to 2B")
            // The CTA shows "Active Scenario"
            const selectButton = screen.getByRole("button", {
                name: "Select matched scenario",
            });
            fireEvent.click(selectButton);

            expect(handleSelectPlay).toHaveBeenCalledWith("play-2", 1);
        });
    });
});
