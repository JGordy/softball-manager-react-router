import { Drawer } from '@mantine/core';

export default function DrawerContainer({
    children,
    classes,
    opened = false,
    onClose = () => { },
    position = 'bottom',
    size = 'md',
    title,
    zIndex = 5000,
}) {

    return (
        <Drawer
            classNames={classes}
            opened={opened}
            onClose={onClose}
            position={position}
            padding="xl"
            radius="xl"
            size={size}
            styles={{
                content: {
                    borderBottomRightRadius: '0px',
                    borderBottomLeftRadius: '0px',
                },
            }}
            title={title}
            zIndex={zIndex}
        >
            {children}
        </Drawer>
    );
}