import { render, screen } from "@/utils/test-utils";
import { IconInfoCircle } from "@tabler/icons-react";
import PreferenceSection from "../PreferenceSection";

describe("PreferenceSection Component", () => {
    it("renders label and children", () => {
        render(
            <PreferenceSection label="Test Label">
                <div>Test Child</div>
            </PreferenceSection>,
        );

        expect(screen.getByText("Test Label")).toBeInTheDocument();
        expect(screen.getByText("Test Child")).toBeInTheDocument();
    });

    it("renders description when provided", () => {
        render(
            <PreferenceSection
                label="Test Label"
                description="Test Description"
            >
                <div>Test Child</div>
            </PreferenceSection>,
        );

        expect(screen.getByText("Test Description")).toBeInTheDocument();
    });

    it("renders icon when provided", () => {
        const { container } = render(
            <PreferenceSection label="Test Label" icon={IconInfoCircle}>
                <div>Test Child</div>
            </PreferenceSection>,
        );

        // Tabler icons are SVGs
        const icon = container.querySelector(".tabler-icon");
        expect(icon).toBeInTheDocument();
    });

    it("renders divider by default", () => {
        const { container } = render(
            <PreferenceSection label="Test Label">
                <div>Test Child</div>
            </PreferenceSection>,
        );

        // Mantine Divider usually has a specific class or role
        const divider = container.querySelector(".mantine-Divider-root");
        expect(divider).toBeInTheDocument();
    });

    it("hides divider when showDivider is false", () => {
        const { container } = render(
            <PreferenceSection label="Test Label" showDivider={false}>
                <div>Test Child</div>
            </PreferenceSection>,
        );

        const divider = container.querySelector(".mantine-Divider-root");
        expect(divider).not.toBeInTheDocument();
    });
});
