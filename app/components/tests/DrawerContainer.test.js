import { screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { render } from "@/utils/test-utils";
import DrawerContainer from "../DrawerContainer";

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

    it("calls onClose when overlay is clicked", async () => {
        const handleClose = jest.fn();
        render(
            <DrawerContainer opened={true} onClose={handleClose} title="Test">
                <div />
            </DrawerContainer>,
        );

        // Mantine renders an overlay div. We can find it by class or role usually.
        // The presentation role is often used for the overlay.
        const overlay = document.querySelector(".mantine-Overlay-root");
        fireEvent.click(overlay);

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

        // Mantine Drawer close button typically doesn't have an accessible name by default
        const closeButton = document.querySelector(".mantine-Drawer-close");
        fireEvent.click(closeButton);

        await waitFor(() => {
            expect(handleClose).toHaveBeenCalledTimes(1);
        });
    });
});
