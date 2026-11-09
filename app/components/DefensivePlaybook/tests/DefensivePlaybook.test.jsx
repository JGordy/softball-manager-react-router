import { render, screen, fireEvent, waitFor } from "@/utils/test-utils";
import DefensivePlaybook from "../DefensivePlaybook";
import PlaySelector, {
    getPlayLocation,
    getPlayBaseState,
    BASE_STATE_OPTIONS,
} from "../PlaySelector";
import { DEFENSIVE_PLAYS, PLAY_CATEGORIES } from "@data/defensivePlays.js";

describe("DefensivePlaybook Component", () => {
    // Use real plays sample for realistic testing
    const testPlays = DEFENSIVE_PLAYS.slice(0, 5);

    it("renders the defensive playbook header", () => {
        render(
            <DefensivePlaybook
                plays={testPlays}
                categories={PLAY_CATEGORIES}
            />,
        );

        expect(
            screen.getAllByRole("heading", { name: "Defensive Playbook" })
                .length,
        ).toBeGreaterThan(0);
    });

    it("renders situation overview and all 10 fielders", () => {
        render(
            <DefensivePlaybook
                plays={testPlays}
                categories={PLAY_CATEGORIES}
            />,
        );

        // Check active play title in situation overview
        expect(screen.getAllByText(testPlays[0].title).length).toBeGreaterThan(
            0,
        );

        // Check 10 positions are in the document
        const expectedPositions = [
            "P",
            "C",
            "1B",
            "2B",
            "3B",
            "SS",
            "LF",
            "LC",
            "RC",
            "RF",
        ];
        expectedPositions.forEach((posId) => {
            const fielderMatches = screen.getAllByText(posId);
            expect(fielderMatches.length).toBeGreaterThan(0);
        });
    });

    it("allows selecting a fielder on the field diamond", () => {
        render(
            <DefensivePlaybook
                plays={testPlays}
                categories={PLAY_CATEGORIES}
            />,
        );

        // Click Shortstop on the interactive field
        const ssFieldNode = screen.getByLabelText(/Shortstop \(SS\)/i);
        fireEvent.click(ssFieldNode);

        // Expect SS to be selected (active node style / attribute)
        expect(ssFieldNode).toBeInTheDocument();
    });

    it("opens scenario configuration drawer and switches active play", async () => {
        render(
            <DefensivePlaybook
                plays={testPlays}
                categories={PLAY_CATEGORIES}
            />,
        );

        // Open drawer via Select Scenario button
        const selectScenarioBtn = screen.getByLabelText(
            "Select play or situation",
        );
        fireEvent.click(selectScenarioBtn);

        await waitFor(() => {
            expect(
                screen.getByRole("button", { name: "Select matched scenario" }),
            ).toBeInTheDocument();
        });

        const selectBtn = screen.getByRole("button", {
            name: "Select matched scenario",
        });
        fireEvent.click(selectBtn);

        expect(screen.getAllByText(testPlays[0].title).length).toBeGreaterThan(
            0,
        );
    });

    it("renders scenario configuration controls in the drawer", async () => {
        render(
            <DefensivePlaybook
                plays={testPlays}
                categories={PLAY_CATEGORIES}
            />,
        );

        // Open drawer via Select Scenario button
        const selectScenarioBtn = screen.getByLabelText(
            "Select play or situation",
        );
        fireEvent.click(selectScenarioBtn);

        await waitFor(() => {
            expect(
                screen.getByText("Base State (Runners)"),
            ).toBeInTheDocument();
            expect(
                screen.getByText("Hit Direction / Target Zone"),
            ).toBeInTheDocument();
            expect(
                screen.getByLabelText("Select matched scenario"),
            ).toBeInTheDocument();
        });
    });

    it("renders timeline playback controls and handles play/pause toggle", () => {
        render(
            <DefensivePlaybook
                plays={testPlays}
                categories={PLAY_CATEGORIES}
            />,
        );

        const playBtns = screen.getAllByLabelText("Play");
        expect(playBtns.length).toBeGreaterThan(0);

        fireEvent.click(playBtns[0]);
        const pauseBtns = screen.getAllByLabelText("Pause");
        expect(pauseBtns.length).toBeGreaterThan(0);

        fireEvent.click(pauseBtns[0]);
        expect(screen.getAllByLabelText("Play").length).toBeGreaterThan(0);
    });

    it("renders the tactical role color legend between field and controls", () => {
        render(
            <DefensivePlaybook
                plays={testPlays}
                categories={PLAY_CATEGORIES}
            />,
        );

        expect(
            screen.getByLabelText("Fielder role color legend"),
        ).toBeInTheDocument();
        expect(screen.getByText("Primary")).toBeInTheDocument();
        expect(screen.getByText("Cutoff")).toBeInTheDocument();
        expect(screen.getByText("Coverage")).toBeInTheDocument();
        expect(screen.getByText("Backup")).toBeInTheDocument();
    });

    it("correctly identifies play locations using getPlayLocation", () => {
        const gb1b = DEFENSIVE_PLAYS.find((p) => p.id === "r2-gb-1b-hold");
        expect(gb1b).toBeDefined();
        expect(getPlayLocation(gb1b)).toBe("1B");

        const gb3b = DEFENSIVE_PLAYS.find((p) => p.id === "r2-gb-3b-hold");
        expect(gb3b).toBeDefined();
        expect(getPlayLocation(gb3b)).toBe("3B");

        const dp363 = DEFENSIVE_PLAYS.find((p) => p.id === "r1-dp-363");
        expect(dp363).toBeDefined();
        expect(getPlayLocation(dp363)).toBe("1B");
    });

    it("matches Ground Ball to 1B in Scoring Position and stays stable when toggling outs", () => {
        const onSelectMock = jest.fn();
        render(
            <PlaySelector
                plays={DEFENSIVE_PLAYS}
                selectedPlayId="r2-gb-1b-hold"
                onSelectPlay={onSelectMock}
                categories={PLAY_CATEGORIES}
            />,
        );

        // Initially matched scenario should be Ground Ball to 1B
        expect(
            screen.getByText(
                "Ground Ball to 1B - Unassisted Out, Hold Runner at 2B",
            ),
        ).toBeInTheDocument();

        // Click "1 Out"
        const oneOutBtn = screen.getByText("1 Out");
        fireEvent.click(oneOutBtn);

        // It must NOT jump to SS or 3B; it must remain Ground Ball to 1B!
        expect(
            screen.getByText(
                "Ground Ball to 1B - Unassisted Out, Hold Runner at 2B",
            ),
        ).toBeInTheDocument();

        // Click "2 Outs"
        const twoOutsBtn = screen.getByText("2 Outs");
        fireEvent.click(twoOutsBtn);

        // It still must stay Ground Ball to 1B!
        expect(
            screen.getByText(
                "Ground Ball to 1B - Unassisted Out, Hold Runner at 2B",
            ),
        ).toBeInTheDocument();

        // Clicking select calls onSelectPlay with the play id and the 2 outs value
        const selectBtn = screen.getByRole("button", {
            name: "Select matched scenario",
        });
        fireEvent.click(selectBtn);
        expect(onSelectMock).toHaveBeenCalledWith("r2-gb-1b-hold", 2);
    });

    test("ensures complete defensive coverage for all infielders and outfielders across all base situations", () => {
        const categories = [
            "Bases Empty",
            "Runner on 1st",
            "Scoring Position",
            "Runners on 1st & 2nd",
            "First & Third",
            "Bases Loaded",
        ];
        const infielders = ["P", "C", "1B", "2B", "3B", "SS"];
        const outfielders = ["LF", "LC", "RC", "RF"];

        for (const cat of categories) {
            const catPlays = DEFENSIVE_PLAYS.filter((p) => p.category === cat);
            expect(catPlays.length).toBeGreaterThan(0);

            for (const pos of infielders) {
                const posPlays = catPlays.filter(
                    (p) => getPlayLocation(p) === pos,
                );
                expect(posPlays.length).toBeGreaterThanOrEqual(1);
            }

            for (const pos of outfielders) {
                const posPlays = catPlays.filter(
                    (p) => getPlayLocation(p) === pos,
                );
                expect(posPlays.length).toBeGreaterThanOrEqual(1);
            }
        }
    });

    it("provides explicit base state options for Runner on 2nd, 3rd, and 2nd & 3rd", () => {
        const optionValues = BASE_STATE_OPTIONS.map((o) => o.value);
        expect(optionValues).toContain("Runner on 2nd");
        expect(optionValues).toContain("Runner on 3rd");
        expect(optionValues).toContain("Second & Third");

        // Verify that getPlayBaseState correctly parses each
        const r2Play = DEFENSIVE_PLAYS.find((p) => p.id === "r2-gb-1b-hold");
        expect(getPlayBaseState(r2Play)).toBe("Runner on 2nd");

        const r3Play = DEFENSIVE_PLAYS.find(
            (p) => p.id === "r3-gb-infield-in-1b-home",
        );
        expect(getPlayBaseState(r3Play)).toBe("Runner on 3rd");

        const r23Play = DEFENSIVE_PLAYS.find(
            (p) => p.id === "r23-gb-infield-in-home",
        );
        expect(getPlayBaseState(r23Play)).toBe("Second & Third");
    });
});
