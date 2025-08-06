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
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_SERVICES_API_KEY,
        libraries,
    });

    useEffect(() => {
        if (inputValue && isLoaded) {
            setIsLoading(true);
            (async () => {
                try {
                    const { Place } = window.google.maps.places;
                    const request = {
                        fields: ['displayName', 'formattedAddress', 'location', 'id', 'types', 'googleMapsURI'],
                        textQuery: inputValue,
                        // includedType: 'park',
                    };
                    const { places } = await Place.searchByText(request);

                    if (places?.length > 0) {
                        const uniqueResultsMap = new Map();
                        const formattedPlaces = places.map(place => ({
                            displayName: place.displayName,
                            formattedAddress: place.formattedAddress,
                            googleMapsURI: place.googleMapsURI,
                            location: place.location,
                            placeId: place.id,
                            types: place.types,
                        }));

                        for (const result of formattedPlaces) {
                            if (!uniqueResultsMap.has(result.displayName)) {
                                uniqueResultsMap.set(result.displayName, result);
                            }
                        }
                        const uniqueResults = Array.from(uniqueResultsMap.values());
                        console.log({ uniqueResults });
                        setOptions(uniqueResults);
                        setAutocompleteData(uniqueResults.map(option => option.displayName));
                    } else {
                        setOptions([]);
                        setAutocompleteData([]);
                        console.log('No places found for:', inputValue);
                    }
                } catch (error) {
                    console.error('Error searching for places:', error);
                    setOptions([]);
                    setAutocompleteData([]);
                } finally {
                    setIsLoading(false);
                }
            })();
        } else {
            setOptions([]);
            setAutocompleteData([]);
            setIsLoading(false);
        }
    }, [inputValue, isLoaded]);

    const handleInputChange = (value) => {
        setInputValue(value);
        const selected = options.find((option) => option.displayName === value);
        setSelectedLocation(selected);
    };

    const renderOption = ({ option }) => {
        const foundOption = options.find(opt => opt.displayName === option.value);
        if (!foundOption) return null;

        return (
            <div>
                <Text size="sm">{foundOption.displayName}</Text>
                <Text size="xs" opacity={0.5}>
                    {foundOption.formattedAddress}
                </Text>
            </div>
        );
    };

    if (loadError) return <div>Error loading maps.</div>;
    if (!isLoaded) return <div>Loading Google Maps...</div>;

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