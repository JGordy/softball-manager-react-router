import { screen, fireEvent } from "@testing-library/react";
import { render } from "@/utils/test-utils";
import EditButton from "../EditButton";

describe("EditButton Component", () => {
    it("renders successfully", () => {
        render(<EditButton setIsModalOpen={jest.fn()} />);
        expect(screen.getByText("Edit")).toBeInTheDocument();
    });

    it("calls setIsModalOpen with true when clicked", () => {
        const setIsModalOpenMock = jest.fn();
        render(<EditButton setIsModalOpen={setIsModalOpenMock} />);

        const button = screen.getByRole("button", { name: /edit/i });
        fireEvent.click(button);

        expect(setIsModalOpenMock).toHaveBeenCalledTimes(1);
        expect(setIsModalOpenMock).toHaveBeenCalledWith(true);
    });
});
