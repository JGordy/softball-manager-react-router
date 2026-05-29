import { useMemo } from "react";
import { DateTime } from "luxon";
import DrawerContainer from "@/components/DrawerContainer";
import DeferredLoader from "@/components/DeferredLoader";
import InlineError from "@/components/InlineError";
import AvailablityContainer from "./AvailablityContainer";

/**
 * AvailabilityDrawer Component
 * Wraps the availability status list for players in a Drawer Container.
 *
 * @param {Object} props - Component props.
 * @param {Boolean} props.opened - Whether the drawer is open.
 * @param {Function} props.onClose - Callback to close the drawer.
 * @param {Object} props.game - The active game document data.
 * @param {Promise|Object} props.deferredData - Resolved or pending data for attendance.
 * @param {Boolean} props.managerView - Whether the logged-in user is a manager.
 * @param {Object} props.team - The active team document data.
 * @returns {React.ReactElement} The availability drawer.
 */
export default function AvailabilityDrawer({
    opened,
    onClose,
    game,
    deferredData,
    managerView,
    team,
}) {
    const dateStr = useMemo(() => {
        const gameDt = DateTime.fromISO(game.gameDate, { zone: "utc" }).setZone(
            game.timeZone || "local",
        );
        return gameDt.toFormat("M/d");
    }, [game.gameDate, game.timeZone]);

    return (
        <DrawerContainer
            opened={opened}
            onClose={onClose}
            title={`Vs ${game.opponent || "TBD"} on ${dateStr}`}
            size="95%"
        >
            <DeferredLoader
                resolve={deferredData}
                errorElement={
                    <InlineError message="Unable to load availability data" />
                }
            >
                {({ attendance, players }) => (
                    <AvailablityContainer
                        attendance={attendance}
                        game={game}
                        managerView={managerView}
                        players={players}
                        team={team}
                    />
                )}
            </DeferredLoader>
        </DrawerContainer>
    );
}
