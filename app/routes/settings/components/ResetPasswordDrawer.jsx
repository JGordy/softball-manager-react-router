import DrawerContainer from "@/components/DrawerContainer";
import UpdatePassword from "@/forms/UpdatePassword";

export default function ResetPasswordDrawer({ opened, onClose, user }) {
    return (
        <DrawerContainer
            opened={opened}
            onClose={onClose}
            title="Reset Password"
            size="md"
        >
            <UpdatePassword
                action="password-reset"
                actionRoute="/settings"
                confirmText="Yes, Reset my Password"
                user={user}
            />
        </DrawerContainer>
    );
}
