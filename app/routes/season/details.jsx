import BackButton from '@/components/BackButton';
import { getSeasonDetails } from './loader';

export async function loader({ params }) {
    const { seasonId } = params;

    return getSeasonDetails({ seasonId });
}

export default function SeasonDetails({ loaderData }) {
    const { season } = loaderData;
    console.log('/season/details.jsx: ', { season });

    return (
        <div>
            <BackButton />
            <h1>Season Details</h1>
            <p>{season.seasonName}</p>
            <p>{season.games.length} games</p>
        </div>
    );
}