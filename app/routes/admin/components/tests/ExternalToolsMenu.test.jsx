import { render, screen, fireEvent } from "@/utils/test-utils";

import { ExternalToolsMenu } from "../ExternalToolsMenu";

describe("ExternalToolsMenu", () => {
    const renderComponent = () => render(<ExternalToolsMenu />);

    it("renders the menu target", () => {
        renderComponent();
        expect(
            screen.getByRole("button", { name: /external tools/i }),
        ).toBeInTheDocument();
    });

    const openMenu = () => {
        renderComponent();
        const menuButton = screen.getByRole("button", {
            name: /external tools/i,
        });
        fireEvent.click(menuButton);
    };

    it("displays the menu label when opened", async () => {
        await openMenu();
        expect(screen.getByText("External Tools")).toBeInTheDocument();
    });

    it("renders the Umami Analytics link", async () => {
        await openMenu();
        const link = screen.getByRole("link", {
            name: /umami analytics/i,
        });
        expect(link).toHaveAttribute(
            "href",
            "https://cloud.umami.is/analytics/us/websites/1e945f69-4632-4c87-a229-42769d855efa",
        );
        expect(link).toHaveAttribute("target", "_blank");
    });

    it("renders the Appwrite Console link", async () => {
        await openMenu();
        const link = screen.getByRole("link", {
            name: /appwrite console/i,
        });
        expect(link).toHaveAttribute(
            "href",
            "https://cloud.appwrite.io/console/project-fra-679b95f10030c4821c90/overview/platforms",
        );
        expect(link).toHaveAttribute("target", "_blank");
    });

    it("renders the Render Server link", async () => {
        await openMenu();
        const link = screen.getByRole("link", { name: /render server/i });
        expect(link).toHaveAttribute(
            "href",
            "https://dashboard.render.com/web/srv-cv69doan91rc73bdbrkg",
        );
        expect(link).toHaveAttribute("target", "_blank");
    });

    it("renders the Sentry Issues link", async () => {
        await openMenu();
        const link = screen.getByRole("link", { name: /sentry issues/i });
        expect(link).toHaveAttribute(
            "href",
            "https://joseph-gordy.sentry.io/issues/?project=4510845363814400",
        );
        expect(link).toHaveAttribute("target", "_blank");
    });
});
