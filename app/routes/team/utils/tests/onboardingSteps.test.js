import { getTeamDetailsSteps } from "../onboardingSteps";

describe("onboardingSteps utility", () => {
    describe("getTeamDetailsSteps", () => {
        it("should return an array of onboarding steps with expected targets", () => {
            const steps = getTeamDetailsSteps();

            expect(Array.isArray(steps)).toBe(true);
            expect(steps.length).toBeGreaterThan(0);

            const targets = steps.map((step) => step.target);

            expect(targets).toContain(".tour-team-title");
            expect(targets).toContain(".tour-team-menu");
            expect(targets).toContain(
                ".tour-team-details-menu-section-team-options",
            );
            expect(targets).toContain(
                ".tour-team-details-menu-section-lineup-options",
            );
            expect(targets).toContain(".tour-team-details-menu-section-roster");
            expect(targets).toContain(".tour-roster-section-desktop");
            expect(targets).toContain(".tour-seasons-overview");
            expect(targets).toContain(".tour-mobile-tabs");
        });
    });
});
