import { Alert } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

export default function AlertIncomplete({ incompleteData, handleAlertClose }) {
    return (
        <Alert
            my="sm"
            autoContrast
            color="orange"
            icon={<IconInfoCircle />}
            onClose={handleAlertClose}
            radius="xl"
            title="Your profile is incomplete!"
            withCloseButton={true}
        >
            <p>Please provide the following information:</p>
            <ol>
                {incompleteData?.map(({ label }) => (
                    <li key={label}>{label}</li>
                ))}
            </ol>
        </Alert>
    );
};