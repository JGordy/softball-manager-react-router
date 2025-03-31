import { useState, useEffect } from 'react';
import { Autocomplete, Loader, Text } from '@mantine/core';
import { useLoadScript } from '@react-google-maps/api';

const libraries = ['places'];

export default function LocationInput({
    label = 'Location',
    placeholder = 'Where will the games be played?',
    name = 'location',
    defaultValue = '',
}) {
    const [selectedLocation, setSelectedLocation] = useState();
    const [options, setOptions] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [inputValue, setInputValue] = useState(defaultValue);
    const [isLoading, setIsLoading] = useState(false);

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries,
    });

    useEffect(() => {
        setSuggestions(options.map(option => option.place_id));
    }, [options]);

    useEffect(() => {
        if (inputValue && isLoaded) {
            setIsLoading(true);
            const service = new window.google.maps.places.PlacesService(
                document.createElement('div')
            );
            service.textSearch(
                { query: inputValue, fields: ['geometry', 'formatted_address'] },
                (results, status) => {
                    // console.log({ results, status });
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && results?.length > 0) {
                        // Filter out duplicate name values
                        const uniqueResults = [];
                        const seenLocations = new Set();
                        for (const result of results) {
                            if (!seenLocations.has(result.place_id)) {
                                uniqueResults.push(result);
                                seenLocations.add(result.place_id);
                            }
                        }

                        setOptions(uniqueResults.map((result) => ({
                            value: result.place_id,
                            ...result,
                        })));
                        setIsLoading(false);
                    } else {
                        setOptions([]);
                        setIsLoading(false);
                        console.error('Geocoding failed:', status);
                    }
                }
            );
        } else {
            setOptions([]);
            setIsLoading(false);
        }
    }, [inputValue, isLoaded]);

    const handleInputChange = (value) => {
        setInputValue(value);
        const selected = options.find((option) => option.value === value);
        if (selected) {
            setSelectedLocation(selected);
        } else {
            setSelectedLocation();
        }
    };

    const renderOption = ({ option }) => {
        if (!option) return null;

        const { value } = option;
        const optionToDisplay = options.find((opt) => opt.place_id === value);

        if (!optionToDisplay) return null;

        console.log({ options, option, optionToDisplay });
        return (
            <div>
                <Text size="sm">{optionToDisplay.name}</Text>
                {/* <Text size="xs" opacity={0.5}>
                    {}
                </Text> */}
            </div>
        );
    };

    if (loadError) return <div>Error loading maps.</div>;


    console.log({ options, suggestions });

    return (
        <div>
            <Autocomplete
                label={label}
                name={name}
                placeholder={placeholder}
                rightSection={isLoading ? <Loader size={16} /> : null}
                // value={inputValue}
                data={suggestions}
                renderOption={renderOption}
                onChange={handleInputChange}
            />
            <input type="hidden" name={`${name}Details`} value={JSON.stringify(selectedLocation)} />
        </div>
    );
}