import React from "react";
import { render as testingLibraryRender } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import theme from "@/theme";

export function render(ui, { wrapper: Wrapper, ...options } = {}) {
    return testingLibraryRender(ui, {
        wrapper: ({ children }) => (
            <MantineProvider theme={theme}>
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </MantineProvider>
        ),
        ...options,
    });
}

export * from "@testing-library/react";
