import { render, screen, fireEvent } from "@/utils/test-utils";

import * as weatherUtils from "../../utils/getGameDateWeather";
import * as precipUtils from "../../utils/getPrecipitationRating";
import * as uvUtils from "../../utils/getUvIndexColor";
import * as windUtils from "../../utils/getWindSpeedRating";

import WeatherCard from "../WeatherCard";

// Mock dependencies
jest.mock("../../utils/getGameDateWeather");
jest.mock("../../utils/getPrecipitationRating");
jest.mock("../../utils/getUvIndexColor");
jest.mock("../../utils/getWindSpeedRating");

jest.mock(
    "@/components/DrawerContainer",
    () =>
        ({ children, opened, title }) =>
            opened ? (
                <div role="dialog" aria-label={title}>
                    {children}
                </div>
            ) : null,
);

// Generic manual mock is sufficient
jest.mock("@/components/DeferredLoader");

jest.mock("../CardSection", () => ({ onClick, heading, subHeading }) => (
    <div onClick={onClick} data-testid="card-section">
        <h3>{heading}</h3>
        <div>{subHeading}</div>
    </div>
));

describe("WeatherCard Component", () => {
    const defaultProps = {
        weatherPromise: {}, // Pass plain object instead of promise so mock DeferredLoader passes it through
        gameDate: "2023-10-10",
    };

    beforeEach(() => {
        jest.clearAllMocks();
        precipUtils.default.mockReturnValue({ color: "blue" });
        uvUtils.default.mockReturnValue("lime");
        windUtils.default.mockReturnValue({ color: "lime" });
    });

    it("renders fallback text when no weather data", () => {
        weatherUtils.default.mockReturnValue(null); // No hourly data

        render(<WeatherCard {...defaultProps} />);

        expect(
            screen.getByText("Data unavailable at this time"),
        ).toBeInTheDocument();
    });

    it("renders summary when weather data exists", () => {
        weatherUtils.default.mockReturnValue({
            hourly: {
                temperature: { degrees: 72 },
                feelsLikeTemperature: { degrees: 70 },
                precipitation: { probability: { percent: 10 } },
                weatherCondition: {
                    iconBaseUri: "http://icon",
                    description: { text: "Sunny" },
                },
                wind: {
                    speed: { value: 5 },
                    direction: { degrees: 0 },
                },
                uvIndex: 5,
            },
        });

        render(<WeatherCard {...defaultProps} />);

        expect(
            screen.getByText("72°F / 10% chance of precipitation at game time"),
        ).toBeInTheDocument();
    });

    it("opens drawer and shows detailed weather", () => {
        weatherUtils.default.mockReturnValue({
            hourly: {
                temperature: { degrees: 72 },
                feelsLikeTemperature: { degrees: 70 },
                precipitation: { probability: { percent: 10 } },
                weatherCondition: {
                    iconBaseUri: "http://icon",
                    description: { text: "Sunny" },
                },
                wind: {
                    speed: { value: 5 },
                    direction: { degrees: 0 },
                },
                uvIndex: 5,
            },
            totalPrecipitation: 0,
            rainout: null,
        });

        render(<WeatherCard {...defaultProps} />);

        fireEvent.click(screen.getByTestId("card-section"));

        expect(
            screen.getByRole("dialog", { name: "Weather Details" }),
        ).toBeInTheDocument();
        expect(screen.getByText("Game Time Forecast")).toBeInTheDocument();
        expect(screen.getByText("Sunny")).toBeInTheDocument();
        expect(screen.getByText("72°F -")).toBeInTheDocument();
    });

    it("shows rainout chance if available", () => {
        weatherUtils.default.mockReturnValue({
            hourly: {
                temperature: { degrees: 72 },
                feelsLikeTemperature: { degrees: 70 },
                precipitation: { probability: { percent: 10 } },
                weatherCondition: {
                    iconBaseUri: "http://icon",
                    description: { text: "Sunny" },
                },
                wind: {
                    speed: { value: 5 },
                    direction: { degrees: 0 },
                },
                uvIndex: 5,
            },
            rainout: {
                likelihood: 80,
                color: "red",
                reason: "Heavy Rain",
            },
        });

        render(<WeatherCard {...defaultProps} />);
        fireEvent.click(screen.getByTestId("card-section"));

        expect(screen.getByText("Rainout likelihood*")).toBeInTheDocument();
        expect(screen.getByText("80%")).toBeInTheDocument();
        expect(screen.getByText("Heavy Rain")).toBeInTheDocument();
    });
});
