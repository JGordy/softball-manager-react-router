import {
    getOpponentScoringSteps,
    getScoringFlowSteps,
    getMenuTarget,
} from "../onboardingSteps";

describe("onboardingSteps utilities", () => {
    describe("getMenuTarget", () => {
        it("should format correct menu target selector", () => {
            expect(getMenuTarget("test-menu", "item-key")).toBe(
                ".tour-test-menu-item-item-key",
            );
        });
    });

    describe("getOpponentScoringSteps", () => {
        it("should return the correct step definitions for Basic mode", () => {
            const steps = getOpponentScoringSteps("Basic");
            expect(steps).toBeInstanceOf(Array);
            expect(steps.length).toBeGreaterThan(5);
            expect(steps[0].target).toBe("body");
            expect(steps[1].target).toBe(".tour-fielding-out-btn");
        });

        it("should return the correct step definitions for Detailed mode", () => {
            const steps = getOpponentScoringSteps("Detailed");
            expect(steps).toBeInstanceOf(Array);
            expect(steps.length).toBeGreaterThan(5);
            expect(steps[0].target).toBe("body");
            expect(steps[1].target).toBe(".tour-current-batter-card");
        });
    });

    describe("getScoringFlowSteps", () => {
        it("should return the steps config with expected targets", () => {
            const steps = getScoringFlowSteps();
            expect(steps).toBeInstanceOf(Array);
            expect(steps.length).toBe(6);

            // Verify the targets of all steps in the scoring flow guide
            expect(steps[0].target).toBe("body");
            expect(steps[1].target).toBe(".tour-action-1b");
            expect(steps[2].target).toBe(".tour-spray-field");
            expect(steps[3].target).toBe(".tour-runner-advancement-dnd");
            expect(steps[4].target).toBe(".tour-confirm-play-btn");
            expect(steps[5].target).toBe(".tour-last-play-card");
        });
    });
});
