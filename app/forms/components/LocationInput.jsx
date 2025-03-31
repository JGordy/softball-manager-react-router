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
    const [autocompleteData, setAutocompleteData] = useState([]);
    const [inputValue, setInputValue] = useState(defaultValue);
    const [isLoading, setIsLoading] = useState(false);

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries,
    });

    useEffect(() => {
        if (inputValue && isLoaded) {
            setIsLoading(true);
            const service = new window.google.maps.places.PlacesService(
                document.createElement('div')
            );
            service.textSearch(
                { query: inputValue, fields: ['geometry', 'formatted_address', 'name', 'place_id'] },
                (results, status) => {
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && results?.length > 0) {
                        const uniqueResultsMap = new Map(); // Use a Map to track unique names
                        for (const result of results) {
                            if (!uniqueResultsMap.has(result.name)) {
                                uniqueResultsMap.set(result.name, {
                                    place_id: result.place_id,
                                    name: result.name,
                                    formatted_address: result.formatted_address,
                                    geometry: result.geometry,
                                });
                            }
                        }
                        const uniqueResults = Array.from(uniqueResultsMap.values());
                        setOptions(uniqueResults);
                        setAutocompleteData(uniqueResults.map(option => option.name));
                        setIsLoading(false);
                    } else {
                        setOptions([]);
                        setAutocompleteData([]);
                        setIsLoading(false);
                        console.error('Geocoding failed:', status);
                    }
                }
            );
        } else {
            setOptions([]);
            setAutocompleteData([]);
            setIsLoading(false);
        }
    }, [inputValue, isLoaded]);

    const handleInputChange = (value) => {
        setInputValue(value);
        // When the input value changes, check if it matches an option name
        const selected = options.find((option) => option.name === value);
        setSelectedLocation(selected);
    };

    const renderOption = ({ option }) => {
        const foundOption = options.find(opt => opt.name === option.value);
        if (!foundOption) return null;

        return (
            <div>
                <Text size="sm">{foundOption.name}</Text>
                <Text size="xs" opacity={0.5}>
                    {foundOption.formatted_address}
                </Text>
            </div>
        );
    };

    if (loadError) return <div>Error loading maps.</div>;

    return (
        <div>
            <Autocomplete
                label={label}
                name={name}
                placeholder={placeholder}
                rightSection={isLoading ? <Loader size={16} /> : null}
                value={inputValue}
                data={autocompleteData}
                renderOption={renderOption}
                onChange={handleInputChange}
            />
            <input type="hidden" name={`${name}Details`} value={JSON.stringify(selectedLocation)} />
        </div>
    );
}