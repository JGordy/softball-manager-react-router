import { useRef, useState } from 'react';
import { Autocomplete, Loader } from "@mantine/core";

const popularEmailProviders = [
    'gmail.com',
    'outlook.com',
    'hotmail.com',
    'icloud.com',
    'yahoo.com',
    'aol.com',
    'protonmail.com',
];

export default function AutocompleteEmail() {

    const timeoutRef = useRef(-1);
    const [emailSuggestions, setEmailSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    return (
        <Autocomplete
            label="Email"
            name="email"
            placeholder="your@email.com"
            data={emailSuggestions}
            rightSection={loading ? <Loader size={16} /> : null}
            onChange={(value) => {
                window.clearTimeout(timeoutRef.current);
                setEmailSuggestions([]);

                if (value.trim().length === 0 || value.includes('@')) {
                    setLoading(false);
                } else {
                    setLoading(true);
                    timeoutRef.current = window.setTimeout(() => {
                        setLoading(false);
                        setEmailSuggestions(
                            popularEmailProviders.map(
                                (provider) => `${value}@${provider}`
                            )
                        );
                    }, 300);
                }
            }}
        />
    );
};