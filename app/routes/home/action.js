export async function createTeamAction({ request }) {
    const formData = await request.formData();
    const newTeam = Object.fromEntries(formData.entries());
    console.log('createTeamAction > newTeam: ', { newTeam });

    // try {
    //     const response = await fetch('/api/teams', { // Replace with your API endpoint
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify(newTeam),
    //     });

    //     if (!response.ok) {
    //         const errorData = await response.json();
    //         throw new Error(errorData.message || "Failed to create team");
    //     }

    //     return response; // Or return the created team data if your API does so.
    // } catch (error) {
    //     console.error("Error creating team:", error);
    //     throw error; // Re-throw the error for React Router to handle
    // }
}