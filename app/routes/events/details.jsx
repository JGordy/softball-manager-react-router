import { redirect, useOutletContext } from 'react-router';

import { Container } from "@mantine/core";

import { account } from '@/appwrite';

import LoaderDots from '@/components/LoaderDots';
import UserHeader from '@/components/UserHeader';

export async function clientLoader({ request }) {
    try {
        const session = await account.getSession("current");

        if (!session) {
            throw redirect("/login");
        }

        const { userId } = session;
        const response = await fetch('/api/teams', {
            method: 'POST',
            body: JSON.stringify({ userId, teamRoles: ['manager', 'player'] }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error fetching teams');
        }

        const { managing = [], playing = [] } = await response.json();

        return { userId, teams: { managing, playing } };

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
    const teams = loaderData?.teams;
    const { user } = useOutletContext();
    console.log('/events ', { user, teams });

    return (
        <Container p="md" mih="90vh">
            <UserHeader subText="Here are all of your events" />
            <div>Events list</div>
        </Container>
    );
};