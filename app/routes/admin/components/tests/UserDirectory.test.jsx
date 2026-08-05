import { render, screen, fireEvent } from "@/utils/test-utils";
import { UserDirectory } from "../UserDirectory";

describe("UserDirectory", () => {
    const mockUsers = [
        {
            $id: "u1",
            name: "Zoe Alice",
            email: "zoe@example.com",
            registration: "2026-01-01T00:00:00.000Z",
            accessedAt: "2026-08-01T10:00:00.000Z",
        },
        {
            $id: "u2",
            name: "Adam Smith",
            email: "adam@example.com",
            registration: "2026-06-01T00:00:00.000Z",
            accessedAt: "2026-07-01T10:00:00.000Z",
        },
    ];

    it("renders User Directory header and sort controls", () => {
        render(<UserDirectory users={mockUsers} />);
        expect(screen.getByText("User Directory")).toBeInTheDocument();
        expect(screen.getByText("Recently Active")).toBeInTheDocument();
        expect(screen.getByText("Newest Signups")).toBeInTheDocument();
        expect(screen.getByText("Name (A–Z)")).toBeInTheDocument();
    });

    it("sorts by Recently Active by default", () => {
        render(<UserDirectory users={mockUsers} />);
        const names = screen.getAllByText(/Zoe Alice|Adam Smith/);
        expect(names[0]).toHaveTextContent("Zoe Alice");
        expect(names[1]).toHaveTextContent("Adam Smith");
    });

    it("sorts by Newest Signups when tab is clicked", () => {
        render(<UserDirectory users={mockUsers} />);
        fireEvent.click(screen.getByText("Newest Signups"));
        const names = screen.getAllByText(/Zoe Alice|Adam Smith/);
        expect(names[0]).toHaveTextContent("Adam Smith");
        expect(names[1]).toHaveTextContent("Zoe Alice");
    });

    it("sorts by Name (A-Z) when tab is clicked", () => {
        render(<UserDirectory users={mockUsers} />);
        fireEvent.click(screen.getByText("Name (A–Z)"));
        const names = screen.getAllByText(/Zoe Alice|Adam Smith/);
        expect(names[0]).toHaveTextContent("Adam Smith");
        expect(names[1]).toHaveTextContent("Zoe Alice");
    });
});
