import * as Sentry from "@sentry/react-router";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Adds request headers and IP for users, for more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/react-router/configuration/options/#sendDefaultPii
    sendDefaultPii: true,

    // Enable logs to be sent to Sentry
    enableLogs: true,

    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 0.1, // Capture 10% of the transactions
    profilesSampleRate: 0.1, // profile 10% of the transactions

    // Set up performance monitoring
    beforeSend(event) {
        // Filter out 404s from error reporting
        if (event.exception) {
            const error = event.exception.values?.[0];
            if (
                error?.type === "NotFoundException" ||
                error?.value?.includes("404")
            ) {
                return null;
            }
        }
        return event;
    },
});
