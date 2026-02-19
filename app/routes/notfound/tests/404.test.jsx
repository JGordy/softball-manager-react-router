import { useNavigate } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";

import NotFound from "../404";

// Mock react-router
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useNavigate: jest.fn(),
}));

describe("404 NotFound Route", () => {
    it("renders 404 content", () => {
        render(<NotFound />);

        expect(screen.getByText("Nothing to see here")).toBeInTheDocument();
        expect(
            screen.getByText(/page you are trying to open does not exist/i),
        ).toBeInTheDocument();
    });

    it("navigates home on button click", () => {
        const navigate = jest.fn();
        useNavigate.mockReturnValue(navigate);

        render(<NotFound />);

        fireEvent.click(screen.getByText("Take me back to home page"));
        expect(navigate).toHaveBeenCalledWith("/");
    });
});
