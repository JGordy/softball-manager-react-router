import authorize from "./utils/authorizeForms";

async function readFormResponses(formId) {
    try {
        const forms = await authorize();
        const res = await forms.forms.responses.list({
            formId: formId,
        });

        return res.data.responses || []; // Return an empty array if no responses
    } catch (error) {
        console.error('Error reading form responses:', error);
        throw error;
    }
}

async function parseResponses(formResponses, questionId) {
    return formResponses.map(response => {
        const answer = response.answers[questionId];
        return {
            respondentEmail: response.respondentEmail,
            answer: answer ? answer.textAnswers.answers[0].value : null,
            createTime: response.createTime,
        };
    });
}

export async function action({ request }) {
    const formData = await request.formData();
    const formId = formData.get("formId");
    const questionId = formData.get("questionId");

    try {
        const responses = await readFormResponses(formId);
        const parsedResponses = parseResponses(responses, questionId);

        return { responses: parsedResponses };
    } catch (error) {
        console.error("Error getting responses", error);
        return { error: error.message, status: 500 };
    }
}