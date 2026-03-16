import { render, screen, fireEvent, waitFor } from "@/utils/test-utils";

import { ExternalToolsMenu } from "../ExternalToolsMenu";

describe("ExternalToolsMenu", () => {
    const renderComponent = () => render(<ExternalToolsMenu />);

    it("renders the menu target", () => {
        renderComponent();
        expect(
            screen.getByRole("button", { name: /external tools/i }),
        ).toBeInTheDocument();
    });

    const openMenu = async () => {
        renderComponent();
        const menuButton = screen.getByRole("button", {
            name: /external tools/i,
        });
        fireEvent.click(menuButton);
        // Wait for Mantine's transition to render the portal content
        await waitFor(() => {
            expect(screen.getByText("External Tools")).toBeInTheDocument();
            const dropdown = screen.getByRole("menu", { hidden: true });
            expect(dropdown).toHaveStyle({ display: "block" });
        });
    };

    it("displays the menu label when opened", async () => {
        await openMenu();
        expect(screen.getByText("External Tools")).toBeInTheDocument();
    });

    it("renders the Umami Analytics link", async () => {
        await openMenu();
        const link = screen.getByRole("menuitem", {
            name: /umami analytics/i,
            hidden: true,
        });
        expect(link).toHaveAttribute(
            "href",
            "https://cloud.umami.is/analytics/us/websites/1e945f69-4632-4c87-a229-42769d855efa",
        );
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders the Appwrite Console link", async () => {
        await openMenu();
        const link = screen.getByRole("menuitem", {
            name: /appwrite console/i,
            hidden: true,
        });
        expect(link).toHaveAttribute(
            "href",
            "https://cloud.appwrite.io/console/project-fra-679b95f10030c4821c90/overview/platforms",
        );
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders the Render Server link", async () => {
        await openMenu();
        const link = screen.getByRole("menuitem", {
            name: /render server/i,
            hidden: true,
        });
        expect(link).toHaveAttribute(
            "href",
            "https://dashboard.render.com/web/srv-cv69doan91rc73bdbrkg",
        );
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders the Sentry Issues link", async () => {
        await openMenu();
        const link = screen.getByRole("menuitem", {
            name: /sentry issues/i,
            hidden: true,
        });
        expect(link).toHaveAttribute(
            "href",
            "https://joseph-gordy.sentry.io/issues/?project=4510845363814400",
        );
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
});
