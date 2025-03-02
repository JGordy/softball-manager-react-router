import { Container } from '@mantine/core';

export default function EventDetails({ loaderData }) {
    console.log('/events/:eventId > ', { loaderData });
    return (
        <Container>
            Event Details
        </Container>
    );
}