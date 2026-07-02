import { Skeleton } from "@mantine/core";
import DrawerContainer from "@/components/DrawerContainer";
import DeferredLoader from "@/components/DeferredLoader";
import InlineError from "@/components/InlineError";
import ParkDetailsDrawer from "./ParkDetailsDrawer";

/**
 * EventLocationDrawer Component
 * Wraps the park details drawer with a deferred load of park details inside.
 *
 * @param {Object} props - Component props.
 * @param {Boolean} props.opened - Whether the drawer is open.
 * @param {Function} props.onClose - Callback to close the drawer.
 * @param {Promise|Object} props.deferredData - Resolved or pending data for park details.
 * @returns {React.ReactElement} The location/park details drawer.
 */
export default function EventLocationDrawer({ opened, onClose, deferredData }) {
    // If deferredData is already resolved and park is explicitly missing, render nothing.
    if (
        deferredData &&
        typeof deferredData.then !== "function" &&
        !deferredData.park
    ) {
        return null;
    }

    return (
        <DrawerContainer
            opened={opened}
            onClose={onClose}
            title="Location Details"
            size="sm"
        >
            <DeferredLoader
                resolve={deferredData}
                fallback={<Skeleton height={200} radius="md" />}
                errorElement={
                    <InlineError message="Error loading location details" />
                }
            >
                {({ park }) =>
                    park ? (
                        <ParkDetailsDrawer park={park} />
                    ) : (
                        <InlineError message="No location details available" />
                    )
                }
            </DeferredLoader>
        </DrawerContainer>
    );
}
