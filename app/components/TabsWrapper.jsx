import { useState, useCallback, Children, cloneElement } from "react";
import { FloatingIndicator, Tabs } from "@mantine/core";
import classes from "@/styles/tabsWrapper.module.css";

/**
 * TabsWrapper - A reusable tabs component with floating indicator
 *
 * @param {Object} props
 * @param {string} [props.defaultValue] - The default active tab value (uncontrolled mode)
 * @param {string} [props.value] - The controlled active tab value (controlled mode)
 * @param {Function} [props.onChange] - Callback when tab changes (controlled mode)
 * @param {string} [props.color] - The color for the indicator and hover state (defaults to lime)
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
    color = "var(--mantine-color-lime-4)",
    children,
    mt = "xl",
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

    const setControlRef = useCallback(
        (val) => (node) => {
            if (node) {
                setControlsRefs((prev) => {
                    // Only update if the ref actually changed
                    if (prev[val] !== node) {
                        return { ...prev, [val]: node };
                    }
                    return prev;
                });
            }
        },
        [],
    );

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
                    disabled: child.props.disabled,
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

    return (
        <Tabs variant="none" value={value} onChange={setValue} mt={mt}>
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
