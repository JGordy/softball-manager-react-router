import { render, screen, fireEvent } from "@/utils/test-utils";

import FormWrapper from "../FormWrapper";

const mockSubmit = jest.fn();
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useSubmit: () => mockSubmit,
    Form: ({ children, onSubmit, ...props }) => (
        <form onSubmit={onSubmit} {...props}>
            {children}
        </form>
    ),
}));

jest.mock("@/hooks/useModal", () => ({
    __esModule: true,
    default: () => ({
        closeAllModals: jest.fn(),
        openModal: jest.fn(),
    }),
}));

describe("FormWrapper", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders children and default buttons", () => {
        render(
            <FormWrapper action="test-action">
                <input name="testInput" defaultValue="testValue" />
            </FormWrapper>,
        );

        expect(screen.getByDisplayValue("testValue")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /confirm/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /cancel/i }),
        ).toBeInTheDocument();
    });

    it("submits FormData with action and custom route", () => {
        render(
            <FormWrapper action="test-action" actionRoute="/custom-route">
                <input name="testInput" defaultValue="testValue" />
            </FormWrapper>,
        );

        fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

        expect(mockSubmit).toHaveBeenCalledWith(expect.any(FormData), {
            action: "/custom-route",
            method: "post",
        });

        const formData = mockSubmit.mock.calls[0][0];
        expect(formData.get("testInput")).toBe("testValue");
        expect(formData.get("_action")).toBe("test-action");
    });

    it("calls onSubmit prop if provided", () => {
        const handleSubmit = jest.fn();
        render(
            <FormWrapper action="test-action" onSubmit={handleSubmit}>
                <input name="testInput" />
            </FormWrapper>,
        );

        fireEvent.submit(
            screen.getByRole("button", { name: /confirm/i }).closest("form"),
        );
        expect(handleSubmit).toHaveBeenCalled();
    });

    it("hides buttons when hideButtons is true", () => {
        render(
            <FormWrapper action="test-action" hideButtons={true}>
                <div data-testid="child" />
            </FormWrapper>,
        );

        expect(screen.getByTestId("child")).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: /confirm/i }),
        ).not.toBeInTheDocument();
    });
});
