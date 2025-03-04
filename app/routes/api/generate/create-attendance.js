import authorize from './utils/authorizeForms';
import formBody from './utils/formBody';

async function createGameAttendanceForm(gameDate, team, opponent) {
    try {
        const forms = await authorize();
        const formRes = await forms.forms.create({
            requestBody: {
                info: {
                    title: `Game Attendance: ${team} vs ${opponent}`,
                    description: `Will you be able to attend the game on ${gameDate}?`,
                },
            },
        });

        const formId = formRes.data.formId;

        const questionRes = await forms.forms.batchUpdate({
            formId: formId,
            requestBody: formBody,
        });

        const questionId = questionRes.data.replies[0].createItem.questionId;

        const formUrl = `https://docs.google.com/forms/d/${formId}/viewform`;
        return { formUrl, formId, questionId };

    } catch (error) {
        console.error('Error creating form:', error);
        throw error;
    }
}

// Example call.
// main("2024-12-25", "My Team", "Opponent Team").then(result => {
//     console.log("Main result", result)
// });

export async function action({ request }) {
    const formData = await request.formData();
    const gameDate = formData.get("gameDate");
    const team = formData.get("team");
    const opponent = formData.get("opponent");

    try {
        const { formUrl, formId, questionId } = await createGameAttendanceForm(gameDate, team, opponent);
        console.log('Form URL:', formUrl);
        console.log('Form ID:', formId);
        console.log('Question ID:', questionId);

        // TODO: In your Remix/React app, store formId, formUrl, and questionId in Appwrite
        // Example (replace with your Appwrite logic):
        // await createDocument('games', 'unique-id', { formId, formUrl, questionId });

        return { formUrl, formId, questionId };
    } catch (error) {
        console.error('Error creating form:', error);
        return { error: error.message, status: 500 };
    }
}