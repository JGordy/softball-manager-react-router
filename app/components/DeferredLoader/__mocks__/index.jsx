export default function DeferredLoader({ children, resolve }) {
    // If resolve (deferredData) is provided, use it.
    // If not, provide a safe default empty object.
    const data = resolve || {};

    return typeof children === "function" ? children(data) : children;
}
