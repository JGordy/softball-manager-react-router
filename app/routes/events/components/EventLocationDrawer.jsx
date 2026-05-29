import DrawerContainer from "@/components/DrawerContainer";
import DeferredLoader from "@/components/DeferredLoader";
import ParkDetailsDrawer from "./ParkDetailsDrawer";

/**
 * EventLocationDrawer Component
 * Wraps the park details drawer inside a deferred load of park details.
 *
 * @param {Object} props - Component props.
 * @param {Boolean} props.opened - Whether the drawer is open.
 * @param {Function} props.onClose - Callback to close the drawer.
 * @param {Promise|Object} props.deferredData - Resolved or pending data for park details.
 * @returns {React.ReactElement} The location/park details drawer.
 */
export default function EventLocationDrawer({ opened, onClose, deferredData }) {
    return (
        <DeferredLoader
            resolve={deferredData}
            fallback={null}
            errorElement={null}
        >
            {({ park }) =>
                park ? (
                    <DrawerContainer
                        opened={opened}
                        onClose={onClose}
                        title="Location Details"
                        size="sm"
                    >
                        <ParkDetailsDrawer park={park} />
                    </DrawerContainer>
                ) : null
            }
        </DeferredLoader>
    );
}
