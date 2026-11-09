import { render, screen, fireEvent } from "@/utils/test-utils";
import PlayTimelineControls from "../PlayTimelineControls";

describe("PlayTimelineControls Component", () => {
    const mockBallTimeline = [
        { step: 0, pos: { x: 50, y: 78 }, label: "Hit Contact" },
        { step: 0.4, pos: { x: 34, y: 56 }, label: "Fielded by 3B" },
        { step: 1.0, pos: { x: 66, y: 56 }, label: "Out at 1B" },
    ];

    it("renders speed control and updates playback speed", () => {
        const setPlaybackSpeed = jest.fn();
        render(
            <PlayTimelineControls
                timelineStep={0.0}
                setTimelineStep={jest.fn()}
                isPlaying={false}
                setIsPlaying={jest.fn()}
                playbackSpeed={1}
                setPlaybackSpeed={setPlaybackSpeed}
                ballTimeline={mockBallTimeline}
                showVectors={true}
                setShowVectors={jest.fn()}
            />,
        );

        expect(screen.getByText("0.5x")).toBeInTheDocument();
        expect(screen.getByText("1.0x")).toBeInTheDocument();

        fireEvent.click(screen.getByText("0.5x"));
        expect(setPlaybackSpeed).toHaveBeenCalledWith(0.5);
    });

    it("toggles play and pause states on click", () => {
        const setIsPlaying = jest.fn();
        const { rerender } = render(
            <PlayTimelineControls
                timelineStep={0.2}
                setTimelineStep={jest.fn()}
                isPlaying={false}
                setIsPlaying={setIsPlaying}
                playbackSpeed={1}
                setPlaybackSpeed={jest.fn()}
                ballTimeline={mockBallTimeline}
                showVectors={true}
                setShowVectors={jest.fn()}
            />,
        );

        const playBtn = screen.getByRole("button", { name: "Play" });
        expect(playBtn).toBeInTheDocument();
        fireEvent.click(playBtn);
        expect(setIsPlaying).toHaveBeenCalledWith(true);

        // When playing, the button should display Pause
        rerender(
            <PlayTimelineControls
                timelineStep={0.2}
                setTimelineStep={jest.fn()}
                isPlaying={true}
                setIsPlaying={setIsPlaying}
                playbackSpeed={1}
                setPlaybackSpeed={jest.fn()}
                ballTimeline={mockBallTimeline}
                showVectors={true}
                setShowVectors={jest.fn()}
            />,
        );

        const pauseBtn = screen.getByRole("button", { name: "Pause" });
        expect(pauseBtn).toBeInTheDocument();
        fireEvent.click(pauseBtn);
        expect(setIsPlaying).toHaveBeenCalledWith(false);
    });

    it("automatically restarts from 0.0 when clicking play at the end of the play", () => {
        const setTimelineStep = jest.fn();
        const setIsPlaying = jest.fn();

        render(
            <PlayTimelineControls
                timelineStep={1.0}
                setTimelineStep={setTimelineStep}
                isPlaying={false}
                setIsPlaying={setIsPlaying}
                playbackSpeed={1}
                setPlaybackSpeed={jest.fn()}
                ballTimeline={mockBallTimeline}
                showVectors={true}
                setShowVectors={jest.fn()}
            />,
        );

        const playBtn = screen.getByRole("button", { name: "Play" });
        fireEvent.click(playBtn);

        expect(setTimelineStep).toHaveBeenCalledWith(0.0);
        expect(setIsPlaying).toHaveBeenCalledWith(true);
    });

    it("toggles movement vector arrows switch", () => {
        const setShowVectors = jest.fn();

        render(
            <PlayTimelineControls
                timelineStep={0.0}
                setTimelineStep={jest.fn()}
                isPlaying={false}
                setIsPlaying={jest.fn()}
                playbackSpeed={1}
                setPlaybackSpeed={jest.fn()}
                ballTimeline={mockBallTimeline}
                showVectors={true}
                setShowVectors={setShowVectors}
            />,
        );

        const arrowsSwitch = screen.getByRole("switch");
        expect(arrowsSwitch).toBeInTheDocument();
        expect(arrowsSwitch).toBeChecked();

        fireEvent.click(arrowsSwitch);
        expect(setShowVectors).toHaveBeenCalledWith(false);
    });

    it("renders the scrubber slider with accessible role", () => {
        render(
            <PlayTimelineControls
                timelineStep={0.5}
                setTimelineStep={jest.fn()}
                isPlaying={false}
                setIsPlaying={jest.fn()}
                playbackSpeed={1}
                setPlaybackSpeed={jest.fn()}
                ballTimeline={mockBallTimeline}
                showVectors={true}
                setShowVectors={jest.fn()}
            />,
        );

        const slider = screen.getByRole("slider");
        expect(slider).toBeInTheDocument();
        expect(slider).toHaveAttribute("aria-valuenow", "50");
    });
});
