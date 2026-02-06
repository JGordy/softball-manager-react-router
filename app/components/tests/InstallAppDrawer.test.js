import { render, screen, fireEvent } from "@/utils/test-utils";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useNavigation } from "react-router";
import { useOs } from "@mantine/hooks";

import InstallAppDrawer from "../InstallAppDrawer";

jest.mock("@mantine/hooks", () => ({
    ...jest.requireActual("@mantine/hooks"),
    useOs: jest.fn(),
    useMediaQuery: jest.fn(),
}));

// Mocks
jest.mock("@/hooks/usePWAInstall");
jest.mock("@/utils/pwa", () => ({
    isStandalone: jest.fn(() => false),
    isDev: jest.fn(() => false),
}));
jest.mock("@/utils/analytics", () => ({
    trackEvent: jest.fn(),
}));

jest.mock("react-router", () => ({
    useNavigation: jest.fn(),
    useFetchers: () => [],
    useLocation: () => ({ pathname: "/" }),
}));

// Mock DrawerContainer
jest.mock("@/components/DrawerContainer", () => {
    return function MockDrawer({ opened, onClose, children }) {
        if (!opened) return null;
        return (
            <div data-testid="drawer">
                <button onClick={onClose} data-testid="close-button">
                    Close
                </button>
                {children}
            </div>
        );
    };
});

describe("InstallAppDrawer", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        usePWAInstall.mockReturnValue({
            isInstallable: true,
            promptInstall: jest.fn(),
        });
        useNavigation.mockReturnValue({ state: "idle" });
        useOs.mockReturnValue("ios");
    });

    const triggerSubmissionCycle = (props = {}) => {
        const { rerender } = render(<InstallAppDrawer {...props} />);

        // Initial render is IDLE (from beforeEach)

        // Start submitting
        useNavigation.mockReturnValue({ state: "submitting" });
        rerender(<InstallAppDrawer {...props} />);

        // Finish submitting
        useNavigation.mockReturnValue({ state: "idle" });
        rerender(<InstallAppDrawer {...props} />);
    };

    it("renders nothing if not installable (android)", () => {
        // Now working because we mocked isDev() to return false in the jest.mock above
        useOs.mockReturnValue("android");
        usePWAInstall.mockReturnValue({
            isInstallable: false,
            promptInstall: jest.fn(),
        });
        triggerSubmissionCycle();
        expect(screen.queryByTestId("drawer")).toBeNull();
    });

    it("opens automatically after submission cycle when conditions met", () => {
        triggerSubmissionCycle();
        expect(screen.getByTestId("drawer")).toBeInTheDocument();
    });

    it("shows iOS specific instructions", () => {
        useOs.mockReturnValue("ios");
        triggerSubmissionCycle();

        // Check for the individual segments because Mantine or HTML structure breaks up the node content
        expect(screen.getByText(/Tap/i)).toBeInTheDocument();
        expect(screen.getByText(/Share/i)).toBeInTheDocument();
        expect(screen.getByText(/toolbar/i)).toBeInTheDocument();
        expect(screen.getByText(/Add to Home Screen/i)).toBeInTheDocument();
    });

    it("shows generic/Android install button", () => {
        useOs.mockReturnValue("android");
        const promptInstallMock = jest.fn();
        usePWAInstall.mockReturnValue({
            isInstallable: true,
            promptInstall: promptInstallMock,
        });

        triggerSubmissionCycle();

        const installBtn = screen.getByRole("button", { name: /install now/i });
        fireEvent.click(installBtn);

        expect(promptInstallMock).toHaveBeenCalled();

        const closeBtn = screen.getByTestId("close-button");
        fireEvent.click(closeBtn);
        expect(screen.queryByTestId("drawer")).toBeNull();
    });

    it("dismisses and saves to local storage", () => {
        useOs.mockReturnValue("ios");
        triggerSubmissionCycle();

        fireEvent.click(screen.getByTestId("close-button"));

        expect(screen.queryByTestId("drawer")).toBeNull();
        expect(localStorage.getItem("install_drawer_dismissed")).toBeTruthy();
    });
});
