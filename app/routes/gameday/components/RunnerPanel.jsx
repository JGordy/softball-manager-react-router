import { Stack, Text } from "@mantine/core";
import { getRunnerConfigs } from "../utils/drawerUtils";
import RunnerControl from "./RunnerControl";

export function RunnerPanel({
    actionType,
    runners,
    outs,
    runnerResults,
    setRunnerResults,
}) {
    if (actionType === "HR") return null;

    let newOuts = 0;
    if (
        ["Fly Out", "Ground Out", "Line Out", "Pop Out", "K"].includes(
            actionType,
        )
    )
        newOuts = 1;
    if (actionType === "SF") newOuts = 1;

    if ((outs || 0) + newOuts >= 3) {
        return (
            <Text size="sm" c="dimmed" fs="italic" ta="center" mt="sm">
                Inning over. No runner advancement.
            </Text>
        );
    }

    const configs = getRunnerConfigs(actionType, runners);
    const visibleConfigs = configs.filter((config) => config.shouldShow);

    if (visibleConfigs.length === 0) return null;

    return (
        <Stack gap="sm" mt="sm">
            {visibleConfigs.map((config) => (
                <RunnerControl
                    key={config.base}
                    label={config.label}
                    value={runnerResults[config.base]}
                    onChange={(val) =>
                        setRunnerResults((prev) => ({
                            ...prev,
                            [config.base]: val,
                        }))
                    }
                    intermediateOptions={config.options}
                    hideStay={config.hideStay}
                />
            ))}
        </Stack>
    );
}

export default RunnerPanel;
