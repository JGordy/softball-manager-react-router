import { useNavigate, useOutletContext } from 'react-router';
import { useState, useRef, useEffect } from 'react';

import {
    Accordion,
    Button,
    Divider,
    Group,
    Text,
    TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLogout2, IconPencil, IconMail, IconPhone, IconDeviceFloppy } from '@tabler/icons-react';

import { account } from '@/appwrite';

import DrawerContainer from '@/components/DrawerContainer';
import UserHeader from '@/components/UserHeader';

export default function Settings() {
    const { user, session } = useOutletContext();
    console.log({ user, session });

    const navigate = useNavigate();

    const [opened, { open, close }] = useDisclosure(false);

    // State for email editing
    const [areInputsEditable, setInputsEditable] = useState(false);
    const [currentEmail, setCurrentEmail] = useState(user?.email); // Local state for the email
    const [currentPhoneNumber, setCurrentPhoneNumber] = useState(user?.phoneNumber); // Local state for the phone
    const emailInputRef = useRef(null); // Ref for the TextInput

    // Focus the input when it becomes editable
    useEffect(() => {
        if (areInputsEditable && emailInputRef.current) {
            emailInputRef.current.focus();
        }
    }, [areInputsEditable]);

    const handleInputEditToggle = (event, action) => {
        event.preventDefault();
        console.log("handleInputEditToggle called", { event, action });
        setInputsEditable((prev) => !prev);
        // TODO: In a real application, if turning off editing, you'd trigger a save action here.
    };

    const logOutUser = async () => {
        await account.deleteSession(session.$id);
        navigate("/login");
    }

    const contactInputProps = {
        variant: "unstyled",
        my: "md",
        onBlur: (event) => handleInputEditToggle(event, 'save'),
        readOnly: !areInputsEditable, // Use readOnly to allow copying but prevent direct editing
        styles: { input: { cursor: areInputsEditable ? 'text' : 'default' } }
    };

    return (
        <div className="settings-container">
            <UserHeader subText={user.email} />

            <Accordion variant="separated" radius="md" defaultValue="account" mt="xl">

                <Accordion.Item value="leagues">
                    <Accordion.Control>Leagues</Accordion.Control>
                    <Accordion.Panel>
                        This feature is under development. Please check back later for updates.
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="account">
                    <Accordion.Control>Account</Accordion.Control>
                    <Accordion.Panel>
                        <Group justify="space-between">
                            <Text size="sm">Contact Details</Text>
                            {!areInputsEditable && (
                                <IconPencil
                                    style={{ cursor: 'pointer' }}
                                    onClick={(event) => handleInputEditToggle(event, 'edit')}
                                />
                            )}
                            {areInputsEditable && (
                                <IconDeviceFloppy
                                    style={{ cursor: 'pointer' }}
                                    onClick={(event) => handleInputEditToggle(event, 'save')}
                                />
                            )}
                        </Group>

                        <TextInput
                            {...contactInputProps}
                            ref={emailInputRef}
                            leftSection={<IconMail />}
                            value={currentEmail}
                            onChange={(event) => setCurrentEmail(event.target.value)}
                        />

                        <TextInput
                            {...contactInputProps}
                            leftSection={<IconPhone />}
                            value={currentPhoneNumber}
                            onChange={(event) => setCurrentPhoneNumber(event.target.value)}
                        />

                        <Divider my="sm" />

                        <Button
                            color="red"
                            onClick={open}
                            variant="subtle"
                            px="0px"
                            size="md"
                        >
                            <Group gap="xs">
                                <IconLogout2 size={16} mr='xs' />
                                Log out
                            </Group>
                        </Button>
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>

            <DrawerContainer
                opened={opened}
                onClose={close}
                title="Confirm Log Out"
            >
                <Text size="md" mb="xl">
                    Are you sure you want to log out? You will need to log in again to access your content.
                </Text>
                <Button
                    color="red"
                    onClick={logOutUser}
                    variant="filled"
                    size="md"
                    fullWidth
                >
                    <Group gap="xs">
                        <IconLogout2 size={16} mr='xs' />
                        Yes, Log out
                    </Group>
                </Button>
            </DrawerContainer>
        </div>
    );
};