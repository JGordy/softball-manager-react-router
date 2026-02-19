import { render, screen } from "@/utils/test-utils";

import Footer from "../components/Footer";

describe("Footer", () => {
    it("renders footer text", () => {
        render(<Footer />);

        expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
        expect(screen.getByText(/View on GitHub/i)).toBeInTheDocument();
    });
});
