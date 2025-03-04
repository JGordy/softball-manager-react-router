import { Anchor, Button, Center, Text, Title } from '@mantine/core';

import { IconExternalLink } from '@tabler/icons-react';

export default function AvailabliityContainer({ availability, handleAttendanceFormClick }) {
    console.log('AvailabliityContainer: ', { availability });
    const { form, responses } = availability;

    return (
        <>
            {/* TODO: For this section we need to know all players that have checked in for this game */}
            {/* TODO: We would need the polling in place for this to work */}
            <Title order={4} align="center">This games player availabliity</Title>

            {form?.formId ? (
                <>
                    {(responses && Object.keys(responses).length > 0) ? (
                        <Text align="center" my="sm">We have availabliity responses!</Text>
                    ) : (
                        <Text align="center" my="sm">No responses yet!</Text>
                    )}
                    <Anchor
                        href={form.formUrl}
                        target="_blank"
                        fw={700}
                    >
                        <Button mt="lg" fullWidth>
                            <IconExternalLink size={18} style={{ display: 'inline', marginRight: '5px' }} />
                            Add your availability
                        </Button>
                    </Anchor>
                </>
            ) : (
                <>
                    <Text align="center" c="dimmed" my="lg">An availabliity form for this game has not yet been created. Create one below.</Text >
                    <Button mt="sm" onClick={handleAttendanceFormClick} fullWidth>
                        Generate availabliity form
                    </Button>
                </>
            )}
        </>
    );
};