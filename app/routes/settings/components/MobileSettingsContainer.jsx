import { Accordion } from "@mantine/core";

import AccountPanel from "./AccountPanel";
import AuthPanel from "./AuthPanel";
import NotificationsPanel from "./NotificationsPanel";
import SupportPanel from "./SupportPanel";
import PoliciesPanel from "./PoliciesPanel";
import AppPreferencesPanel from "./AppPreferencesPanel";

export default function MobileSettingsContainer({ actionData, teams }) {
    return (
        <Accordion
            variant="separated"
            radius="md"
            defaultValue="preferences"
            mt="xl"
            data-testid="mobile-settings-container"
        >
            <Accordion.Item value="preferences">
                <Accordion.Control>App Preferences</Accordion.Control>
                <Accordion.Panel>
                    <AppPreferencesPanel teams={teams} />
                </Accordion.Panel>
            </Accordion.Item>

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

            <Accordion.Item value="notifications">
                <Accordion.Control>Notifications</Accordion.Control>
                <Accordion.Panel>
                    <NotificationsPanel teams={teams} />
                </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="support">
                <Accordion.Control>Support</Accordion.Control>
                <Accordion.Panel>
                    <SupportPanel />
                </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="policies">
                <Accordion.Control>Policies & Agreements</Accordion.Control>
                <Accordion.Panel>
                    <PoliciesPanel />
                </Accordion.Panel>
            </Accordion.Item>
        </Accordion>
    );
}
