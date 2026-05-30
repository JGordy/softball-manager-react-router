import { screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { render } from "@/utils/test-utils";
import MenuContainer from "./MenuContainer";

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

    it("assigns formatted class name to sections", async () => {
        const sections = [
            {
                label: "Team Options",
                items: [{ key: "1", text: "Item 1" }],
            },
            {
                label: "Roster",
                items: [{ key: "2", text: "Item 2" }],
            },
        ];

        const { container } = render(<MenuContainer sections={sections} />);

        const trigger = screen.getByRole("button");
        fireEvent.click(trigger);

        await waitFor(() => {
            expect(screen.getByText("Team Options")).toBeInTheDocument();
        });

        const teamOptionsSection = document.querySelector(
            ".tour-menu-section-team-options",
        );
        expect(teamOptionsSection).toBeInTheDocument();
        expect(teamOptionsSection).toHaveTextContent("Team Options");

        const rosterSection = document.querySelector(
            ".tour-menu-section-roster",
        );
        expect(rosterSection).toBeInTheDocument();
        expect(rosterSection).toHaveTextContent("Roster");
    });

    it("responds to toggle-onboarding-menu custom events only when id matches", async () => {
        const sections = [
            {
                label: "Team Options",
                items: [{ key: "1", text: "Item 1" }],
            },
        ];

        render(<MenuContainer sections={sections} id="test-scoped-menu" />);

        // Dispatch toggle event with mismatching menuId
        fireEvent(
            window,
            new CustomEvent("toggle-onboarding-menu", {
                detail: { open: true, menuId: "other-menu-id" },
            }),
        );

        // Menu should not open
        expect(screen.queryByText("Team Options")).not.toBeInTheDocument();

        // Dispatch toggle event with matching menuId
        fireEvent(
            window,
            new CustomEvent("toggle-onboarding-menu", {
                detail: { open: true, menuId: "test-scoped-menu" },
            }),
        );

        // Menu should open
        await waitFor(() => {
            expect(screen.getByText("Team Options")).toBeInTheDocument();
        });

        // Dispatch toggle event with matching menuId to close
        fireEvent(
            window,
            new CustomEvent("toggle-onboarding-menu", {
                detail: { open: false, menuId: "test-scoped-menu" },
            }),
        );

        // Menu should close
        await waitFor(() => {
            expect(screen.queryByText("Team Options")).not.toBeInTheDocument();
        });
    });
});
