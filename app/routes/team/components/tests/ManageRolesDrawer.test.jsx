import { useFetcher } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";

import ManageRolesDrawer from "../ManageRolesDrawer";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useFetcher: jest.fn(),
}));

jest.mock(
    "@/components/DrawerContainer",
    () =>
        ({ children, opened, title }) =>
            opened ? (
                <div data-testid="drawer" data-title={title}>
                    {children}
                </div>
            ) : null,
);

describe("ManageRolesDrawer Component", () => {
    const mockSubmit = jest.fn();
    const mockFetcher = {
        submit: mockSubmit,
        state: "idle",
    };
    const mockPlayers = [
        {
            $id: "u1",
            firstName: "John",
            lastName: "Doe",
            roles: ["owner"],
        },
        {
            $id: "u2",
            firstName: "Jane",
            lastName: "Smith",
            roles: ["player"],
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        useFetcher.mockReturnValue(mockFetcher);

        render(
            <ManageRolesDrawer
                opened={true}
                onClose={jest.fn()}
                players={mockPlayers}
                teamId="t1"
                userId="u1"
            />,
        );
    });

    it("renders players and their current roles", () => {
        expect(screen.getByText("John Doe (You)")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();

        // Mantine Select shows the label of the selected value in the input
        // Using a more flexible matcher or searching for the attributes
        const inputs = screen.getAllByRole("textbox");
        expect(inputs).toHaveLength(2);
        expect(inputs[0]).toHaveValue("Owner");
        expect(inputs[1]).toHaveValue("Player");
    });

    it("submits the correct data when role is changed", async () => {
        const selects = screen.getAllByRole("textbox");
        const janeSelect = selects[1]; // Jane Smith

        fireEvent.click(janeSelect);

        // Find all "Manager" options and click the one that is likely visible
        const managerOptions = await screen.findAllByText("Manager");
        // Usually, the newly opened one is the last one or we can find the one that is visible
        const visibleManagerOption = managerOptions.find(
            (el) => !el.closest(".mantine-Select-dropdown[data-hidden='true']"),
        );

        fireEvent.click(visibleManagerOption || managerOptions[0]);

        expect(mockSubmit).toHaveBeenCalledWith(expect.any(FormData), {
            method: "post",
            action: "/team/t1",
        });

        const formData = mockSubmit.mock.calls[0][0];
        expect(formData.get("_action")).toBe("update-role");
        expect(formData.get("playerId")).toBe("u2");
        expect(formData.get("role")).toBe("manager");
    });

    it("disables select for the last owner", () => {
        const selects = screen.getAllByRole("textbox");
        const johnSelect = selects[0]; // John Doe

        expect(johnSelect).toBeDisabled(); // John is the last owner
    });
});
