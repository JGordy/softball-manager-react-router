import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { ServerRouter } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { isbot } from "isbot";

// React Router reads `streamTimeout` from this module via build.entry.module.streamTimeout.
// In dev, Vite's SSR event loop slows Appwrite queries to 5-7s; raising this prevents
// the hardcoded 4950ms internal abort from firing before deferred data resolves.
// In production, Appwrite responds in ~400ms so the default 4950ms is more than enough.
export const streamTimeout =
    process.env.NODE_ENV === "development" ? 30_000 : 4_950;

// Give React 1 extra second beyond streamTimeout to flush remaining shell content.
const ABORT_DELAY = streamTimeout + 1_000;

export default function handleRequest(
    request,
    responseStatusCode,
    responseHeaders,
    routerContext,
) {
    return isbot(request.headers.get("user-agent") || "")
        ? handleBotRequest(
              request,
              responseStatusCode,
              responseHeaders,
              routerContext,
          )
        : handleBrowserRequest(
              request,
              responseStatusCode,
              responseHeaders,
              routerContext,
          );
}

function handleBotRequest(
    request,
    responseStatusCode,
    responseHeaders,
    routerContext,
) {
    return new Promise((resolve, reject) => {
        let shellRendered = false;
        const { pipe, abort } = renderToPipeableStream(
            <ServerRouter context={routerContext} url={request.url} />,
            {
                onAllReady() {
                    shellRendered = true;
                    const body = new PassThrough();
                    const stream = createReadableStreamFromReadable(body);
                    responseHeaders.set("Content-Type", "text/html");
                    resolve(
                        new Response(stream, {
                            headers: responseHeaders,
                            status: responseStatusCode,
                        }),
                    );
                    pipe(body);
                },
                onShellError(error) {
                    reject(error);
                },
                onError(error) {
                    responseStatusCode = 500;
                    if (shellRendered) {
                        console.error(error);
                    }
                },
            },
        );
        setTimeout(abort, ABORT_DELAY);
    });
}

function handleBrowserRequest(
    request,
    responseStatusCode,
    responseHeaders,
    routerContext,
) {
    return new Promise((resolve, reject) => {
        let shellRendered = false;
        const { pipe, abort } = renderToPipeableStream(
            <ServerRouter context={routerContext} url={request.url} />,
            {
                onShellReady() {
                    shellRendered = true;
                    const body = new PassThrough();
                    const stream = createReadableStreamFromReadable(body);
                    responseHeaders.set("Content-Type", "text/html");
                    resolve(
                        new Response(stream, {
                            headers: responseHeaders,
                            status: responseStatusCode,
                        }),
                    );
                    pipe(body);
                },
                onShellError(error) {
                    reject(error);
                },
                onError(error) {
                    responseStatusCode = 500;
                    if (shellRendered) {
                        console.error(error);
                    }
                },
            },
        );
        setTimeout(abort, ABORT_DELAY);
    });
}
