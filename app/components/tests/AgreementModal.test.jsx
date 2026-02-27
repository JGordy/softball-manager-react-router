import { useFetcher } from "react-router";
import { modals } from "@mantine/modals";

import { render } from "@/utils/test-utils";

import useModal from "@/hooks/useModal";

import AgreementModal from "../AgreementModal";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useFetcher: jest.fn(),
}));

jest.mock("@/hooks/useModal", () => jest.fn());

jest.mock("@mantine/modals", () => ({
    modals: {
        close: jest.fn(),
    },
}));

describe("AgreementModal Component", () => {
    let mockSubmit;
    let mockOpenModal;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSubmit = jest.fn();
        useFetcher.mockReturnValue({
            submit: mockSubmit,
            state: "idle",
        });

        mockOpenModal = jest.fn();
        useModal.mockReturnValue({ openModal: mockOpenModal });
    });

    it("opens modal via useModal when user has not agreed to terms", () => {
        const user = { name: "Test User", agreedToTerms: false };
        render(<AgreementModal user={user} />);

        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({
                modalId: "agreement-modal",
                title: "App Updates & Agreements",
                withCloseButton: false,
            }),
        );
    });

    it("closes modal when user has agreed to terms", () => {
        const user = { name: "Test User", agreedToTerms: true };
        render(<AgreementModal user={user} />);

        expect(modals.close).toHaveBeenCalledWith("agreement-modal");
        expect(mockOpenModal).not.toHaveBeenCalled();
    });
});
