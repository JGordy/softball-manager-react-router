import { screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { render } from "@/utils/test-utils";
import MenuContainer from "../MenuContainer";

describe("MenuContainer Component", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders default trigger if no target provided", () => {
        render(<MenuContainer />);
        // Default target is an ActionIcon with IconDots
        // Mantine ActionIcon usually is a button
        expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders custom target", () => {
        render(<MenuContainer target={<button>Custom Target</button>} />);
        expect(screen.getByText("Custom Target")).toBeInTheDocument();
    });

    it("renders menu items and handles clicks", async () => {
        const handleClick = jest.fn();
        const sections = [
            {
                label: "Section 1",
                items: [
                    { key: "1", text: "Item 1", onClick: handleClick },
                    { key: "2", content: <span>Mixed Content</span> },
                ],
            },
        ];

        render(<MenuContainer sections={sections} />);

        // Click trigger to open menu
        const trigger = screen.getByRole("button");
        fireEvent.click(trigger);

        // Check content
        await waitFor(() => {
            expect(screen.getByText("Section 1")).toBeInTheDocument();
        });
        expect(screen.getByText("Item 1")).toBeInTheDocument();
        expect(screen.getByText("Mixed Content")).toBeInTheDocument();

        // Click item
        fireEvent.click(screen.getByText("Item 1"));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });
});
