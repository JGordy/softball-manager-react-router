import { render, screen } from "@/utils/test-utils";
import EventLocationDrawer from "../EventLocationDrawer";

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

// Mock DeferredLoader
jest.mock("@/components/DeferredLoader", () => ({ children, resolve }) => {
    const data = resolve || {};
    return typeof children === "function" ? children(data) : children;
});

// Mock ParkDetailsDrawer
jest.mock("../ParkDetailsDrawer", () => () => (
    <div data-testid="mock-park-details" />
));

describe("EventLocationDrawer Component", () => {
    const defaultProps = {
        opened: true,
        onClose: jest.fn(),
        deferredData: {
            park: { name: "Central Park" },
        },
    };

    it("renders park location details inside DrawerContainer when opened and park exists", () => {
        render(<EventLocationDrawer {...defaultProps} />);

        expect(
            screen.getByRole("dialog", { name: "Location Details" }),
        ).toBeInTheDocument();
        expect(screen.getByTestId("mock-park-details")).toBeInTheDocument();
    });

    it("renders nothing if park does not exist", () => {
        const props = {
            ...defaultProps,
            deferredData: {
                park: null,
            },
        };
        const { container } = render(<EventLocationDrawer {...props} />);

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(
            screen.queryByTestId("mock-park-details"),
        ).not.toBeInTheDocument();
    });
});
