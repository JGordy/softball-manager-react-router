import { render, screen } from "@/utils/test-utils";

import { ExternalToolsPanel } from "../ExternalToolsMenu";

describe("ExternalToolsPanel", () => {
    const renderComponent = () => render(<ExternalToolsPanel />);

    it("renders the 'External Services' section label", () => {
        renderComponent();
        expect(screen.getByText(/external services/i)).toBeInTheDocument();
    });

    it("renders the Appwrite button linking to the prod console", () => {
        renderComponent();
        const link = screen.getByRole("link", { name: /appwrite/i });
        expect(link).toHaveAttribute(
            "href",
            "https://cloud.appwrite.io/console/project-nyc-6a67a1f3000b347adb4d/overview/platforms",
        );
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders the Render button", () => {
        renderComponent();
        const link = screen.getByRole("link", { name: /render/i });
        expect(link).toHaveAttribute(
            "href",
            "https://dashboard.render.com/web/srv-cv69doan91rc73bdbrkg",
        );
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders the Sentry button", () => {
        renderComponent();
        const link = screen.getByRole("link", { name: /sentry/i });
        expect(link).toHaveAttribute(
            "href",
            "https://joseph-gordy.sentry.io/issues/?project=4510845363814400",
        );
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders the Beta Survey button", () => {
        renderComponent();
        const link = screen.getByRole("link", { name: /beta survey/i });
        expect(link).toHaveAttribute(
            "href",
            "https://docs.google.com/forms/d/1rdlF1Cx73AOz79W5q6stVBCSUIjni6zVy-0yuhein74/edit#responses",
        );
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders the Umami Analytics button", () => {
        renderComponent();
        const link = screen.getByRole("link", { name: /umami/i });
        expect(link).toHaveAttribute(
            "href",
            "https://cloud.umami.is/analytics/us/websites/1e945f69-4632-4c87-a229-42769d855efa",
        );
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
});
