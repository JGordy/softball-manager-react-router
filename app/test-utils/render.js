import { render as testingLibraryRender } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import theme from "../theme"; // Import your Mantine theme

export function render(ui) {
    return testingLibraryRender(<>{ui}</>, {
        wrapper: ({ children }) => (
            <MantineProvider theme={theme} env="test">
                {children}
            </MantineProvider>
        ),
    });
}
