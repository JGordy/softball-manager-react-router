import { useRef, useState } from "react";
import { Autocomplete, Loader } from "@mantine/core";

const popularEmailProviders = [
    "gmail.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
    "yahoo.com",
    "aol.com",
    "protonmail.com",
];

export default function AutocompleteEmail({
    classes,
    defaultValue,
    disabled,
    required,
}) {
    const timeoutRef = useRef(-1);
    const [emailSuggestions, setEmailSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    return (
        <Autocomplete
            className={classes}
            defaultValue={defaultValue}
            disabled={disabled}
            label="Email"
            name="email"
            placeholder="youremail@email.com"
            required={required}
            data={emailSuggestions}
            radius="md"
            size="md"
            rightSection={loading ? <Loader size={16} /> : null}
            onChange={(value) => {
                window.clearTimeout(timeoutRef.current);
                setEmailSuggestions([]);

                if (value.trim().length === 0 || value.includes("@")) {
                    setLoading(false);
                } else {
                    setLoading(true);
                    timeoutRef.current = window.setTimeout(() => {
                        setLoading(false);
                        setEmailSuggestions(
                            popularEmailProviders.map(
                                (provider) => `${value}@${provider}`,
                            ),
                        );
                    }, 300);
                }
            }}
        />
    );
}
