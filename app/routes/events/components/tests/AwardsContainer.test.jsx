import * as router from "react-router";
import { render, screen, fireEvent, act } from "@/utils/test-utils";

import AwardsContainer from "../AwardsContainer";

// Mock dependencies
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useLocation: jest.fn(),
}));

jest.mock(
    "@/components/DrawerContainer",
    () =>
        ({ children, opened, title }) =>
            opened ? (
                <div role="dialog" aria-label={title}>
                    {children}
                </div>
            ) : null,
);

jest.mock("@/components/DeferredLoader");

jest.mock("../CardSection", () => ({ onClick, heading, subHeading }) => (
    <div onClick={onClick} data-testid="card-section">
        <h3>{heading}</h3>
        <div>{subHeading}</div>
    </div>
));

jest.mock("../AwardsDrawerContents", () => () => (
    <div data-testid="awards-contents" />
));

describe("AwardsContainer Component", () => {
    const defaultProps = {
        game: { $id: "game1" },
        team: { $id: "team1" },
        deferredData: { awards: { total: 0, rows: [] }, votes: { total: 0 } },
        user: { $id: "user1" },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        router.useLocation.mockReturnValue({
            pathname: "/events/1",
            search: "",
            hash: "",
        });
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("renders default state with 'Awards unavailable'", () => {
        render(<AwardsContainer {...defaultProps} />);

        expect(screen.getByText("Awards & Recognition")).toBeInTheDocument();
        expect(
            screen.getByText("Awards unavailable at this time"),
        ).toBeInTheDocument();
    });

    it("shows 'Voting in progress' if votes exist but no awards", () => {
        const props = {
            ...defaultProps,
            deferredData: {
                awards: { total: 0, rows: [] },
                votes: { total: 5 },
            },
        };
        render(<AwardsContainer {...props} />);

        expect(screen.getByText("Voting in progress")).toBeInTheDocument();
    });

    it("shows 'Awards ready for view' if awards exist", () => {
        const props = {
            ...defaultProps,
            deferredData: {
                awards: { total: 1, rows: [{ winner_user_id: "other" }] },
                votes: { total: 5 },
            },
        };
        render(<AwardsContainer {...props} />);

        expect(screen.getByText("Awards ready for view")).toBeInTheDocument();
    });

    it("shows 'You've received an award!' if user won", () => {
        const props = {
            ...defaultProps,
            deferredData: {
                awards: { total: 1, rows: [{ winner_user_id: "user1" }] },
                votes: { total: 5 },
            },
        };
        render(<AwardsContainer {...props} />);

        expect(
            screen.getByText("You've received an award!"),
        ).toBeInTheDocument();
    });

    it("opens drawer when clicked", () => {
        render(<AwardsContainer {...defaultProps} />);

        fireEvent.click(screen.getByTestId("card-section"));

        expect(
            screen.getByRole("dialog", { name: "Awards & Recognition" }),
        ).toBeInTheDocument();
        expect(screen.getByTestId("awards-contents")).toBeInTheDocument();
    });

    it("automatically opens drawer if hash is #awards", () => {
        router.useLocation.mockReturnValue({
            pathname: "/events/1",
            search: "",
            hash: "#awards",
        });

        render(<AwardsContainer {...defaultProps} />);

        // Timer of 500ms
        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(
            screen.getByRole("dialog", { name: "Awards & Recognition" }),
        ).toBeInTheDocument();
    });

    it("automatically opens drawer if query param open=awards", () => {
        router.useLocation.mockReturnValue({
            pathname: "/events/1",
            search: "?open=awards",
            hash: "",
        });

        render(<AwardsContainer {...defaultProps} />);

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(
            screen.getByRole("dialog", { name: "Awards & Recognition" }),
        ).toBeInTheDocument();
    });
});
