import { useRef } from "react";

import { Drawer } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

/**
 * A responsive Drawer wrapper that automatically positions itself at the bottom
 * on mobile and on the right on desktop. The position and size are "frozen" for
 * the lifetime of a single open session so that secondary viewport changes
 * (e.g., the virtual keyboard opening when a Select inside the drawer gains
 * focus) cannot trigger a mid-open flicker.
 *
 * @param {Object}   props
 * @param {React.ReactNode} props.children
 * @param {Object}   [props.classes]    - Mantine classNames map.
 * @param {boolean}  [props.opened=false]
 * @param {Function} [props.onClose]
 * @param {string}   [props.padding="xl"]
 * @param {string}   [props.position]  - Overrides automatic position detection.
 * @param {string}   [props.size]      - Overrides automatic size selection.
 * @param {React.ReactNode} [props.title]
 * @param {number}   [props.zIndex=5000]
 */
export default function DrawerContainer({
    children,
    classes,
    opened = false,
    onClose = () => {},
    padding = "xl",
    position,
    size,
    title,
    zIndex = 5000,
    ...props
}) {
    // getInitialValueInEffect: false evaluates the query synchronously on mount
    // (when window.matchMedia is available) so there is no undefined → boolean
    // transition that would cause an extra render on first paint.
    const isDesktop = useMediaQuery("(min-width: 62em)", false, {
        getInitialValueInEffect: false,
    });

    const derivedPosition = position || (isDesktop ? "right" : "bottom");
    const derivedSize = size || (isDesktop ? "md" : "100%");

    // Snapshot the position and size the moment the drawer opens and hold them
    // steady for the entire open session.  This prevents secondary viewport
    // changes (e.g. the virtual keyboard appearing when a Select is tapped)
    // from re-evaluating useMediaQuery and toggling the drawer dimensions while
    // it is visible, which would cause the flickering reported on mobile.
    const frozenPosition = useRef(derivedPosition);
    const frozenSize = useRef(derivedSize);

    if (opened) {
        frozenPosition.current = derivedPosition;
        frozenSize.current = derivedSize;
    }

    const finalPosition = frozenPosition.current;
    const finalSize = frozenSize.current;

    return (
        <Drawer
            classNames={classes}
            opened={opened}
            onClose={onClose}
            closeButtonProps={{ "aria-label": "Close drawer" }}
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
            position={finalPosition}
            padding={padding}
            radius="xl"
            size={finalSize}
            styles={{
                content: {
                    borderBottomRightRadius: "0px",
                    borderBottomLeftRadius: "0px",
                    borderTopLeftRadius:
                        finalPosition === "right" ? "0px" : undefined,
                    borderTopRightRadius:
                        finalPosition === "right" ? "0px" : undefined,
                },
            }}
            title={title}
            zIndex={zIndex}
            {...props}
        >
            {children}
        </Drawer>
    );
}
