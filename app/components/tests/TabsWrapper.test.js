import { render, screen, fireEvent } from "@/utils/test-utils";
import { Tabs } from "@mantine/core";
import TabsWrapper from "../TabsWrapper";

describe("TabsWrapper", () => {
    it("renders tabs and switches content (uncontrolled)", () => {
        render(
            <TabsWrapper defaultValue="tab1">
                <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
                <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
                <Tabs.Panel value="tab1">Content 1</Tabs.Panel>
                <Tabs.Panel value="tab2">Content 2</Tabs.Panel>
            </TabsWrapper>,
        );

        // Initial state
        expect(screen.getByText("Content 1")).toBeVisible();
        // Use queryByText and check if it's not visible or not in document depending on implementation.
        // Mantine Tabs Panel usually stays in DOM but hidden or removed.
        const content2 = screen.queryByText("Content 2");
        if (content2) {
            expect(content2).not.toBeVisible();
        }

        // Switch tab
        fireEvent.click(screen.getByText("Tab 2"));

        expect(screen.getByText("Content 2")).toBeVisible();
        const content1 = screen.queryByText("Content 1");
        if (content1) {
            expect(content1).not.toBeVisible();
        }
    });

    it("renders tabs and switches content (controlled)", () => {
        const handleChange = jest.fn();
        const { rerender } = render(
            <TabsWrapper value="tab1" onChange={handleChange}>
                <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
                <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
                <Tabs.Panel value="tab1">Content 1</Tabs.Panel>
                <Tabs.Panel value="tab2">Content 2</Tabs.Panel>
            </TabsWrapper>,
        );

        expect(screen.getByText("Content 1")).toBeVisible();

        fireEvent.click(screen.getByText("Tab 2"));
        expect(handleChange).toHaveBeenCalledWith("tab2");

        // Re-render with new value to simulate control update
        rerender(
            <TabsWrapper value="tab2" onChange={handleChange}>
                <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
                <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
                <Tabs.Panel value="tab1">Content 1</Tabs.Panel>
                <Tabs.Panel value="tab2">Content 2</Tabs.Panel>
            </TabsWrapper>,
        );
        expect(screen.getByText("Content 2")).toBeVisible();
    });
});
