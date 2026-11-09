import { useLoaderData } from "react-router";
import DefensivePlaybook from "@/components/DefensivePlaybook";
import { DEFENSIVE_PLAYS, PLAY_CATEGORIES } from "@data/defensivePlays.js";

/**
 * Route metadata for the Defensive Playbook page.
 *
 * @returns {Array<Object>} Meta tags
 */
export function meta() {
    return [
        { title: "Defensive Playbook | RostrHQ" },
        {
            name: "description",
            content:
                "Interactive slow-pitch softball defensive playbook and 10-player field alignment engine for ASA/USA Softball and USSSA.",
        },
    ];
}

/**
 * Server/client loader for the Defensive Playbook route.
 *
 * @returns {Promise<{plays: Array<Object>, categories: Array<string>}>}
 */
export async function loader() {
    return {
        plays: DEFENSIVE_PLAYS || [],
        categories: PLAY_CATEGORIES || [],
    };
}

/**
 * Defensive Playbook Page Route Component.
 *
 * @returns {JSX.Element}
 */
export default function DefensivePlaybookPage() {
    const { plays, categories } = useLoaderData();

    return <DefensivePlaybook plays={plays} categories={categories} />;
}
