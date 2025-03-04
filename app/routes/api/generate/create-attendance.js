import { ID } from '@/appwrite';
import { createDocument } from '@/utils/databases';

import authorize from './utils/authorizeForms';
import getFormBody from './utils/formBody';

async function createGameAttendanceForm(gameDate, team, opponent) {
    try {
        const forms = await authorize();
        const formRes = await forms.forms.create({
            requestBody: {
                info: {
                    title: `Game Attendance: ${team.name} vs ${opponent || "TBD"}`,
                },
            },
        });


        const formId = formRes.data.formId;

        const questionRes = await forms.forms.batchUpdate({
            formId: formId,
            requestBody: getFormBody({ gameDate, opponent }),
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
    try {
        const { team, opponent, gameDate, gameId } = await request.json();

        const { formUrl, formId, questionId } = await createGameAttendanceForm(gameDate, team, opponent);
        // console.log({ formUrl, formId, questionId });

        await createDocument('forms', ID.unique(), {
            formId,
            formUrl,
            questionId: questionId[0],
            teamId: team.$id,
            gameId,
        });

        return { formUrl, formId, questionId };
    } catch (error) {
        console.error('Error creating form:', error);
        return { error: error.message, status: 500 };
    }
}