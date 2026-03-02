import { Suspense, useRef } from "react";
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
    // Cache the produced promise in a ref. We keep the most recent `resolve`
    // reference (resolveRef) as well as the created promise. If the parent
    // passes a new `resolve` (different reference), we rebuild the promise so
    // the Await receives the fresh one. This ensures single promise inputs
    // (like `weatherPromise`) update correctly when the loader returns a
    // new promise instance.
    //
    // cacheRef shape: { resolveRef: any|null, promise: Promise|null }
    const cacheRef = useRef({ resolveRef: null, promise: null });

    const shouldRecreate = cacheRef.current.resolveRef !== resolve;

    if (shouldRecreate || cacheRef.current.promise == null) {
        let p;

        // Array of promises: resolve to an array of results
        if (Array.isArray(resolve)) {
            p = Promise.all(resolve);

            // Object of promises: resolve values and reconstruct an object
            // Guard: if `resolve` itself is a Promise/thenable, treat it as a
            // single promise. Many promise implementations are objects, so we
            // must check for a `then` function before assuming a plain object.
        } else if (resolve && typeof resolve.then === "function") {
            // thenable/promise: use as-is
            p = resolve;
        } else if (typeof resolve === "object" && resolve !== null) {
            const keys = Object.keys(resolve);
            const promiseArray = Object.values(resolve);
            p = Promise.all(promiseArray).then((results) => {
                const resolvedObject = {};
                keys.forEach((k, index) => {
                    resolvedObject[k] = results[index];
                });
                return resolvedObject;
            });

            // Single promise: use as-is
        } else {
            p = resolve;
        }

        cacheRef.current.resolveRef = resolve;
        cacheRef.current.promise = p;
    }

    const promise = cacheRef.current.promise;

    return (
        <Suspense fallback={fallback}>
            <Await resolve={promise} errorElement={errorElement}>
                {children}
            </Await>
        </Suspense>
    );
}
