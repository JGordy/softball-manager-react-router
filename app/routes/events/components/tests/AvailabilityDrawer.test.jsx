import { render, screen } from "@/utils/test-utils";
import AvailabilityDrawer from "../AvailabilityDrawer";

// Mock DrawerContainer
jest.mock(
    "@/components/DrawerContainer",
    () =>
        ({ children, opened, title }) =>
            opened ? (
                <div role="dialog" aria-label={title}>
                    <h2>{title}</h2>
                    {children}
                </div>
            ) : null,
);

// Mock DeferredLoader to immediately call children with mock data
jest.mock("@/components/DeferredLoader", () => ({ children, resolve }) => {
    const data = resolve || {};
    return typeof children === "function" ? children(data) : children;
});

// Mock AvailablityContainer
jest.mock("../AvailablityContainer", () => () => (
    <div data-testid="mock-availability-container" />
));

describe("AvailabilityDrawer Component", () => {
    const defaultProps = {
        opened: true,
        onClose: jest.fn(),
        game: {
            gameDate: "2023-10-10T19:00:00Z",
            timeZone: "UTC",
            opponent: "Rivals",
        },
        deferredData: {
            attendance: { rows: [] },
            players: [],
        },
        managerView: false,
        team: { name: "Team A" },
    };

    it("renders drawer container when opened", () => {
        render(<AvailabilityDrawer {...defaultProps} />);

        expect(
            screen.getByRole("dialog", { name: "Vs Rivals on 10/10" }),
        ).toBeInTheDocument();
        expect(
            screen.getByTestId("mock-availability-container"),
        ).toBeInTheDocument();
    });

    it("renders fallback text if game opponent is missing", () => {
        const props = {
            ...defaultProps,
            game: {
                ...defaultProps.game,
                opponent: null,
            },
        };
        render(<AvailabilityDrawer {...props} />);

        expect(
            screen.getByRole("dialog", { name: "Vs TBD on 10/10" }),
        ).toBeInTheDocument();
    });
});
