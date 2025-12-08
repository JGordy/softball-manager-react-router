import { useFetcher } from "react-router";
import { Tabs } from "@mantine/core";

import TabsWrapper from "@/components/TabsWrapper";
import BattingOrderEditor from "./Batting/BattingOrderEditor";
import FieldingDepthChart from "./Fielding/FieldingDepthChart";

export default function TeamLineupContainer({
    team,
    managerView,
    players,
    idealLineup, // Array of player IDs
    lineupHandlers, // useListState handlers for idealLineup
    idealPositioning, // Object of position -> Array of player IDs
    setIdealPositioning,
}) {
    const fetcher = useFetcher();

    const submitBattingOrder = (newLineup) => {
        try {
            const formData = new FormData();
            formData.append("_action", "save-batting-order");
            formData.append("idealLineup", JSON.stringify(newLineup));

            fetcher.submit(formData, {
                method: "post",
                action: `/team/${team.$id}/lineup`,
            });
        } catch (error) {
            console.error("Error submitting batting order:", error);
        }
    };

    const submitFieldingPositions = (newPositioning) => {
        try {
            const formData = new FormData();
            formData.append("_action", "save-fielding-positions");
            formData.append("idealPositioning", JSON.stringify(newPositioning));

            fetcher.submit(formData, {
                method: "post",
                action: `/team/${team.$id}/lineup`,
            });
        } catch (error) {
            console.error("Error submitting fielding positions:", error);
        }
    };

    const handleBattingReorder = ({ from, to }) => {
        if (from === to) return;

        lineupHandlers.reorder({ from, to });

        // Calculate new lineup for database save
        const newLineup = [...idealLineup];
        const [moved] = newLineup.splice(from, 1);
        newLineup.splice(to, 0, moved);
        submitBattingOrder(newLineup);
    };

    const handlePositionUpdate = (position, playerIds) => {
        const newPositioning = {
            ...idealPositioning,
            [position]: playerIds,
        };

        setIdealPositioning(newPositioning);
        submitFieldingPositions(newPositioning);
    };

    return (
        <TabsWrapper defaultValue="batting">
            <Tabs.Tab value="batting">Batting Order</Tabs.Tab>
            <Tabs.Tab value="fielding">Fielding Depth Chart</Tabs.Tab>

            <Tabs.Panel value="batting" pt="xs">
                <BattingOrderEditor
                    lineup={idealLineup}
                    players={players}
                    handleReorder={handleBattingReorder}
                    managerView={managerView}
                />
            </Tabs.Panel>

            <Tabs.Panel value="fielding" pt="xs">
                <FieldingDepthChart
                    positioning={idealPositioning}
                    players={players}
                    handlePositionUpdate={handlePositionUpdate}
                    managerView={managerView}
                />
            </Tabs.Panel>
        </TabsWrapper>
    );
}
