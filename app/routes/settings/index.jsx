import { useOutletContext } from "react-router";
import { useEffect, useState } from "react";

import { Accordion, Container } from "@mantine/core";

import { account } from "@/appwrite";

import { updateAccountInfo, updatePassword, updateUser, resetPassword } from "@/actions/users";

import UserHeader from "@/components/UserHeader";
import AccountPanel from "./components/AccountPanel";
import AuthPanel from "./components/AuthPanel";

export async function action({ request }) {
    const formData = await request.formData();
    const { _action, userId, ...values } = Object.fromEntries(formData);

    if (_action === "update-profile-info") {
        return updateUser({ userId, values });
    }

    return null;
}

export async function clientAction({ request, params }) {
    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);

    if (_action === "update-contact") {
        return updateAccountInfo({ values });
    }

    if (_action === "update-password") {
        return updatePassword({ values });
    }

    if (_action === "password-reset") {
        return resetPassword({ values, request });
    }

    return null;
}

export default function Settings({ actionData }) {
    const { user, session } = useOutletContext();

    const [userAccount, setUserAccount] = useState();

    console.log("/settings ", { user, session, userAccount });

    useEffect(() => {
        const getUserAccount = async () => {
            try {
                const _userAccount = await account.get();
                setUserAccount(_userAccount);
            } catch (error) {
                console.error("Error fetching user account:", error);
            }
        };
        if ((user && !userAccount) || user?.email !== userAccount?.email) {
            getUserAccount();
        }
    }, [account, user.email]);

    return (
        <Container className="settings-container">
            <UserHeader subText={user.email} />

            <Accordion variant="separated" radius="md" defaultValue="account" mt="xl">
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
                        This feature is under development. Please check back later for updates.
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
        </Container>
    );
}
