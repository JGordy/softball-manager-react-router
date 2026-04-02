import { MemoryRouter } from "react-router";
import { screen, cleanup } from "@testing-library/react";
import { render } from "@/utils/test-utils";

import NavLinks from "./NavLinks";

describe("NavLinks Component", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders all expected navigation links", () => {
        render(
            <MemoryRouter initialEntries={["/dashboard"]}>
                <NavLinks user={{}} />
            </MemoryRouter>,
        );
        expect(screen.getByRole("link", { name: /Home/i })).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: /Events/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: /Profile/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: /Settings/i }),
        ).toBeInTheDocument();
    });

    it("renders admin link for admin users", () => {
        render(
            <MemoryRouter initialEntries={["/dashboard"]}>
                <NavLinks user={{ labels: ["admin"] }} />
            </MemoryRouter>,
        );
        expect(
            screen.getByRole("link", { name: /Admin/i }),
        ).toBeInTheDocument();
    });

    it("initializes active tab based on URL (user profile)", () => {
        const userId = "123";
        render(
            <MemoryRouter initialEntries={[`/user/${userId}`]}>
                <NavLinks user={{ $id: userId }} />
            </MemoryRouter>,
        );
        const profileLink = screen.getByRole("link", { name: /Profile/i });
        expect(profileLink.className).toContain("active");
    });

    it("has correct href for Dashboard link", () => {
        render(
            <MemoryRouter initialEntries={["/events"]}>
                <NavLinks user={{}} />
            </MemoryRouter>,
        );
        const homeLink = screen.getByRole("link", { name: /Home/i });
        expect(homeLink).toHaveAttribute("href", "/dashboard");
    });

    it("has correct href for Settings link", () => {
        render(
            <MemoryRouter initialEntries={["/dashboard"]}>
                <NavLinks user={{}} />
            </MemoryRouter>,
        );
        const settingsLink = screen.getByRole("link", { name: /Settings/i });
        expect(settingsLink).toHaveAttribute("href", "/settings");
    });
});
