import { Button, Group, Text, Box } from "@mantine/core";

/**
 * Inline SVG logo for Appwrite.
 * @returns {JSX.Element}
 */
function AppwriteLogo() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 50 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <circle cx="25" cy="25" r="25" fill="#FD366E" />
            <path d="M25 7 L37 37 H31 L25 20 L19 37 H13 Z" fill="white" />
            <path d="M16.5 28 H33.5 L31.5 22 H18.5 Z" fill="#FD366E" />
        </svg>
    );
}

/**
 * Inline SVG logo for Sentry.
 * @returns {JSX.Element}
 */
function SentryLogo() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 72 66"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path
                d="M29.2 2.8C30.9 0 34.2 0 35.9 0s5.1 0 6.8 2.8L70 51.4c1.7 2.8.4 6.3-2.8 6.3H53.6c0-4.6-3.7-8.3-8.3-8.3s-8.3 3.7-8.3 8.3H8.8C5.6 57.7 4.3 54.2 6 51.4L29.2 2.8z"
                fill="#362D59"
            />
            <path d="M36 25 L46.5 44 H25.5 Z" fill="#F55050" />
        </svg>
    );
}

/**
 * Inline SVG logo for Render.
 * @returns {JSX.Element}
 */
function RenderLogo() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <rect width="64" height="64" rx="10" fill="#46E3B7" />
            <path
                d="M16 14 H36 C43.7 14 50 20.3 50 28 C50 35.7 43.7 42 36 42 H28 V50 H16 Z M28 30 H36 C37.1 30 38 29.1 38 28 C38 26.9 37.1 26 36 26 H28 Z"
                fill="#1a1a2e"
            />
        </svg>
    );
}

/**
 * Inline SVG logo for Google (used for the Beta Survey link).
 * @returns {JSX.Element}
 */
function GoogleLogo() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
        </svg>
    );
}

/**
 * Inline SVG logo for Umami Analytics.
 * @returns {JSX.Element}
 */
function UmamiLogo() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <rect width="64" height="64" rx="12" fill="#FF5C57" />
            <ellipse cx="32" cy="36" rx="16" ry="12" fill="white" />
            <ellipse cx="26" cy="30" rx="4" ry="5" fill="#FF5C57" />
            <ellipse cx="38" cy="30" rx="4" ry="5" fill="#FF5C57" />
            <ellipse cx="26" cy="31" rx="2" ry="2.5" fill="#1a1a2e" />
            <ellipse cx="38" cy="31" rx="2" ry="2.5" fill="#1a1a2e" />
        </svg>
    );
}

/** @type {Array<{label: string, href: string, logo: Function, color: string, mantineColor: string}>} */
const EXTERNAL_TOOLS = [
    {
        label: "Umami",
        href: "https://cloud.umami.is/analytics/us/websites/1e945f69-4632-4c87-a229-42769d855efa",
        logo: UmamiLogo,
        mantineColor: "red",
    },
    {
        label: "Appwrite",
        href: "https://cloud.appwrite.io/console/project-nyc-6a67a1f3000b347adb4d/overview/platforms",
        logo: AppwriteLogo,
        mantineColor: "pink",
    },
    {
        label: "Render",
        href: "https://dashboard.render.com/web/srv-cv69doan91rc73bdbrkg",
        logo: RenderLogo,
        mantineColor: "teal",
    },
    {
        label: "Sentry",
        href: "https://joseph-gordy.sentry.io/issues/?project=4510845363814400",
        logo: SentryLogo,
        mantineColor: "violet",
    },
    {
        label: "Beta Survey",
        href: "https://docs.google.com/forms/d/1rdlF1Cx73AOz79W5q6stVBCSUIjni6zVy-0yuhein74/edit#responses",
        logo: GoogleLogo,
        mantineColor: "blue",
    },
];

/**
 * A panel of quick-access buttons linking to external services used by the platform.
 * Replaces the previous dropdown menu with always-visible, branded buttons.
 *
 * @returns {JSX.Element}
 */
export function ExternalToolsPanel() {
    return (
        <Box mb="xl">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb="sm">
                External Services
            </Text>
            <Group gap="sm" wrap="wrap">
                {EXTERNAL_TOOLS.map(
                    ({ label, href, logo: Logo, mantineColor }) => (
                        <Button
                            key={label}
                            component="a"
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="light"
                            color={mantineColor}
                            leftSection={<Logo />}
                            radius="md"
                            size="sm"
                        >
                            {label}
                        </Button>
                    ),
                )}
            </Group>
        </Box>
    );
}
