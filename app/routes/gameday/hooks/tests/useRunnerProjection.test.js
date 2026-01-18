import { renderHook } from "@testing-library/react";
import { useRunnerProjection } from "../useRunnerProjection";

describe("useRunnerProjection", () => {
    const defaultRunners = { first: null, second: null, third: null };

    it("should initialize with default results for a single", () => {
        const { result } = renderHook(() =>
            useRunnerProjection({
                opened: true,
                actionType: "1B",
                runners: defaultRunners,
                outs: 0,
            }),
        );

        expect(result.current.runnerResults).toEqual({
            first: null,
            second: null,
            third: null,
            batter: "first",
        });
    });

    it("should handle single with runner on first", () => {
        const runners = { first: "player1", second: null, third: null };
        const { result } = renderHook(() =>
            useRunnerProjection({
                opened: true,
                actionType: "1B",
                runners,
                outs: 0,
            }),
        );

        expect(result.current.runnerResults).toEqual({
            first: "second",
            second: null,
            third: null,
            batter: "first",
        });
    });

    it("should handle double with runners on first and second", () => {
        const runners = { first: "p1", second: "p2", third: null };
        const { result } = renderHook(() =>
            useRunnerProjection({
                opened: true,
                actionType: "2B",
                runners,
                outs: 0,
            }),
        );

        expect(result.current.runnerResults).toEqual({
            first: "third",
            second: "score",
            third: null,
            batter: "second",
        });
    });

    it("should handle HR with all runners", () => {
        const runners = { first: "p1", second: "p2", third: "p3" };
        const { result } = renderHook(() =>
            useRunnerProjection({
                opened: true,
                actionType: "HR",
                runners,
                outs: 0,
            }),
        );

        expect(result.current.runnerResults).toEqual({
            first: "score",
            second: "score",
            third: "score",
            batter: "score",
        });
        expect(result.current.runsScored).toBe(4);
    });

    it("should handle SF with runner on third", () => {
        const runners = { first: null, second: null, third: "p3" };
        const { result } = renderHook(() =>
            useRunnerProjection({
                opened: true,
                actionType: "SF",
                runners,
                outs: 0,
            }),
        );

        expect(result.current.runnerResults).toEqual({
            first: null,
            second: null,
            third: "score",
            batter: "out",
        });
        expect(result.current.runsScored).toBe(1);
        expect(result.current.outsRecorded).toBe(1);
    });

    it("should calculate projected state correctly", () => {
        const runners = { first: "p1", second: null, third: null };
        const { result } = renderHook(() =>
            useRunnerProjection({
                opened: true,
                actionType: "1B",
                runners,
                outs: 0,
            }),
        );

        expect(result.current.runsScored).toBe(0);
        expect(result.current.outsRecorded).toBe(0);
        expect(result.current.occupiedBases).toEqual({
            first: true,
            second: true,
            third: false,
        });
    });

    it("should return empty results when not opened", () => {
        const { result } = renderHook(() =>
            useRunnerProjection({
                opened: false,
                actionType: "1B",
                runners: defaultRunners,
                outs: 0,
            }),
        );

        expect(result.current.runnerResults).toEqual({});
    });
});
