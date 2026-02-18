import { useNavigate } from "react-router";
import { screen, cleanup, waitFor } from "@testing-library/react";

import { render } from "@/utils/test-utils";
import { account } from "@/utils/appwrite/client";

import Verify, { loader } from "../verify";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useNavigate: jest.fn(),
}));

jest.mock("@/utils/appwrite/client", () => ({
    account: {
        updateVerification: jest.fn(),
    },
}));

describe("Verify Route", () => {
    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    describe("loader", () => {
        it("extracts params from URL", async () => {
            const request = new Request(
                "http://localhost/verify?userId=user1&secret=secret123",
            );
            const result = await loader({ request });
            expect(result).toEqual({ userId: "user1", secret: "secret123" });
        });
    });

    describe("Component", () => {
        const mockNavigate = jest.fn();

        beforeEach(() => {
            useNavigate.mockReturnValue(mockNavigate);
        });

        it("shows error if params missing", () => {
            render(<Verify loaderData={{}} />);
            expect(
                screen.getByText("Missing verification parameters"),
            ).toBeInTheDocument();
        });

        it("verifies account and redirects on success", async () => {
            jest.useFakeTimers();
            account.updateVerification.mockResolvedValue({});

            render(
                <Verify
                    loaderData={{ userId: "user1", secret: "secret123" }}
                />,
            );

            expect(screen.getByText("Verifying...")).toBeInTheDocument();
            expect(account.updateVerification).toHaveBeenCalledWith(
                "user1",
                "secret123",
            );

            await waitFor(() => {
                expect(
                    screen.getByText(/Account verified successfully/i),
                ).toBeInTheDocument();
            });

            jest.advanceTimersByTime(3000);
            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith("/login");
            });
        });

        it("shows error if verification fails", async () => {
            account.updateVerification.mockRejectedValue(
                new Error("Verification failed"),
            );

            render(
                <Verify
                    loaderData={{ userId: "user1", secret: "secret123" }}
                />,
            );

            await waitFor(() => {
                expect(
                    screen.getByText(/Verification failed/i),
                ).toBeInTheDocument();
            });
        });
    });
});
