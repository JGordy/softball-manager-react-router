import { screen, fireEvent, cleanup, act } from "@testing-library/react";
import { render } from "@/utils/test-utils";
import OnboardingTour from "./OnboardingTour";

const mockSubmit = jest.fn();

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
        Joyride: ({ steps, run, onEvent }) => {
            React.useEffect(() => {
                if (run && steps.length > 0) {
                    onEvent({
                        type: "step:before",
                        step: steps[0],
                        index: 0,
                    });
                }
            }, [run, steps, onEvent]);

            return (
                <div data-testid="mock-joyride" data-run={String(run)}>
                    {steps.map((s, idx) => (
                        <div
                            key={idx}
                            data-testid={`step-${idx}`}
                            data-target={s.target}
                        >
                            {s.content}
                        </div>
                    ))}
                    <button
                        data-testid="next-btn"
                        onClick={() =>
                            onEvent({
                                type: "step:after",
                                index: 0,
                                action: "next",
                            })
                        }
                    >
                        Next Step
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
            { method: "post", action: "/settings" },
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

        // Finish the tour, which resets stepIndex
        const finishBtn = screen.getByTestId("finish-btn");
        act(() => {
            fireEvent.click(finishBtn);
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
});
