import { useFetcher, useRevalidator } from "react-router";
import { modals } from "@mantine/modals";
import { screen, fireEvent, waitFor } from "@testing-library/react";

import { render } from "@/utils/test-utils";

import useModal from "@/hooks/useModal";

import AgreementModal, { AgreementModalContent } from "../AgreementModal";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useFetcher: jest.fn(),
    useRevalidator: jest.fn(),
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
    let mockRevalidate;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSubmit = jest.fn();
        useFetcher.mockReturnValue({
            submit: mockSubmit,
            state: "idle",
            data: null,
        });

        mockRevalidate = jest.fn();
        useRevalidator.mockReturnValue({ revalidate: mockRevalidate });

        mockOpenModal = jest.fn();
        useModal.mockReturnValue({ openModal: mockOpenModal });
    });

    describe("AgreementModal", () => {
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

    describe("AgreementModalContent", () => {
        it("renders content and handles agreement submission", () => {
            const user = { name: "Test User" };
            render(<AgreementModalContent user={user} />);

            expect(
                screen.getByText(/Before you continue/i),
            ).toBeInTheDocument();
            expect(
                screen.getByText(/Beta User Agreement/i),
            ).toBeInTheDocument();
            expect(
                screen.getByText(/Privacy Policy for Rostrhq.app/i),
            ).toBeInTheDocument();

            const agreeButton = screen.getByRole("button", {
                name: /I Agree/i,
            });
            fireEvent.click(agreeButton);

            expect(mockSubmit).toHaveBeenCalledWith(
                {},
                {
                    method: "post",
                    action: "/api/agreements",
                },
            );
        });

        it("revalidates and closes modal on successful agreement", async () => {
            const user = { name: "Test User" };
            const { rerender } = render(<AgreementModalContent user={user} />);

            // Simulate successful submission
            useFetcher.mockReturnValue({
                submit: mockSubmit,
                state: "idle",
                data: { success: true },
            });

            rerender(<AgreementModalContent user={user} />);

            await waitFor(() => {
                expect(mockRevalidate).toHaveBeenCalled();
                expect(modals.close).toHaveBeenCalledWith("agreement-modal");
            });
        });

        it("shows loading state when submitting", () => {
            const user = { name: "Test User" };
            useFetcher.mockReturnValue({
                submit: mockSubmit,
                state: "submitting",
                data: null,
            });

            render(<AgreementModalContent user={user} />);

            const agreeButton = screen.getByRole("button", {
                name: /I Agree/i,
            });
            expect(agreeButton).toHaveAttribute("data-loading", "true");
        });
    });
});
