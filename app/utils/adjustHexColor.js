function isColorDark(hexColor) {
    hexColor = hexColor.replace("#", "");
    const r = parseInt(hexColor.substring(0, 2), 16);
    const g = parseInt(hexColor.substring(2, 4), 16);
    const b = parseInt(hexColor.substring(4, 6), 16);

    // Calculate luminance (perceived brightness)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // You can adjust this threshold (0.5) to define what "dark" means
    return luminance < 0.5; // If luminance is less than 0.5, the color is considered dark
}

function adjustHexColor(hex, percent) {
    hex = hex.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const factor = 1 + (percent / 100);

    const red = Math.round(Math.min(255, Math.max(0, r * factor)));
    const green = Math.round(Math.min(255, Math.max(0, g * factor)));
    const blue = Math.round(Math.min(255, Math.max(0, b * factor)));

    const adjustedHex = "#" + ((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1);
    return adjustedHex;
}



export function adjustColorBasedOnDarkness(hexColor, percent) {
    if (isColorDark(hexColor)) {
        return adjustHexColor(hexColor, percent); // Lighten if dark
    } else {
        return adjustHexColor(hexColor, -percent); // Darken if light
    }
}