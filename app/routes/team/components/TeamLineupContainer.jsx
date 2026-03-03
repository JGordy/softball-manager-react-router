import { useFetcher } from "react-router";
import { Tabs } from "@mantine/core";

import TabsWrapper from "@/components/TabsWrapper";
import BattingOrderEditor from "./Batting/BattingOrderEditor";
import FieldingDepthChart from "./Fielding/FieldingDepthChart";
import DesktopLineupContainer from "./DesktopLineupContainer";

export default function TeamLineupContainer({
    team,
    managerView,
    players,
    lineup,
    reserves,
    setLineup,
    setReserves,
    idealPositioning,
    setIdealPositioning,
    isDesktop,
}) {
    const fetcher = useFetcher();

    const submitBattingOrder = (newLineup, newReserves) => {
        try {
            const formData = new FormData();
            formData.append("_action", "save-batting-order");
            formData.append(
                "idealLineup",
                JSON.stringify({ lineup: newLineup, reserves: newReserves }),
            );

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

    const handleBattingReorder = ({ source, destination }) => {
        const newLineup = [...lineup];
        const newReserves = [...reserves];

        const sourceArray =
            source.droppableId === "lineup" ? newLineup : newReserves;
        const destArray =
            destination.droppableId === "lineup" ? newLineup : newReserves;

        const [movedId] = sourceArray.splice(source.index, 1);
        destArray.splice(destination.index, 0, movedId);

        setLineup(newLineup);
        setReserves(newReserves);
        submitBattingOrder(newLineup, newReserves);
    };

    const handlePositionUpdate = (position, playerIds) => {
        const newPositioning = {
            ...idealPositioning,
            [position]: playerIds,
        };

        setIdealPositioning(newPositioning);
        submitFieldingPositions(newPositioning);
    };

    // ── Desktop view ────────────────────────────────────────────────
    if (isDesktop) {
        return (
            <DesktopLineupContainer
                managerView={managerView}
                players={players}
                lineup={lineup}
                reserves={reserves}
                idealPositioning={idealPositioning}
                handleBattingReorder={handleBattingReorder}
                handlePositionUpdate={handlePositionUpdate}
            />
        );
    }

    // ── Mobile view ─────────────────────────────────────────────────
    return (
        <TabsWrapper defaultValue="batting">
            <Tabs.Tab value="batting">Batting Order</Tabs.Tab>
            <Tabs.Tab value="fielding">Fielding Depth Chart</Tabs.Tab>

            <Tabs.Panel value="batting" pt="xs">
                <BattingOrderEditor
                    lineup={lineup}
                    reserves={reserves}
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
