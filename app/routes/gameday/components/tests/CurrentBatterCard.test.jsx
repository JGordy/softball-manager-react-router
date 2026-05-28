import { render, screen, fireEvent } from "@/utils/test-utils";
import CurrentBatterCard from "../CurrentBatterCard";

describe("CurrentBatterCard", () => {
    const mockBatter = {
        $id: "p1",
        firstName: "John",
        lastName: "Doe",
    };

    const mockLogs = [
        { playerId: "p1", eventType: "single", rbi: 1 },
        { playerId: "p1", eventType: "strikeout" },
        { playerId: "p1", eventType: "walk" }, // Walk not an AB
        { playerId: "p2", eventType: "homerun" }, // Different player
        { playerId: "subp1", eventType: "single", rbi: 1 }, // Sub hitting
    ];

    it("renders nothing if no current batter", () => {
        const { container } = render(
            <CurrentBatterCard currentBatter={null} logs={mockLogs} />,
        );
        // Should effectively be empty (ignoring style tags injected by Mantine)
        const contentWithoutStyles = Array.from(container.children).filter(
            (child) => child.tagName !== "STYLE",
        );
        expect(contentWithoutStyles.length).toBe(0);
    });

    it("renders batter name", () => {
        render(
            <CurrentBatterCard currentBatter={mockBatter} logs={mockLogs} />,
        );
        expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("calculates and displays stats correctly", () => {
        render(
            <CurrentBatterCard currentBatter={mockBatter} logs={mockLogs} />,
        );
        // 1 Hit (1B)
        // AB calculation: 1B (hit), K (out). BB is NOT AB. HR is different player.
        // So 2 ABs. 1/2.
        expect(screen.getByText("1/2")).toBeInTheDocument();
        expect(screen.getByText("1 RBI")).toBeInTheDocument();
        expect(screen.getByText("[1B]")).toBeInTheDocument();
    });

    it("renders correctly with no logs", () => {
        render(<CurrentBatterCard currentBatter={mockBatter} logs={[]} />);
        expect(screen.getByText("0/0")).toBeInTheDocument();
    });

    it("renders substitute identity and SUMS stats when there are substitutions", () => {
        const subBatter = {
            ...mockBatter,
            substitutions: [
                { playerId: "subp1", firstName: "Sub", lastName: "Guy" },
            ],
        };
        render(<CurrentBatterCard currentBatter={subBatter} logs={mockLogs} />);

        // Name should be Sub Guy
        expect(screen.getByText("Sub Guy")).toBeInTheDocument();
        // SUB badge should be visible
        expect(screen.getByText("SUB")).toBeInTheDocument();

        // Stats should SUM John Doe's stats (1/2, 1 RBI) + Sub Guy's stats (1/1, 1 RBI)
        // Total: 2/3, 2 RBI
        expect(screen.getByText("2/3")).toBeInTheDocument();
        expect(screen.getByText("2 RBI")).toBeInTheDocument();
    });

    it("renders jersey number if provided", () => {
        const batterWithJersey = { ...mockBatter, jerseyNumber: "42" };
        render(
            <CurrentBatterCard currentBatter={batterWithJersey} logs={[]} />,
        );
        expect(screen.getByText("#42")).toBeInTheDocument();
    });

    it("renders avatar image with the provided URL and jersey number", () => {
        const batterWithAvatar = {
            ...mockBatter,
            avatarUrl: "http://avatar.url",
            jerseyNumber: "42",
        };
        render(
            <CurrentBatterCard currentBatter={batterWithAvatar} logs={[]} />,
        );

        // Assert that the avatar image is rendered with the correct src
        const avatarImage = screen.getByRole("img", { name: "John Doe" });
        expect(avatarImage).toBeInTheDocument();
        expect(avatarImage).toHaveAttribute("src", "http://avatar.url");
    });

    it("renders notes input for opponents and updates/clears on batter change", () => {
        const opponentBatter1 = {
            $id: "opp1",
            firstName: "Opponent",
            lastName: "One",
            notes: "Lefty hitter",
        };
        const opponentBatter2 = {
            $id: "opp2",
            firstName: "Opponent",
            lastName: "Two",
            notes: "",
        };

        const { rerender } = render(
            <CurrentBatterCard
                currentBatter={opponentBatter1}
                logs={[]}
                isOpponent={true}
            />,
        );

        const input = screen.getByPlaceholderText(/Add notes/);
        expect(input.value).toBe("Lefty hitter");

        // Rerender with a different opponent batter that has no notes
        rerender(
            <CurrentBatterCard
                currentBatter={opponentBatter2}
                logs={[]}
                isOpponent={true}
            />,
        );

        const updatedInput = screen.getByPlaceholderText(/Add notes/);
        expect(updatedInput.value).toBe("");
    });

    describe("dynamic styling based on isOpponent", () => {
        const batter = {
            $id: "p1",
            firstName: "Jane",
            lastName: "Smith",
        };

        const logsWithRbi = [{ playerId: "p1", eventType: "homerun", rbi: 3 }];

        it("applies a red card background when isOpponent=true", () => {
            render(
                <CurrentBatterCard
                    currentBatter={batter}
                    logs={[]}
                    isOpponent={true}
                    data-testid="batter-card"
                />,
            );
            // Mantine v8 translates bg="red.9" to an inline style:
            // style="background: var(--mantine-color-red-9);"
            expect(screen.getByTestId("batter-card")).toHaveStyle(
                "background: var(--mantine-color-red-9)",
            );
        });

        it("applies a blue card background when isOpponent=false (default)", () => {
            render(
                <CurrentBatterCard
                    currentBatter={batter}
                    logs={[]}
                    isOpponent={false}
                    data-testid="batter-card"
                />,
            );
            // Mantine v8 translates bg="blue.9" to an inline style:
            // style="background: var(--mantine-color-blue-9);"
            expect(screen.getByTestId("batter-card")).toHaveStyle(
                "background: var(--mantine-color-blue-9)",
            );
        });

        it("shows the notes text input only when isOpponent=true", () => {
            const { rerender } = render(
                <CurrentBatterCard
                    currentBatter={batter}
                    logs={[]}
                    isOpponent={true}
                />,
            );
            expect(
                screen.getByPlaceholderText(/Add notes/),
            ).toBeInTheDocument();

            rerender(
                <CurrentBatterCard
                    currentBatter={batter}
                    logs={[]}
                    isOpponent={false}
                />,
            );
            expect(
                screen.queryByPlaceholderText(/Add notes/),
            ).not.toBeInTheDocument();
        });

        it("does not render notes input by default (isOpponent omitted)", () => {
            render(<CurrentBatterCard currentBatter={batter} logs={[]} />);
            expect(
                screen.queryByPlaceholderText(/Add notes/),
            ).not.toBeInTheDocument();
        });

        it("renders red RBI badge when isOpponent=true", () => {
            render(
                <CurrentBatterCard
                    currentBatter={batter}
                    logs={logsWithRbi}
                    isOpponent={true}
                />,
            );
            // Mantine v8 Badge: the label text sits in an inner <span>;
            // color is applied as CSS variables on the parent badge root element:
            //   style="--badge-bg: var(--mantine-color-red-filled); ..."
            const badgeLabel = screen.getByText(/RBI/);
            const badgeRoot = badgeLabel.closest("[style]");
            expect(badgeRoot?.getAttribute("style")).toContain(
                "var(--mantine-color-red-filled)",
            );
        });

        it("renders lime RBI badge when isOpponent=false", () => {
            render(
                <CurrentBatterCard
                    currentBatter={batter}
                    logs={logsWithRbi}
                    isOpponent={false}
                />,
            );
            const badgeLabel = screen.getByText(/RBI/);
            const badgeRoot = badgeLabel.closest("[style]");
            expect(badgeRoot?.getAttribute("style")).toContain(
                "var(--mantine-color-lime-filled)",
            );
        });

        it("calls onNotesChange when notes input loses focus (isOpponent=true)", () => {
            const handleNotesChange = jest.fn();

            render(
                <CurrentBatterCard
                    currentBatter={{ ...batter, notes: "" }}
                    logs={[]}
                    isOpponent={true}
                    onNotesChange={handleNotesChange}
                />,
            );

            const input = screen.getByPlaceholderText(/Add notes/);
            fireEvent.change(input, { target: { value: "Lefty" } });
            fireEvent.blur(input);

            expect(handleNotesChange).toHaveBeenCalledWith("Lefty");
        });
    });
});
