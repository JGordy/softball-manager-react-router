import { useActionData } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";

import * as teamsActions from "@/actions/teams";
import * as teamsLoaders from "@/loaders/teams";
import useModal from "@/hooks/useModal";

import UserTeams, { action, loader } from "../teams";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useActionData: jest.fn(),
}));

jest.mock("@/actions/teams");
jest.mock("@/loaders/teams");

jest.mock("@/hooks/useModal", () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock("@/components/UserHeader", () => () => (
    <div data-testid="user-header" />
));
jest.mock("../components/TeamCard", () => ({ team }) => (
    <div data-testid={`team-card-${team.$id}`}>{team.name}</div>
));

describe("UserTeams Route Component", () => {
    const mockManaging = [{ $id: "t1", name: "Managing Team 1", seasons: [] }];
    const mockPlaying = [{ $id: "t2", name: "Playing Team 1", seasons: [] }];
    const mockLoaderData = {
        managing: mockManaging,
        playing: mockPlaying,
        userId: "user-1",
    };

    const mockOpenModal = jest.fn();
    const mockCloseAllModals = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useActionData.mockReturnValue(null);
        useModal.mockReturnValue({
            openModal: mockOpenModal,
            closeAllModals: mockCloseAllModals,
        });
    });

    describe("loader", () => {
        it("calls getUserTeams", async () => {
            const request = { url: "http://localhost/teams" };
            await loader({ request });
            expect(teamsLoaders.getUserTeams).toHaveBeenCalledWith({ request });
        });
    });

    describe("action", () => {
        it("calls createTeam for add-team action", async () => {
            const formData = new FormData();
            formData.append("_action", "add-team");
            formData.append("userId", "user-1");
            formData.append("name", "New Team");
            const request = { formData: () => Promise.resolve(formData) };

            await action({ request });

            expect(teamsActions.createTeam).toHaveBeenCalledWith({
                values: { name: "New Team" },
                userId: "user-1",
            });
        });
    });

    describe("Component", () => {
        it("renders header and team lists", () => {
            render(<UserTeams loaderData={mockLoaderData} />);

            expect(screen.getByTestId("user-header")).toBeInTheDocument();
            expect(screen.getByText("Teams I Manage")).toBeInTheDocument();
            expect(screen.getByText("Teams I Play For")).toBeInTheDocument();
            expect(screen.getByTestId("team-card-t1")).toBeInTheDocument();
            expect(screen.getByTestId("team-card-t2")).toBeInTheDocument();
        });

        it("renders only managed teams if playing list is empty", () => {
            render(
                <UserTeams loaderData={{ ...mockLoaderData, playing: [] }} />,
            );

            expect(screen.getByText("Teams I Manage")).toBeInTheDocument();
            expect(
                screen.queryByText("Teams I Play For"),
            ).not.toBeInTheDocument();
            expect(screen.getByTestId("team-card-t1")).toBeInTheDocument();
            expect(
                screen.queryByTestId("team-card-t2"),
            ).not.toBeInTheDocument();
        });

        it("opens add team modal when button is clicked", () => {
            render(<UserTeams loaderData={mockLoaderData} />);

            const addButton = screen.getByText("Create New Team");
            fireEvent.click(addButton);

            expect(mockOpenModal).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Add a New Team",
                }),
            );
        });
    });
});
