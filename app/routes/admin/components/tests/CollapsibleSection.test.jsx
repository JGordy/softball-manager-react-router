import { render, screen, fireEvent } from "@/utils/test-utils";
import { CollapsibleSection } from "../CollapsibleSection";

describe("CollapsibleSection", () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    const renderItem = (item) => <div key={item}>Item {item}</div>;

    it("renders only initialLimit items at first and toggles", () => {
        render(
            <CollapsibleSection
                items={items}
                initialLimit={3}
                renderItem={renderItem}
            />,
        );

        expect(screen.getByText("Item 1")).toBeInTheDocument();
        expect(screen.getByText("Item 2")).toBeInTheDocument();
        expect(screen.getByText("Item 3")).toBeInTheDocument();

        // Initially "See ... more"
        expect(screen.getByText("See 4 more...")).toBeInTheDocument();

        // Click to expand
        fireEvent.click(screen.getByText("See 4 more..."));
        expect(screen.getByText("Item 4")).toBeInTheDocument();
        expect(screen.getByText("Show Less")).toBeInTheDocument();

        // Click to collapse
        fireEvent.click(screen.getByText("Show Less"));
        expect(screen.getByText("See 4 more...")).toBeInTheDocument();
    });

    it("renders all items if items.length <= initialLimit", () => {
        render(
            <CollapsibleSection
                items={[1, 2]}
                initialLimit={3}
                renderItem={renderItem}
            />,
        );

        expect(screen.getByText("Item 1")).toBeInTheDocument();
        expect(screen.getByText("Item 2")).toBeInTheDocument();
        expect(screen.queryByText(/more/)).not.toBeInTheDocument();
    });
});
