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
    // Cache the produced promise in a ref. This prevents re-creating a new
    // Promise when the `resolve` value changes identity across renders but
    // represents the same underlying data. Without this cache, a new
    // promise would retrigger the Suspense/Await cycle and can cause
    // repeated suspensions or UI flicker.
    //
    // cacheRef shape: { key: string|null, promise: Promise|null }
    const cacheRef = useRef({ key: null, promise: null });

    const makeKey = (r) => {
        // Create a light-weight key that describes the shape of `resolve`.
        // We purposely do not try to deep-serialize the values here because
        // some router-provided promises are not serializable and we only
        // need a stable indicator to avoid unnecessary promise recreation.
        if (Array.isArray(r)) return `array:${r.length}`;
        if (typeof r === "object" && r !== null)
            return `object:${Object.keys(r).join(",")}`;
        return `single`;
    };

    const key = makeKey(resolve);

    // If the cache key changed (or there's no cached promise yet), build a
    // new promise that represents the resolved shape. We support three
    // common forms for `resolve`:
    // - Array of promises -> Promise.all(array)
    // - Object whose values are promises -> Promise.all on values and map
    //   results back to an object with the same keys
    // - Single promise -> use it directly
    //
    // The resulting promise is stored in the ref so subsequent renders with
    // the same shape won't recreate it.
    if (cacheRef.current.key !== key || cacheRef.current.promise == null) {
        let p;

        // Array of promises: resolve to an array of results
        if (Array.isArray(resolve)) {
            p = Promise.all(resolve);

            // Object of promises: resolve values and reconstruct an object
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

        cacheRef.current.key = key;
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
