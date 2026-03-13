import { render, screen, fireEvent } from "@/utils/test-utils";
import { MemoryRouter } from "react-router";
import SeasonMenu from "../SeasonMenu";
import useModal from "@/hooks/useModal";

// Mock hooks
jest.mock("@/hooks/useModal");

// Mock forms
jest.mock("@/forms/AddSingleGame", () => ({
    __esModule: true,
    default: ({ isPractice, buttonColor }) => (
        <div
            data-testid="add-single-game-form"
            data-ispractice={isPractice}
            data-buttoncolor={buttonColor}
        />
    ),
}));
jest.mock("@/forms/AddSeason", () => ({
    __esModule: true,
    default: ({ buttonColor }) => (
        <div data-testid="add-season-form" data-buttoncolor={buttonColor} />
    ),
}));
jest.mock("@/forms/GenerateSeasonGames", () => ({
    __esModule: true,
    default: ({ buttonColor }) => (
        <div data-testid="generate-games-form" data-buttoncolor={buttonColor} />
    ),
}));

describe("SeasonMenu", () => {
    const mockSeason = {
        $id: "season-123",
        teamId: "team-123",
        teams: [
            {
                primaryColor: "#ff0000",
            },
        ],
        location: "Central Park",
    };

    const mockOpenModal = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useModal.mockReturnValue({
            openModal: mockOpenModal,
        });
    });

    it("renders all menu options correctly", async () => {
        render(
            <MemoryRouter>
                <SeasonMenu season={mockSeason} />
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole("button"));

        expect(await screen.findByText("Edit Season")).toBeInTheDocument();
        expect(screen.getByText("Generate Games")).toBeInTheDocument();
        expect(screen.getByText("Add Single Game")).toBeInTheDocument();
        expect(screen.getByText("Schedule Practice")).toBeInTheDocument();
    });

    it("opens AddSingleGame modal with correct props for practice", async () => {
        render(
            <MemoryRouter>
                <SeasonMenu season={mockSeason} />
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole("button"));
        fireEvent.click(await screen.findByText("Schedule Practice"));

        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Schedule Practice",
                children: expect.anything(),
            }),
        );

        const modalChildren = mockOpenModal.mock.calls[0][0].children;
        render(modalChildren);

        const form = screen.getByTestId("add-single-game-form");
        expect(form).toHaveAttribute("data-ispractice", "true");
        expect(form).toHaveAttribute("data-buttoncolor", "#ff0000");
    });

    it("opens GenerateSeasonGames modal with correct primaryColor", async () => {
        render(
            <MemoryRouter>
                <SeasonMenu season={mockSeason} />
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole("button"));
        fireEvent.click(await screen.findByText("Generate Games"));

        const modalChildren = mockOpenModal.mock.calls[0][0].children;
        render(modalChildren);

        const form = screen.getByTestId("generate-games-form");
        expect(form).toHaveAttribute("data-buttoncolor", "#ff0000");
    });
});
