import { Suspense } from 'react';
import { Await } from 'react-router';

/**
 * A reusable component to handle deferred data from React Router loaders.
 * It wraps the standard `Suspense` and `Await` components.
 *
 * @param {object} props
 * @param {Promise<any>} props.resolve The promise to resolve from the loader.
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
    return (
        <Suspense fallback={fallback}>
            <Await resolve={resolve} errorElement={errorElement}>{children}</Await>
        </Suspense>
    );
}

