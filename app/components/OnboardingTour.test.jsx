import { screen, fireEvent, cleanup, act } from "@testing-library/react";
import { render } from "@/utils/test-utils";
import OnboardingTour from "./OnboardingTour";

const mockSubmit = jest.fn();
const mockTrack = jest.fn();

// Mock global window.umami
global.window = global.window || {};
global.window.umami = {
    track: mockTrack,
};

// Mock useFetcher
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useFetcher: () => ({
        submit: mockSubmit,
    }),
}));

// Mock react-joyride
jest.mock("react-joyride", () => {
    const React = require("react");
    return {
        Joyride: ({ steps, run, onEvent, stepIndex = 0 }) => {
            React.useEffect(() => {
                if (run && steps.length > 0 && steps[stepIndex]) {
                    onEvent({
                        type: "step:before",
                        step: steps[stepIndex],
                        index: stepIndex,
                    });
                }
            }, [run, steps, onEvent, stepIndex]);

            return (
                <div
                    data-testid="mock-joyride"
                    data-run={String(run)}
                    data-step-index={stepIndex}
                >
                    {steps.map((s, idx) => (
                        <div
                            key={idx}
                            data-testid={`step-${idx}`}
                            data-target={s.target}
                            style={{
                                display: idx === stepIndex ? "block" : "none",
                            }}
                        >
                            {s.content}
                        </div>
                    ))}
                    <button
                        data-testid="next-btn"
                        onClick={() =>
                            onEvent({
                                type: "step:after",
                                index: stepIndex,
                                action: "next",
                            })
                        }
                    >
                        Next Step
                    </button>
                    <button
                        data-testid="target-not-found-btn"
                        onClick={() =>
                            onEvent({
                                type: "error:target_not_found",
                                index: 1,
                                action: "next",
                            })
                        }
                    >
                        Simulate Target Not Found
                    </button>
                    <button
                        data-testid="target-not-found-prev-btn"
                        onClick={() =>
                            onEvent({
                                type: "error:target_not_found",
                                index: 1,
                                action: "prev",
                            })
                        }
                    >
                        Simulate Target Not Found Prev
                    </button>
                    <button
                        data-testid="finish-btn"
                        onClick={() =>
                            onEvent({
                                status: "finished",
                                type: "tour:end",
                            })
                        }
                    >
                        Finish Tour
                    </button>
                    <button
                        data-testid="skip-btn"
                        onClick={() =>
                            onEvent({
                                status: "skipped",
                                type: "tour:end",
                                action: "skip",
                            })
                        }
                    >
                        Skip Tour
                    </button>
                </div>
            );
        },
        STATUS: {
            FINISHED: "finished",
            SKIPPED: "skipped",
        },
        EVENTS: {
            STEP_BEFORE: "step:before",
            STEP_AFTER: "step:after",
            TOUR_END: "tour:end",
            TARGET_NOT_FOUND: "error:target_not_found",
        },
    };
});

