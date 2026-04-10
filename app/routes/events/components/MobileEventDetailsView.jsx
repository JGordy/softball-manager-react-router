import DetailsCard from "./DetailsCard";
import GamedayCard from "./GamedayCard";
import WeatherCard from "./WeatherCard";
import AwardsContainer from "./AwardsContainer";
import RosterDetails from "./RosterDetails";

export default function MobileEventDetailsView({
    // DetailsCard
    game,
    deferredData,
    season,
    team,
    // GamedayCard
    gameIsPast,
    gameInProgress,
    isScorekeeper,
    // WeatherCard
    weatherPromise,
    // AwardsContainer
    user,
    // RosterDetails
    managerView,
    playerChart,
}) {
    return (
        <>
            <DetailsCard
                game={game}
                deferredData={deferredData}
                season={season}
                team={team}
            />

            {game.eventType !== "practice" && (
                <GamedayCard
                    gameId={game.$id}
                    isLive={gameInProgress}
                    isPast={gameIsPast}
                    isScorekeeper={isScorekeeper}
                />
            )}
            {game.eventType !== "practice" && gameIsPast ? (
                <AwardsContainer
                    game={game}
                    team={team}
                    user={user}
                    deferredData={deferredData}
                />
            ) : (
                !gameIsPast && (
                    <WeatherCard
                        gameDate={game.gameDate}
                        weatherPromise={weatherPromise}
                    />
                )
            )}

            <RosterDetails
                deferredData={deferredData}
                game={game}
                managerView={managerView}
                playerChart={playerChart}
                team={team}
            />
        </>
    );
}
