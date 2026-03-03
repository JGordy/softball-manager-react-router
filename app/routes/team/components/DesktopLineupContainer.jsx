import { Tabs } from "@mantine/core";

import TabsWrapper from "@/components/TabsWrapper";
import DesktopBattingEditor from "./Batting/DesktopBattingEditor";
import DesktopFieldingDepthChart from "./Fielding/DesktopFieldingDepthChart";

export default function DesktopLineupContainer({
    managerView,
    players,
    lineup,
    reserves,
    idealPositioning,
    handleBattingReorder,
    handlePositionUpdate,
}) {
    return (
        <TabsWrapper defaultValue="batting" mt="lg" align="left">
            <Tabs.Tab value="batting">Batting Order</Tabs.Tab>
            <Tabs.Tab value="fielding">Fielding Depth Chart</Tabs.Tab>

            <Tabs.Panel value="batting" pt="xl">
                <DesktopBattingEditor
                    lineup={lineup}
                    reserves={reserves}
                    players={players}
                    handleReorder={handleBattingReorder}
                    managerView={managerView}
                />
            </Tabs.Panel>

            <Tabs.Panel value="fielding" pt="xl">
                <DesktopFieldingDepthChart
                    positioning={idealPositioning}
                    players={players}
                    handlePositionUpdate={handlePositionUpdate}
                    managerView={managerView}
                />
            </Tabs.Panel>
        </TabsWrapper>
    );
}
