import { render, screen, fireEvent, act } from "@/utils/test-utils";
import { trackEvent } from "@/utils/analytics";

import ScoringModeNudgeDrawer from "../ScoringModeNudgeDrawer";

jest.mock("@/utils/analytics", () => ({
    trackEvent: jest.fn(),
}));

jest.mock("@/components/DrawerContainer", () => {
    return function MockDrawerContainer({
        opened,
        children,
        withCloseButton,
        closeOnClickOutside,
        closeOnEscape,
        title,
    }) {
        if (!opened) return null;
        return (
            <div data-testid="drawer">
                <div data-testid="drawer-title">{title}</div>
                {/* Expose props for assertion */}
                <div data-testid="close-btn-visible">
                    {String(withCloseButton)}
                </div>
                <div data-testid="click-outside">
                    {String(closeOnClickOutside)}
                </div>
                <div data-testid="escape">{String(closeOnEscape)}</div>
                {children}
            </div>
        );
    };
});

describe("ScoringModeNudgeDrawer", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    describe("opening behaviour", () => {
        it("does not open immediately on mount", () => {
            render(
                <ScoringModeNudgeDrawer
                    opponentScoringMode="Detailed"
                    onSwitchMode={jest.fn()}
                />,
            );
            expect(screen.queryByTestId("drawer")).toBeNull();
        });

        it("opens after the 800 ms delay", () => {
            render(
                <ScoringModeNudgeDrawer
                    opponentScoringMode="Detailed"
                    onSwitchMode={jest.fn()}
                />,
            );
            act(() => {
                jest.advanceTimersByTime(800);
            });
            expect(screen.getByTestId("drawer")).toBeInTheDocument();
        });

        it("does not fire the open timer a second time within the same component instance (hasShownRef guard)", () => {
            render(
                <ScoringModeNudgeDrawer
                    opponentScoringMode="Detailed"
                    onSwitchMode={jest.fn()}
                />,
            );

            // First tick — drawer opens
            act(() => {
                jest.advanceTimersByTime(800);
            });
            expect(screen.getByTestId("drawer")).toBeInTheDocument();

            // Advance time well past the delay a second time — hasShownRef prevents
            // another setOpened(true) call, so the drawer remains in its current state
            act(() => {
                jest.advanceTimersByTime(2000);
            });
            // Drawer is still open (was not double-triggered or closed unexpectedly)
            expect(screen.getByTestId("drawer")).toBeInTheDocument();
        });
    });

    describe("non-dismissable constraints", () => {
        beforeEach(() => {
            render(
                <ScoringModeNudgeDrawer
                    opponentScoringMode="Detailed"
                    onSwitchMode={jest.fn()}
                />,
            );
            act(() => {
                jest.advanceTimersByTime(800);
            });
        });

        it("passes withCloseButton={false} so the X button is not shown", () => {
            expect(screen.getByTestId("close-btn-visible").textContent).toBe(
                "false",
            );
        });

        it("passes closeOnClickOutside={false} so backdrop clicks are ignored", () => {
            expect(screen.getByTestId("click-outside").textContent).toBe(
                "false",
            );
        });

        it("passes closeOnEscape={false} so Escape key is ignored", () => {
            expect(screen.getByTestId("escape").textContent).toBe("false");
        });
    });

    describe("Detailed mode content", () => {
        beforeEach(() => {
            render(
                <ScoringModeNudgeDrawer
                    opponentScoringMode="Detailed"
                    onSwitchMode={jest.fn()}
                />,
            );
            act(() => {
                jest.advanceTimersByTime(800);
            });
        });

        it("shows the correct headline", () => {
            expect(
                screen.getByText(/faster scoring available/i),
            ).toBeInTheDocument();
        });

        it("renders the Switch to Basic button", () => {
            expect(
                screen.getByRole("button", { name: /switch to basic/i }),
            ).toBeInTheDocument();
        });

        it("renders the Keep Detailed button", () => {
            expect(
                screen.getByRole("button", { name: /keep detailed/i }),
            ).toBeInTheDocument();
        });
    });

    describe("Basic mode content", () => {
        beforeEach(() => {
            render(
                <ScoringModeNudgeDrawer
                    opponentScoringMode="Basic"
                    onSwitchMode={jest.fn()}
                />,
            );
            act(() => {
                jest.advanceTimersByTime(800);
            });
        });

        it("shows the correct headline", () => {
            expect(screen.getByText(/want more detail/i)).toBeInTheDocument();
        });

        it("renders the Switch to Detailed button", () => {
            expect(
                screen.getByRole("button", { name: /switch to detailed/i }),
            ).toBeInTheDocument();
        });

        it("renders the Keep Basic button", () => {
            expect(
                screen.getByRole("button", { name: /keep basic/i }),
            ).toBeInTheDocument();
        });
    });

    describe("choice interactions", () => {
        it("Keep button closes drawer without calling onSwitchMode", () => {
            const onSwitchMode = jest.fn();
            render(
                <ScoringModeNudgeDrawer
                    opponentScoringMode="Detailed"
                    onSwitchMode={onSwitchMode}
                />,
            );
            act(() => {
                jest.advanceTimersByTime(800);
            });

            fireEvent.click(
                screen.getByRole("button", { name: /keep detailed/i }),
            );

            expect(screen.queryByTestId("drawer")).toBeNull();
            expect(onSwitchMode).not.toHaveBeenCalled();
        });

        it("Switch button closes drawer and calls onSwitchMode", () => {
            const onSwitchMode = jest.fn();
            render(
                <ScoringModeNudgeDrawer
                    opponentScoringMode="Detailed"
                    onSwitchMode={onSwitchMode}
                />,
            );
            act(() => {
                jest.advanceTimersByTime(800);
            });

            fireEvent.click(
                screen.getByRole("button", { name: /switch to basic/i }),
            );

            expect(screen.queryByTestId("drawer")).toBeNull();
            expect(onSwitchMode).toHaveBeenCalledTimes(1);
        });
    });

    describe("analytics tracking", () => {
        it("fires a nudge-impression event when the drawer opens", () => {
            render(
                <ScoringModeNudgeDrawer
                    opponentScoringMode="Detailed"
                    onSwitchMode={jest.fn()}
                />,
            );
            act(() => {
                jest.advanceTimersByTime(800);
            });

            expect(trackEvent).toHaveBeenCalledWith(
                "scoring-mode-nudge-impression",
                { currentMode: "Detailed" },
            );
        });

        it("fires a nudge-choice event with choice=switch when Switch is tapped", () => {
            render(
                <ScoringModeNudgeDrawer
                    opponentScoringMode="Detailed"
                    onSwitchMode={jest.fn()}
                />,
            );
            act(() => {
                jest.advanceTimersByTime(800);
            });

            fireEvent.click(
                screen.getByRole("button", { name: /switch to basic/i }),
            );

            expect(trackEvent).toHaveBeenCalledWith(
                "scoring-mode-nudge-choice",
                { currentMode: "Detailed", choice: "switch" },
            );
        });

        it("fires a nudge-choice event with choice=keep when Keep is tapped", () => {
            render(
                <ScoringModeNudgeDrawer
                    opponentScoringMode="Basic"
                    onSwitchMode={jest.fn()}
                />,
            );
            act(() => {
                jest.advanceTimersByTime(800);
            });

            fireEvent.click(
                screen.getByRole("button", { name: /keep basic/i }),
            );

            expect(trackEvent).toHaveBeenCalledWith(
                "scoring-mode-nudge-choice",
                { currentMode: "Basic", choice: "keep" },
            );
        });
    });
});
