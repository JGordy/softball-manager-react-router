import DrawerContainer from "@/components/DrawerContainer";
import DeferredLoader from "@/components/DeferredLoader";
import CalendarDetails from "./CalendarDetails";

/**
 * EventCalendarDrawer Component
 * Wraps the calendar details drawer inside a deferred load of park details.
 *
 * @param {Object} props - Component props.
 * @param {Boolean} props.opened - Whether the drawer is open.
 * @param {Function} props.onClose - Callback to close the drawer.
 * @param {Object} props.game - The active game document data.
 * @param {Promise|Object} props.deferredData - Resolved or pending data for park details.
 * @param {Object} props.team - The active team document data.
 * @returns {React.ReactElement} The calendar details drawer.
 */
export default function EventCalendarDrawer({
    opened,
    onClose,
    game,
    deferredData,
    team,
}) {
    return (
        <DeferredLoader
            resolve={deferredData}
            fallback={null}
            errorElement={null}
        >
            {({ park }) => (
                <DrawerContainer
                    opened={opened}
                    onClose={onClose}
                    title="Add Game to Calendar"
                    size="sm"
                >
                    <CalendarDetails game={game} park={park} team={team} />
                </DrawerContainer>
            )}
        </DeferredLoader>
    );
}
