import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { render } from "../../utils/test-utils";
import BackButton from "../BackButton";
import { it } from "node:test";

const mockNavigate = jest.fn();
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useNavigate: () => mockNavigate,
}));

describe("BackButton Component", () => {
    beforeEach(() => {
        mockNavigate.mockClear();
    });

    it("renders with default text 'Back'", () => {
        render(<BackButton />);
        expect(screen.getByText("Back")).toBeInTheDocument();
    });

    it("renders with custom text", () => {
        render(<BackButton text="Go Home" />);
        expect(screen.getByText("Go Home")).toBeInTheDocument();
    });

    it("calls navigate(-1) by default when clicked", () => {
        render(<BackButton />);
        const button = screen.getByRole("button");
        fireEvent.click(button);
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    test("calls navigate('/some-path') when to prop is provided", () => {
        const path = "/some-path";
        render(<BackButton to={path} />);
        const button = screen.getByRole("button");
        fireEvent.click(button);
        expect(mockNavigate).toHaveBeenCalledWith(path);
    });
});
