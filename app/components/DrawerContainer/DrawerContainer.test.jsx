import { screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { render } from "@/utils/test-utils";
import * as MantineHooks from "@mantine/hooks";
import DrawerContainer from "./DrawerContainer";

describe("DrawerContainer Component", () => {
    afterEach(() => {
        cleanup();
    });

    it("does not render content when closed", () => {
        render(
            <DrawerContainer opened={false} title="Test Drawer">
                <div>Drawer Content</div>
            </DrawerContainer>,
        );

        expect(screen.queryByText("Drawer Content")).not.toBeInTheDocument();
    });

    it("renders children and title when opened", () => {
        render(
            <DrawerContainer opened={true} title="Test Drawer">
                <div>Drawer Content</div>
            </DrawerContainer>,
        );

        // Mantine Drawers render in a Portal, but testing-library can find them
        expect(screen.getByText("Test Drawer")).toBeInTheDocument();
        expect(screen.getByText("Drawer Content")).toBeInTheDocument();
    });

    it("calls onClose when escape key is pressed", async () => {
        const handleClose = jest.fn();
        render(
            <DrawerContainer opened={true} onClose={handleClose} title="Test">
                <div />
            </DrawerContainer>,
        );

        // Simulate pressing Escape (standard accessibility behavior for modals/drawers)
        fireEvent.keyDown(document.body, { key: "Escape" });

        await waitFor(() => {
            expect(handleClose).toHaveBeenCalledTimes(1);
        });
    });

    it("calls onClose when close button is clicked", async () => {
        const handleClose = jest.fn();
        render(
            <DrawerContainer opened={true} onClose={handleClose} title="Test">
                <div />
            </DrawerContainer>,
        );

        // Find close button by accessible name (added via closeButtonProps)
        const closeButton = screen.getByRole("button", {
            name: "Close drawer",
        });
        fireEvent.click(closeButton);

        await waitFor(() => {
            expect(handleClose).toHaveBeenCalledTimes(1);
        });
    });

    it("does not change position mid-open when useMediaQuery re-evaluates (regression: mobile flicker)", async () => {
        // Simulate starting as mobile (not desktop)
        let simulatedIsDesktop = false;
        const useMediaQuerySpy = jest
            .spyOn(MantineHooks, "useMediaQuery")
            .mockImplementation(() => simulatedIsDesktop);

        const { rerender } = render(
            <DrawerContainer opened={true} title="Test">
                <div />
            </DrawerContainer>,
        );

        // Grab the drawer element and capture its initial position attribute
        const drawerContent = document.querySelector("[data-drawer]");
        const initialPosition = drawerContent?.getAttribute("data-position");

        // Now simulate the virtual keyboard causing useMediaQuery to toggle
        simulatedIsDesktop = true;
        rerender(
            <DrawerContainer opened={true} title="Test">
                <div />
            </DrawerContainer>,
        );

        const positionAfterToggle = document
            .querySelector("[data-drawer]")
            ?.getAttribute("data-position");

        // The position should NOT have changed while the drawer is open
        expect(positionAfterToggle).toBe(initialPosition);

        useMediaQuerySpy.mockRestore();
    });
});