describe("OnboardingTour Component", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        cleanup();
        document.body.innerHTML = "";
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const mockSteps = [
        { target: ".present-target", content: "Present Target Step" },
        { target: ".absent-target", content: "Absent Target Step" },
        { target: ".tour-menu-section-roster", content: "Dynamic Menu Step" },
        { target: ".tour-roster-section", content: "Dynamic Roster Step" },
    ];

    it("does not render mock-joyride if the user has already completed this tour", () => {
        const mockUser = {
            $id: "user1",
            prefs: {
                onboardingTours: {
                    team_details: true,
                },
            },
        };

        render(
            <OnboardingTour
                tourKey="team_details"
                steps={mockSteps}
                user={mockUser}
            />,
        );

        // Cascade pending timers: first for mounting, then for run delay check
        act(() => {
            jest.runOnlyPendingTimers();
        });
        act(() => {
            jest.runOnlyPendingTimers();
        });

        expect(screen.queryByTestId("mock-joyride")).not.toBeInTheDocument();
    });

    it("renders mock-joyride and filters active steps based on DOM presence", () => {
        // Mock presence of .present-target in DOM
        const targetDiv = document.createElement("div");
        targetDiv.className = "present-target";
        document.body.appendChild(targetDiv);

        const mockUser = {
            $id: "user1",
            prefs: {
                onboardingTours: {
                    team_details: false,
                },
            },
        };

        render(
            <OnboardingTour
                tourKey="team_details"
                steps={mockSteps}
                user={mockUser}
                alwaysIncludeTargets={[
                    ".tour-menu-section-roster",
                    ".tour-roster-section",
                ]}
            />,
        );

        // Cascade pending timers: first for mounting, then for run delay check
        act(() => {
            jest.runOnlyPendingTimers();
        });
        act(() => {
            jest.runOnlyPendingTimers();
        });

        expect(screen.getByTestId("mock-joyride")).toBeInTheDocument();
        expect(screen.getByTestId("mock-joyride")).toHaveAttribute(
            "data-run",
            "true",
        );

        // The present target step and the tour bypass targets should be in the active steps
        expect(screen.getByText("Present Target Step")).toBeInTheDocument();
        expect(screen.getByText("Dynamic Menu Step")).toBeInTheDocument();
        expect(screen.getByText("Dynamic Roster Step")).toBeInTheDocument();

        // The absent target step should be filtered out
        expect(
            screen.queryByText("Absent Target Step"),
        ).not.toBeInTheDocument();
    });

    it("submits the preferences update when the tour is finished", () => {
        const mockUser = {
            $id: "user1",
            prefs: {
                onboardingTours: {},
            },
        };

        render(
            <OnboardingTour
                tourKey="team_details"
                steps={mockSteps}
                user={mockUser}
                alwaysIncludeTargets={[
                    ".tour-menu-section-roster",
                    ".tour-roster-section",
                ]}
            />,
        );

        // Cascade pending timers: first for mounting, then for run delay check
        act(() => {
            jest.runOnlyPendingTimers();
        });
        act(() => {
            jest.runOnlyPendingTimers();
        });

        const finishBtn = screen.getByTestId("finish-btn");
        act(() => {
            fireEvent.click(finishBtn);
        });

        expect(mockSubmit).toHaveBeenCalledTimes(1);
        expect(mockSubmit).toHaveBeenCalledWith(
            {
                _action: "update-user-preferences",
                userId: "user1",
                onboardingTours: JSON.stringify({ team_details: true }),
            },
            { method: "post", action: "/api/user-preferences" },
        );
    });

    it("dispatches custom controlled toggle events when navigating steps", () => {
        const mockUser = {
            $id: "user1",
            prefs: {
                onboardingTours: {},
            },
        };

        const eventListener = jest.fn();
        window.addEventListener("toggle-onboarding-menu", eventListener);

        render(
            <OnboardingTour
                tourKey="team_details"
                steps={mockSteps}
                user={mockUser}
                menuId="team-details-menu"
                alwaysIncludeTargets={[
                    ".tour-menu-section-roster",
                    ".tour-roster-section",
                ]}
            />,
        );

        // Cascade pending timers: first for mounting, then for run delay check
        act(() => {
            jest.runOnlyPendingTimers();
        });
        act(() => {
            jest.runOnlyPendingTimers();
        });

        // Click next-btn which fires step:after event
        const nextBtn = screen.getByTestId("next-btn");
        act(() => {
            fireEvent.click(nextBtn);
        });

        // Assert that the CustomEvent was dispatched
        expect(eventListener).toHaveBeenCalled();

        window.removeEventListener("toggle-onboarding-menu", eventListener);
    });

    it("dispatches custom controlled toggle events when navigating to a menu-dropdown target", () => {
        const mockUser = {
            $id: "user1",
            prefs: {
                onboardingTours: {},
            },
        };

        const eventListener = jest.fn();
        window.addEventListener("toggle-onboarding-menu", eventListener);

        const dropdownSteps = [
            { target: ".present-target", content: "Step 1" },
            {
                target: ".tour-game-details-menu-dropdown",
                content: "Dropdown Target Step",
            },
        ];

        render(
            <OnboardingTour
                tourKey="team_details"
                steps={dropdownSteps}
                user={mockUser}
                menuId="game-details-menu"
                alwaysIncludeTargets={[
                    ".present-target",
                    ".tour-game-details-menu-dropdown",
                ]}
            />,
        );

        // Cascade pending timers
        act(() => {
            jest.runOnlyPendingTimers();
        });
        act(() => {
            jest.runOnlyPendingTimers();
        });

        // Click next-btn which fires step:after event transition to menu-dropdown
        const nextBtn = screen.getByTestId("next-btn");
        act(() => {
            fireEvent.click(nextBtn);
        });

        // Assert that the CustomEvent was dispatched for menu-dropdown target
        expect(eventListener).toHaveBeenCalledWith(
            expect.objectContaining({
                detail: { open: true, menuId: "game-details-menu" },
            }),
        );

        window.removeEventListener("toggle-onboarding-menu", eventListener);
    });

    it("programmatically clicks Roster Tab button when entering roster step on mobile", () => {
        const mockUser = {
            $id: "user1",
            prefs: {
                onboardingTours: {},
            },
        };

        // Render mock mobile tab roster button in DOM
        const tabButton = document.createElement("button");
        tabButton.className = "tour-mobile-tab-roster";
        const clickSpy = jest.spyOn(tabButton, "click");
        document.body.appendChild(tabButton);

        render(
            <OnboardingTour
                tourKey="team_details"
                steps={[
                    { target: ".tour-roster-section", content: "Roster Step" },
                ]}
                user={mockUser}
                alwaysIncludeTargets={[".tour-roster-section"]}
            />,
        );

        act(() => {
            jest.runOnlyPendingTimers();
        });
        act(() => {
            jest.runOnlyPendingTimers();
        });

        // The tour-roster-section target fires STEP_BEFORE on mount because it's the first step
        expect(clickSpy).toHaveBeenCalled();
        clickSpy.mockRestore();
    });

    it("pre-emptively opens and closes lineup drawer during transitions to drawer targets", () => {
        const mockUser = {
            $id: "user1",
            prefs: {
                onboardingTours: {},
            },
        };

        const eventListener = jest.fn();
        window.addEventListener(
            "toggle-onboarding-lineup-drawer",
            eventListener,
        );

        const lineupSteps = [
            { target: "#tour-create-lineup-btn", content: "Button Step" },
            { target: "#tour-option-scratch", content: "Drawer Step" },
            { target: "#tour-drag-handle-0", content: "Outside Drawer Step" },
        ];

        render(
            <OnboardingTour
                tourKey="lineup_details"
                steps={lineupSteps}
                user={mockUser}
                alwaysIncludeTargets={[
                    "#tour-create-lineup-btn",
                    "#tour-option-scratch",
                    "#tour-drag-handle-0",
                ]}
            />,
        );

        // Cascade pending timers
        act(() => {
            jest.runOnlyPendingTimers();
        });
        act(() => {
            jest.runOnlyPendingTimers();
        });

        // Initially we are on step 1. Advance to step 2 (drawer step).
        const nextBtn = screen.getByTestId("next-btn");
        act(() => {
            fireEvent.click(nextBtn);
        });

        // The CustomEvent should have been dispatched to open the drawer
        expect(eventListener).toHaveBeenCalledWith(
            expect.objectContaining({
                detail: { open: true },
            }),
        );

        // Advance timers by 300ms to let the stepIndex change to 1 (step 2)
        act(() => {
            jest.advanceTimersByTime(300);
        });

        // Reset spy call count and advance to step 3 (non-drawer step)
        eventListener.mockClear();
        act(() => {
            fireEvent.click(nextBtn);
        });

        // The CustomEvent should have been dispatched to close the drawer
        expect(eventListener).toHaveBeenCalledWith(
            expect.objectContaining({
                detail: { open: false },
            }),
        );

        window.removeEventListener(
            "toggle-onboarding-lineup-drawer",
            eventListener,
        );
    });

    it("resets stepIndex to 0 when starting a tour or when completing a tour", () => {
        const mockUser = {
            $id: "user1",
            prefs: {
                onboardingTours: {},
            },
        };

        const { rerender } = render(
            <OnboardingTour
                tourKey="team_details"
                steps={mockSteps}
                user={mockUser}
                alwaysIncludeTargets={[
                    ".tour-menu-section-roster",
                    ".tour-roster-section",
                ]}
            />,
        );

        act(() => {
            jest.runOnlyPendingTimers();
        });
        act(() => {
            jest.runOnlyPendingTimers();
        });

        // Initially stepIndex is 0
        expect(screen.getByTestId("mock-joyride")).toBeInTheDocument();

        // Finish the tour, which resets stepIndex after 100ms
        const finishBtn = screen.getByTestId("finish-btn");
        act(() => {
            fireEvent.click(finishBtn);
        });

        // Fast-forward fake timers for the unmounting timeout
        act(() => {
            jest.advanceTimersByTime(100);
        });

        // Tour is run = false now
        expect(screen.queryByTestId("mock-joyride")).not.toBeInTheDocument();
    });

    it("filters active steps based on responsive viewport client-side", () => {
        // Save original matchMedia
        const originalMatchMedia = window.matchMedia;

        // Mock matchMedia to return false (mobile viewport)
        window.matchMedia = jest.fn().mockImplementation((query) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        }));

        const responsiveSteps = [
            { target: ".all-viewport", content: "All Viewports Step" },
            {
                target: ".desktop-only",
                content: "Desktop Only Step",
                responsive: "desktop",
            },
            {
                target: ".mobile-only",
                content: "Mobile Only Step",
                responsive: "mobile",
            },
        ];

        // Mock target presence
        const d1 = document.createElement("div");
        d1.className = "all-viewport";
        document.body.appendChild(d1);
        const d2 = document.createElement("div");
        d2.className = "desktop-only";
        document.body.appendChild(d2);
        const d3 = document.createElement("div");
        d3.className = "mobile-only";
        document.body.appendChild(d3);

        const mockUser = { $id: "user1", prefs: { onboardingTours: {} } };

        const { unmount } = render(
            <OnboardingTour
                tourKey="team_details"
                steps={responsiveSteps}
                user={mockUser}
            />,
        );

        act(() => {
            jest.runOnlyPendingTimers();
        });
        act(() => {
            jest.runOnlyPendingTimers();
        });

        // matches: false, so it's mobile viewport. It should show:
        // - "All Viewports Step"
        // - "Mobile Only Step"
        // It should NOT show:
        // - "Desktop Only Step"
        expect(screen.getByText("All Viewports Step")).toBeInTheDocument();
        expect(screen.getByText("Mobile Only Step")).toBeInTheDocument();
        expect(screen.queryByText("Desktop Only Step")).not.toBeInTheDocument();

        unmount();
        cleanup();
        document.body.innerHTML = "";

        // Now mock matchMedia to return true (desktop viewport)
        window.matchMedia = jest.fn().mockImplementation((query) => ({
            matches: true,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        }));

        const d4 = document.createElement("div");
        d4.className = "all-viewport";
        document.body.appendChild(d4);
        const d5 = document.createElement("div");
        d5.className = "desktop-only";
        document.body.appendChild(d5);
        const d6 = document.createElement("div");
        d6.className = "mobile-only";
        document.body.appendChild(d6);

        render(
            <OnboardingTour
                tourKey="team_details"
                steps={responsiveSteps}
                user={mockUser}
            />,
        );

        act(() => {
            jest.runOnlyPendingTimers();
        });
        act(() => {
            jest.runOnlyPendingTimers();
        });

        // matches: true, so it's desktop viewport. It should show:
        // - "All Viewports Step"
        // - "Desktop Only Step"
        // It should NOT show:
        // - "Mobile Only Step"
        expect(screen.getByText("All Viewports Step")).toBeInTheDocument();
        expect(screen.getByText("Desktop Only Step")).toBeInTheDocument();
        expect(screen.queryByText("Mobile Only Step")).not.toBeInTheDocument();

        // Restore original matchMedia
        window.matchMedia = originalMatchMedia;
    });

    it("handles target_not_found errors by advancing or reversing stepIndex based on direction", () => {
        const mockUser = {
            $id: "user1",
            prefs: {
                onboardingTours: {},
            },
        };

        render(
            <OnboardingTour
                tourKey="team_details"
                steps={[
                    { target: ".present-target", content: "Step 1" },
                    { target: ".missing-target", content: "Step 2" },
                    { target: ".third-target", content: "Step 3" },
                ]}
                user={mockUser}
                alwaysIncludeTargets={[
                    ".present-target",
                    ".missing-target",
                    ".third-target",
                ]}
            />,
        );

        // Cascade timers
        act(() => {
            jest.runOnlyPendingTimers();
        });
        act(() => {
            jest.runOnlyPendingTimers();
        });

        const joyrideInstance = screen.getByTestId("mock-joyride");
        expect(joyrideInstance).toBeInTheDocument();

        // Initially we are on index 0
        expect(screen.getByText("Step 1")).toBeInTheDocument();

        // 1. Simulate target not found going forward from step 2 (index 1)
        const forwardNotFoundBtn = screen.getByTestId("target-not-found-btn");
        act(() => {
            fireEvent.click(forwardNotFoundBtn);
        });

        // Timer cycles to update state
        act(() => {
            jest.runOnlyPendingTimers();
        });

        // The target_not_found event has index: 1, action: "next".
        // It should advance stepIndex to (1 + 1) = 2.
        expect(screen.getByText("Step 3")).toBeInTheDocument();

        // 2. Simulate target not found going backward (index: 1, action: "prev")
        const prevNotFoundBtn = screen.getByTestId("target-not-found-prev-btn");
        act(() => {
            fireEvent.click(prevNotFoundBtn);
        });

        act(() => {
            jest.runOnlyPendingTimers();
        });

        // It should decrement stepIndex to (1 - 1) = 0.
        expect(screen.getByText("Step 1")).toBeInTheDocument();
    });

    it("closes the controlled menu when terminating early due to target_not_found on the last step", () => {
        const mockUser = {
            $id: "user1",
            prefs: {
                onboardingTours: {},
            },
        };

        const eventListener = jest.fn();
        window.addEventListener("toggle-onboarding-menu", eventListener);

        render(
            <OnboardingTour
                tourKey="team_details"
                steps={[
                    { target: ".present-target", content: "Step 1" },
                    { target: ".missing-target", content: "Step 2" },
                ]}
                user={mockUser}
                menuId="game-details-menu"
                alwaysIncludeTargets={[".present-target", ".missing-target"]}
            />,
        );

        // Cascade timers
        act(() => {
            jest.runOnlyPendingTimers();
        });
        act(() => {
            jest.runOnlyPendingTimers();
        });

        // Trigger target-not-found-btn on step index 1 (which is the last step: length - 1)
        const forwardNotFoundBtn = screen.getByTestId("target-not-found-btn");
        act(() => {
            fireEvent.click(forwardNotFoundBtn);
        });

        act(() => {
            jest.runOnlyPendingTimers();
        });

        // Assert that the controlled menu close dispatch occurred
        expect(eventListener).toHaveBeenCalledWith(
            expect.objectContaining({
                detail: { open: false, menuId: "game-details-menu" },
            }),
        );

        window.removeEventListener("toggle-onboarding-menu", eventListener);
    });

    it("triggers the correct Umami analytics event when the tour is completed", () => {
        const mockUser = {
            $id: "user1",
            prefs: {
                onboardingTours: {},
            },
        };

        render(
            <OnboardingTour
                tourKey="team_details"
                steps={[{ target: ".present-target", content: "Step 1" }]}
                user={mockUser}
                alwaysIncludeTargets={[".present-target"]}
            />,
        );

        // Cascade timers
        act(() => {
            jest.runOnlyPendingTimers();
        });
        act(() => {
            jest.runOnlyPendingTimers();
        });

        // Trigger finish tour
        const finishBtn = screen.getByTestId("finish-btn");
        act(() => {
            fireEvent.click(finishBtn);
        });

        // Flush unmount timeout
        act(() => {
            jest.advanceTimersByTime(100);
        });

        expect(mockTrack).toHaveBeenCalledWith(
            "onboarding_tour_completed_teams",
            expect.objectContaining({
                tourKey: "team_details",
                userId: "user1",
            }),
        );
    });

    it("triggers the correct Umami analytics event when the tour is skipped", () => {
        const mockUser = {
            $id: "user2",
            prefs: {
                onboardingTours: {},
            },
        };

        render(
            <OnboardingTour
                tourKey="event_details"
                steps={[{ target: ".present-target", content: "Step 1" }]}
                user={mockUser}
                alwaysIncludeTargets={[".present-target"]}
            />,
        );

        // Cascade timers
        act(() => {
            jest.runOnlyPendingTimers();
        });
        act(() => {
            jest.runOnlyPendingTimers();
        });

        // Trigger skip tour
        const skipBtn = screen.getByTestId("skip-btn");
        act(() => {
            fireEvent.click(skipBtn);
        });

        // Flush unmount timeout
        act(() => {
            jest.advanceTimersByTime(100);
        });

        expect(mockTrack).toHaveBeenCalledWith(
            "onboarding_tour_skipped_events",
            expect.objectContaining({
                tourKey: "event_details",
                userId: "user2",
            }),
        );
    });

    it("triggers the correct Umami analytics event using custom trackingSuffix prop when provided", () => {
        const mockUser = {
            $id: "user3",
            prefs: {
                onboardingTours: {},
            },
        };

        render(
            <OnboardingTour
                tourKey="custom_tour"
                trackingSuffix="custom_value"
                steps={[{ target: ".present-target", content: "Step 1" }]}
                user={mockUser}
                alwaysIncludeTargets={[".present-target"]}
            />,
        );

        // Cascade timers
        act(() => {
            jest.runOnlyPendingTimers();
        });
        act(() => {
            jest.runOnlyPendingTimers();
        });

        // Trigger finish tour
        const finishBtn = screen.getByTestId("finish-btn");
        act(() => {
            fireEvent.click(finishBtn);
        });

        // Flush unmount timeout
        act(() => {
            jest.advanceTimersByTime(100);
        });

        expect(mockTrack).toHaveBeenCalledWith(
            "onboarding_tour_completed_custom_value",
            expect.objectContaining({
                tourKey: "custom_tour",
                userId: "user3",
            }),
        );
    });
});
