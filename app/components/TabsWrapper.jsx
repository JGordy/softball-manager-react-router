import { useState, Children, cloneElement } from "react";
import { FloatingIndicator, Tabs } from "@mantine/core";
import classes from "@/styles/tabsWrapper.module.css";

/**
 * TabsWrapper - A reusable tabs component with floating indicator
 *
 * @param {Object} props
 * @param {string} [props.defaultValue] - The default active tab value (uncontrolled mode)
 * @param {string} [props.value] - The controlled active tab value (controlled mode)
 * @param {Function} [props.onChange] - Callback when tab changes (controlled mode)
 * @param {string} [props.color] - The color for the indicator and hover state (defaults to green)
 * @param {React.ReactNode} props.children - Should contain Tabs.Tab and Tabs.Panel components
 *
 * @example
 * // Uncontrolled
 * <TabsWrapper defaultValue="settings" color="#ff6b6b">
 *   <Tabs.Tab value="settings">Settings</Tabs.Tab>
 *   <Tabs.Tab value="profile">Profile</Tabs.Tab>
 *   <Tabs.Panel value="settings">Settings content</Tabs.Panel>
 *   <Tabs.Panel value="profile">Profile content</Tabs.Panel>
 * </TabsWrapper>
 *
 * @example
 * // Controlled
 * <TabsWrapper value={tab} onChange={setTab} color="#ff6b6b">
 *   <Tabs.Tab value="settings">Settings</Tabs.Tab>
 *   <Tabs.Tab value="profile">Profile</Tabs.Tab>
 *   <Tabs.Panel value="settings">Settings content</Tabs.Panel>
 *   <Tabs.Panel value="profile">Profile content</Tabs.Panel>
 * </TabsWrapper>
 */
export default function TabsWrapper({
    defaultValue,
    value: controlledValue,
    onChange: controlledOnChange,
    color = "var(--mantine-color-green-filled)",
    children,
}) {
    const [rootRef, setRootRef] = useState(null);
    const [uncontrolledValue, setUncontrolledValue] = useState(
        defaultValue || null,
    );
    const [controlsRefs, setControlsRefs] = useState({});

    // Use controlled value if provided, otherwise use uncontrolled
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : uncontrolledValue;
    const setValue = isControlled ? controlledOnChange : setUncontrolledValue;

    const setControlRef = (val) => (node) => {
        controlsRefs[val] = node;
        setControlsRefs(controlsRefs);
    };

    // Separate tabs from panels
    const tabs = [];
    const panels = [];

    Children.forEach(children, (child) => {
        if (!child) return;

        // Check if it's a Tabs.Tab or Tabs.Panel by display name or type
        const childType = child.type?.displayName || child.type?.name || "";

        if (
            childType.includes("Tab") &&
            !childType.includes("Panel") &&
            child.props?.value
        ) {
            const isActive = child.props.value === value;
            // Clone the Tab and add necessary props
            tabs.push(
                cloneElement(child, {
                    key: child.props.value,
                    ref: setControlRef(child.props.value),
                    className: `${classes.tab} ${isActive ? classes.tabActive : ""}`,
                    style: {
                        ...child.props.style,
                        "--hover-color": color,
                    },
                }),
            );
        } else if (childType.includes("Panel")) {
            // Keep panels as-is
            panels.push(child);
        }
    });

    // Auto-set first tab as default if no defaultValue provided
    if (!value && tabs.length > 0) {
        const firstValue = tabs[0].props.value;
        setValue(firstValue);
    }

    return (
        <Tabs variant="none" value={value} onChange={setValue} mt="xl">
            <Tabs.List ref={setRootRef} className={classes.list}>
                {tabs}
                <FloatingIndicator
                    target={value ? controlsRefs[value] : null}
                    parent={rootRef}
                    className={classes.indicator}
                    style={{ background: color }}
                />
            </Tabs.List>

            {panels}
        </Tabs>
    );
}
