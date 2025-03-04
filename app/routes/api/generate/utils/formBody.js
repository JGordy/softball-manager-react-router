export default {
    requests: [
        {
            createItem: {
                item: {
                    title: 'Will you be attending?',
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
}