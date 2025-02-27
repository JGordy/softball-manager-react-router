import { redirect } from 'react-router';

import { Container } from "@mantine/core";

import { account } from '@/appwrite';

import LoaderDots from '@/components/LoaderDots';

export async function clientLoader({ request }) {
    try {
        const session = await account.getSession("current");

        if (!session) {
            throw redirect("/login");
        }

        const { userId } = session;
        const response = await fetch('/api/profile', {
            method: 'POST',
            body: JSON.stringify({ userId, teamRoles: ['manager', 'player'] }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error fetching teams');
        }

        const { user, managing = [], playing = [] } = await response.json();

        return { user, userId, teams: { managing, playing } };

    } catch (error) {
        console.error("Error in clientLoader:", error);
        return redirect("/login");
    }
}

clientLoader.hydrate = true;

export function HydrateFallback() {
    return <LoaderDots message="Fetching your teams..." />;
}

export default function EventsDetails({ loaderData }) {
    console.log('/events ', { loaderData });

    return (
        <Container h="100vh">
            <div>Events list</div>
        </Container>
    );
};