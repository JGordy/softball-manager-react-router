import { render, screen } from "@/utils/test-utils";
import { DashboardSection } from "../DashboardSection";

describe("DashboardSection", () => {
    const items = [{ id: 1, name: "Item 1" }];
    const renderItem = (item) => <div key={item.id}>{item.name}</div>;

    it("renders title and items", () => {
        render(
            <DashboardSection
                title="Section Title"
                items={items}
                renderItem={renderItem}
            />,
        );

        expect(screen.getByText("Section Title")).toBeInTheDocument();
        expect(screen.getByText("Item 1")).toBeInTheDocument();
    });

    it("handles empty items list", () => {
        render(
            <DashboardSection
                title="Empty Section"
                items={[]}
                renderItem={renderItem}
            />,
        );

        expect(screen.getByText("Empty Section")).toBeInTheDocument();
        expect(screen.queryByText("Item 1")).not.toBeInTheDocument();
    });
});
