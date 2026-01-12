import { getDrawerTitle, getRunnerConfigs } from "../drawerUtils";

describe("getDrawerTitle", () => {
    const mockBatter = { firstName: "Joseph" };

    it("should return correct title for singles", () => {
        expect(getDrawerTitle("1B", mockBatter)).toBe("Joseph singles to...");
    });

    it("should return correct title for home runs", () => {
        expect(getDrawerTitle("HR", mockBatter)).toBe("Joseph homers to...");
    });

    it("should fallback to 'Batter' if no batter provided", () => {
        expect(getDrawerTitle("1B", null)).toBe("Batter singles to...");
    });

    it("should return default title for unknown action", () => {
        expect(getDrawerTitle("Unknown", mockBatter)).toBe(
            "Joseph - Select Position",
        );
    });

    it("should return correct title for Sacrifice Fly", () => {
        expect(getDrawerTitle("SF", mockBatter)).toBe("Joseph sac flies to...");
    });
});

describe("getRunnerConfigs", () => {
    const emptyRunners = { first: null, second: null, third: null };

    it("should return standard configs PLUS batter for regular hit", () => {
        const configs = getRunnerConfigs("1B", emptyRunners);
        expect(configs).toHaveLength(4);
        // Batter config IS added
        expect(configs.find((c) => c.base === "batter")).toBeDefined();
    });

    it("should add Batter config for Errors", () => {
        const configs = getRunnerConfigs("E", emptyRunners);
        expect(configs).toHaveLength(4);
        const batterConfig = configs.find((c) => c.base === "batter");
        expect(batterConfig).toBeDefined();
        expect(batterConfig.shouldShow).toBe(true);
    });

    it("should add Batter config for Fielder's Choice", () => {
        const configs = getRunnerConfigs("FC", emptyRunners);
        expect(configs).toHaveLength(4);
        expect(configs.find((c) => c.base === "batter")).toBeDefined();
    });

    it("should correctly set shouldShow based on existing runners", () => {
        const runners = { first: "p1", second: null, third: "p3" };
        const configs = getRunnerConfigs("1B", runners);

        const firstConfig = configs.find((c) => c.base === "first");
        const secondConfig = configs.find((c) => c.base === "second");
        const thirdConfig = configs.find((c) => c.base === "third");

        expect(firstConfig.shouldShow).toBe("p1"); // Truthy
        expect(secondConfig.shouldShow).toBe(null); // Falsy
        expect(thirdConfig.shouldShow).toBe("p3"); // Truthy
    });

    it("should provide correct options for a single (1B)", () => {
        const config = getRunnerConfigs("1B", {}).find(
            (c) => c.base === "batter",
        );
        expect(config.options).toHaveLength(3);
        expect(config.options.map((o) => o.value)).toEqual([
            "first",
            "second",
            "third",
        ]);
    });

    it("should provide correct options for a double (2B)", () => {
        const config = getRunnerConfigs("2B", {}).find(
            (c) => c.base === "batter",
        );
        expect(config.options).toHaveLength(2);
        expect(config.options.map((o) => o.value)).toEqual([
            "second",
            "third",
        ]);
    });

    it("should provide correct options for a triple (3B)", () => {
        const config = getRunnerConfigs("3B", {}).find(
            (c) => c.base === "batter",
        );
        expect(config.options).toHaveLength(1);
        expect(config.options.map((o) => o.value)).toEqual(["third"]);
    });

    it("should set hideStay=true for batter config on hits", () => {
        const config = getRunnerConfigs("1B", {}).find(
            (c) => c.base === "batter",
        );
        expect(config.hideStay).toBe(true);
    });
});
