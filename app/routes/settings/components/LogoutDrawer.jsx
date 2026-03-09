import { Form } from "react-router";
import { Text, Button, Group } from "@mantine/core";
import { IconLogout2 } from "@tabler/icons-react";
import DrawerContainer from "@/components/DrawerContainer";

export default function LogoutDrawer({ opened, onClose }) {
    return (
        <DrawerContainer
            opened={opened}
            onClose={onClose}
            title="Confirm Log Out"
            size="md"
        >
            <Text size="md" mb="xl">
                Are you sure you want to log out? You will need to log in again
                to access your content.
            </Text>
            <Form method="post" action="/settings">
                <input type="hidden" name="_action" value="logout" />
                <Button
                    type="submit"
                    color="red"
                    variant="filled"
                    size="md"
                    fullWidth
                    leftSection={<IconLogout2 size={16} />}
                >
                    Yes, Log out
                </Button>
            </Form>
        </DrawerContainer>
    );
}
