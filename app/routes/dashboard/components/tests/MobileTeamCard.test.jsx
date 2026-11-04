import { MemoryRouter } from "react-router";
import { render, screen } from "@/utils/test-utils";
import MobileTeamCard from "../MobileTeamCard";

describe("MobileTeamCard Component", () => {
    const mockTeam = {
        $id: "team-sliders",
        name: "Ormewood Park Sliders",
        primaryColor: "#6B0F1A",
        division: "COED REC",
    };

    const renderCard = (props = {}) => {
        return render(
            <MemoryRouter>
                <MobileTeamCard
                    team={mockTeam}
                    record="7-1"
                    isActive={true}
                    {...props}
                />
            </MemoryRouter>,
        );
    };

    it("renders team nickname and prefix", () => {
        renderCard();
        expect(screen.getByText("ORMEWOOD PARK")).toBeInTheDocument();
        expect(screen.getByText("SLIDERS")).toBeInTheDocument();
    });

    it("renders link pointing to the team detail page", () => {
        renderCard();
        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "/team/team-sliders");
    });

    it("renders neutral softball seam watermark in background", () => {
        renderCard();
        const watermark = screen.getByTestId("softball-seam-watermark");
        expect(watermark).toBeInTheDocument();
    });
});
