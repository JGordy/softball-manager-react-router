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
});
