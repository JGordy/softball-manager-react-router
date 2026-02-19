import { renderHook } from "@/utils/test-utils";
import { modals } from "@mantine/modals";

import useModal from "../useModal";

jest.mock("@mantine/modals", () => ({
    modals: {
        open: jest.fn(),
        closeAll: jest.fn(),
        updateModal: jest.fn(),
    },
}));

describe("useModal", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("openModal calls modals.open with correct default props", () => {
        const { result } = renderHook(() => useModal());

        const title = "Test Modal";
        const children = "Modal Content";

        result.current.openModal({ title, children, otherProp: "value" });

        expect(modals.open).toHaveBeenCalledWith({
            title,
            children,
            radius: "lg",
            overlayProps: {
                backgroundOpacity: 0.55,
                blur: 3,
            },
            otherProp: "value",
        });
    });

    it("updateModal calls modals.updateModal with correct defaults", () => {
        const { result } = renderHook(() => useModal());

        const id = "modal-id";
        const title = "Updated Modal";

        result.current.updateModal(id, { title });

        expect(modals.updateModal).toHaveBeenCalledWith(id, {
            title,
            children: undefined,
            overlayProps: {
                backgroundOpacity: 0.55,
                blur: 3,
            },
        });
    });

    it("closeAllModals calls modals.closeAll", () => {
        const { result } = renderHook(() => useModal());

        result.current.closeAllModals();

        expect(modals.closeAll).toHaveBeenCalled();
    });
});
