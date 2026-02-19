import { render, screen, waitFor } from "@testing-library/react";

import DeferredLoader from "../DeferredLoader";

// Mock React Router's Await component
jest.mock("react-router", () => {
    const React = require("react");
    return {
        Await: ({ resolve, children }) => {
            const [data, setData] = React.useState(null);
            const [isResolved, setIsResolved] = React.useState(false);

            React.useEffect(() => {
                if (!resolve) return;
                // Handle raw val, promise, or object/array of promises if DeferredLoader processed it
                Promise.resolve(resolve).then((val) => {
                    setData(val);
                    setIsResolved(true);
                });
            }, [resolve]);

            if (!isResolved) return null; // Suspense renders fallback
            return typeof children === "function" ? children(data) : children;
        },
        useAsyncValue: () => null,
    };
});

// Helper component to render resolved data
const DataRenderer = ({ data }) => (
    <div data-testid="resolved-data">{JSON.stringify(data)}</div>
);

describe("DeferredLoader", () => {
    it("renders children with resolved data", async () => {
        const promise = Promise.resolve({ success: true });

        render(
            <DeferredLoader resolve={promise} fallback={<div>Loading</div>}>
                {(data) => <DataRenderer data={data} />}
            </DeferredLoader>,
        );

        await waitFor(() => {
            expect(screen.getByTestId("resolved-data")).toHaveTextContent(
                '{"success":true}',
            );
        });
    });

    it("handles array of promises", async () => {
        const promises = [Promise.resolve("one"), Promise.resolve("two")];

        render(
            <DeferredLoader resolve={promises} fallback={<div>Loading</div>}>
                {(data) => <DataRenderer data={data} />}
            </DeferredLoader>,
        );

        await waitFor(() => {
            expect(screen.getByTestId("resolved-data")).toHaveTextContent(
                '["one","two"]',
            );
        });
    });
});
