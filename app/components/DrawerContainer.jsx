import { Drawer } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

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
    const isDesktop = useMediaQuery("(min-width: 62em)");

    const finalPosition = position || (isDesktop ? "right" : "bottom");
    const finalSize = size || (isDesktop ? "md" : "100%");

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
