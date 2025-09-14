import { Suspense, useMemo } from "react";
import { Await } from "react-router";

/**
 * A reusable component to handle deferred data from React Router loaders.
 * It wraps the standard `Suspense` and `Await` components.
 *
 * @param {object} props
 * @param {Promise<any> | Promise<any>[]} props.resolve The promise or array of promises to resolve from the loader.
 * @param {React.ReactNode} props.fallback A fallback UI to show while the promise is pending.
 * @param {React.ReactNode} [props.errorElement] A fallback UI to show if the promise rejects.
 * @param {(data: any) => React.ReactNode} props.children A render prop that receives the resolved data.
 */
export default function DeferredLoader({
    resolve,
    fallback,
    errorElement,
    children,
}) {
    const promise = useMemo(() => {
        // Handles an array of promises
        if (Array.isArray(resolve)) {
            return Promise.all(resolve);
        }

        // Handles an object of promises
        if (typeof resolve === "object" && resolve !== null) {
            const keys = Object.keys(resolve);
            const promiseArray = Object.values(resolve);

            return Promise.all(promiseArray).then((results) => {
                const resolvedObject = {};
                keys.forEach((key, index) => {
                    resolvedObject[key] = results[index];
                });
                return resolvedObject;
            });
        }

        // Handles a single promise
        return resolve;
    }, [resolve]);

    return (
        <Suspense fallback={fallback}>
            <Await resolve={promise} errorElement={errorElement}>
                {children}
            </Await>
        </Suspense>
    );
}
