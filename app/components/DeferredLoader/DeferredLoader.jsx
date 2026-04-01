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

    const isObject = (val) =>
        typeof val === "object" && val !== null && !val.then;
    const prevResolve = cacheRef.current.resolveRef;

    let shouldRecreate = prevResolve !== resolve;

    // Shallow equality check for objects to prevent endless loops from literal object/prop spreads
    if (shouldRecreate && isObject(prevResolve) && isObject(resolve)) {
        const prevKeys = Object.keys(prevResolve);
        const keys = Object.keys(resolve);
        if (prevKeys.length === keys.length) {
            shouldRecreate = !keys.every(
                (key) => prevResolve[key] === resolve[key],
            );
        }
    }

    if (shouldRecreate || cacheRef.current.promise == null) {
        let p;

        // Array of promises: resolve to an array of results
        if (typeof resolve === "function") {
            p = resolve();
        } else if (resolve && typeof resolve.then === "function") {
            p = resolve;
        } else if (typeof resolve === "object" && resolve !== null) {
            const keys = Object.keys(resolve);
            const promiseArray = Object.values(resolve);
            const isArray = Array.isArray(resolve);

            p = Promise.all(promiseArray).then((results) => {
                if (isArray) return results;

                const resolvedObject = {};
                keys.forEach((k, index) => {
                    resolvedObject[k] = results[index];
                });
                return resolvedObject;
            });
        } else {
            p = Promise.resolve(resolve);
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
