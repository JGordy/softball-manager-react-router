export function removeEmptyValues({ values }) {
    // Removes undefined or empty string values from data to update
    const dataToUpdate = {};
    for (const key in values) {
        if (
            values.hasOwnProperty(key) &&
            values[key] !== undefined &&
            values[key] !== ""
        ) {
            dataToUpdate[key] = values[key];
        }
    }

    return dataToUpdate;
}
