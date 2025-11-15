import { useOutletContext } from "react-router";

import { Accordion, Container } from "@mantine/core";

import {
    updateAccountInfo,
    updatePassword,
    updateUser,
    resetPassword,
} from "@/actions/users";

import { logoutAction } from "@/actions/logout";

import UserHeader from "@/components/UserHeader";
import AccountPanel from "./components/AccountPanel";
import AuthPanel from "./components/AuthPanel";

export async function action({ request, context }) {
    const formData = await request.formData();
    const { _action, userId, ...values } = Object.fromEntries(formData);

    if (_action === "logout") {
        return logoutAction({ request, context });
    }

    if (_action === "update-profile-info") {
        return updateUser({ userId, values });
    }

    if (_action === "update-contact") {
        return updateAccountInfo({ values, request, context });
    }

    if (_action === "update-password") {
        return updatePassword({ values, request, context });
    }

    if (_action === "password-reset") {
        return resetPassword({ values, request, context });
    }

    return null;
}

export default function Settings({ actionData }) {
    const { user } = useOutletContext();

    return (
        <Container className="settings-container">
            <UserHeader subText={user?.email} />

            <Accordion
                variant="separated"
                radius="md"
                defaultValue="account"
                mt="xl"
            >
                <Accordion.Item value="account">
                    <Accordion.Control>Account</Accordion.Control>
                    <Accordion.Panel>
                        <AccountPanel actionData={actionData} />
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="authentication">
                    <Accordion.Control>Login Options</Accordion.Control>
                    <Accordion.Panel>
                        <AuthPanel actionData={actionData} />
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="leagues">
                    <Accordion.Control>Leagues</Accordion.Control>
                    <Accordion.Panel>
                        This feature is under development. Please check back
                        later for updates.
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
        </Container>
    );
}
