import { formatDate } from '@/utils/dateTime';

export default function getFormBody({ gameDate, opponent }) {
    return {
        requests: [
            {
                updateSettings: {
                    settings: {
                        emailCollectionType: "VERIFIED",
                    },
                    updateMask: "emailCollectionType",
                },
            },
            {
                createItem: {
                    item: {
                        title: `Will you be attending the game on ${formatDate(new Date(gameDate))} against ${opponent || "TBD"}?`,
                        questionItem: {
                            question: {
                                required: true,
                                choiceQuestion: {
                                    type: 'RADIO',
                                    options: [
                                        { value: 'Yes, I will be there' },
                                        { value: 'No, I cannot attend' },
                                        { value: 'Maybe, I will let you know' },
                                    ],
                                },
                            },
                        },
                    },
                    location: {
                        index: 0,
                    },
                },
            },
        ],
    };
}