const availabilityOptions = [
    { value: 'Yes, I will be there', key: 'yes' },
    { value: 'No, I cannot attend', key: 'no' },
    { value: 'Maybe, I will let you know', key: 'maybe' },
];

export default function addPlayerAvailability(responses, players) {
    const availabilityMap = {};
    availabilityOptions.forEach(option => {
        availabilityMap[option.value] = option.key;
    });

    if (!responses || responses.length === 0) {
        return players.map(p => ({ ...p, available: 'noresponse' }));
    }

    return players.map(player => {
        const response = responses.find(r => r.respondentEmail === player.email);
        const available = response
            ? (availabilityMap[response.answer] || 'noresponse')
            : 'noresponse';
        return { ...player, available };
    });
}