import { render, screen, fireEvent } from "@/utils/test-utils";

import AwardsContainer from "../AwardsContainer";

jest.mock("@/components/DeferredLoader");

jest.mock("../CardSection", () => ({ onClick, heading, subHeading }) => (
    <div onClick={onClick} data-testid="card-section">
        <h3>{heading}</h3>
        <div>{subHeading}</div>
    </div>
));

describe("AwardsContainer Component", () => {
    const defaultProps = {
        deferredData: { awards: { total: 0, rows: [] }, votes: { total: 0 } },
        user: { $id: "user1" },
        onOpen: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
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

    it("calls onOpen when clicked", () => {
        render(<AwardsContainer {...defaultProps} />);

        fireEvent.click(screen.getByTestId("card-section"));

        expect(defaultProps.onOpen).toHaveBeenCalledTimes(1);
    });
});
