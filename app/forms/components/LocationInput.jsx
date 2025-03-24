import { useState, useEffect } from 'react';
import { Autocomplete, Text } from '@mantine/core';
import { useLoadScript } from '@react-google-maps/api';

const libraries = ['places'];

const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

export default function LocationInput({
    label = 'Location',
    placeholder = 'Where will the games be played?',
    name = 'location',
    defaultValue = '',
}) {
    const [selectedLocation, setSelectedLocation] = useState();
    const [options, setOptions] = useState([]);
    const [inputValue, setInputValue] = useState(defaultValue);
    const [debouncedValue, setDebouncedValue] = useState(defaultValue);

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries,
    });

    useEffect(() => {
        const debounced = debounce((value) => {
            setDebouncedValue(value);
        }, 300);

        debounced(inputValue);
    }, [inputValue]);

    useEffect(() => {
        if (debouncedValue && isLoaded) {
            const service = new window.google.maps.places.PlacesService(
                document.createElement('div')
            );
            service.textSearch(
                { query: debouncedValue, fields: ['geometry', 'formatted_address'] },
                (results, status) => {
                    console.log({ results, status });
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && results?.length > 0) {
                        // Filter out duplicate name values
                        const uniqueResults = [];
                        const seenLocations = new Set();
                        for (const result of results) {
                            if (!seenLocations.has(result.name)) {
                                uniqueResults.push(result);
                                seenLocations.add(result.name);
                            }
                        }

                        setOptions(uniqueResults.map((result) => ({
                            value: result.name,
                            ...result,
                        })));
                    } else {
                        setOptions([]);
                        console.error('Geocoding failed:', status);
                    }
                }
            );
        } else {
            setOptions([]);
        }
    }, [debouncedValue, isLoaded]);

    const handleInputChange = (value) => {
        setInputValue(value);
        const selected = options.find((option) => option.value === value);
        if (selected) {
            setSelectedLocation(selected);
        } else {
            setSelectedLocation();
        }
    };

    const renderAutocompleteOption = ({ option }) => {
        console.log({ option });
        return (
            <div>
                <Text size="sm">{option.value}</Text>
                {/* <Text size="xs" opacity={0.5}>
                    {}
                </Text> */}
            </div>
        );
    };

    const debouncedHandleInputChange = debounce(handleInputChange, 300);

    if (loadError) return <div>Error loading maps.</div>;

    return (
        <div>
            <Autocomplete
                label={label}
                name={name}
                placeholder={placeholder}
                value={inputValue}
                data={options}
                renderOption={renderAutocompleteOption}
                onChange={debouncedHandleInputChange}
            />
            <input type="hidden" name={`${name}Details`} value={JSON.stringify(selectedLocation)} />
        </div>
    );
}