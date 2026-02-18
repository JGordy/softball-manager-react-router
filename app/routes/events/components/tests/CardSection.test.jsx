import { render, screen, fireEvent } from "@/utils/test-utils";
import { Card } from "@mantine/core";

import CardSection from "../CardSection";

describe("CardSection", () => {
    it("renders heading and subheading", () => {
        render(
            <Card>
                <CardSection
                    heading="Test Heading"
                    subHeading="Test Subheading"
                />
            </Card>,
        );

        expect(screen.getByText("Test Heading")).toBeInTheDocument();
        expect(screen.getByText("Test Subheading")).toBeInTheDocument();
    });

    it("handles onClick", () => {
        const onClick = jest.fn();
        render(
            <Card>
                <CardSection heading="Click Me" onClick={onClick} />
            </Card>,
        );

        fireEvent.click(screen.getByText("Click Me"));
        expect(onClick).toHaveBeenCalled();
    });

    it("renders left section if provided", () => {
        render(
            <Card>
                <CardSection
                    heading="Heading"
                    leftSection={<div data-testid="left-section">Left</div>}
                />
            </Card>,
        );

        expect(screen.getByTestId("left-section")).toBeInTheDocument();
    });
});
