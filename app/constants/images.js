const awHostURL = import.meta.env.VITE_APPWRITE_HOST_URL;
const awBucketId = "67af948b00375c741493";
const awProjId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const getSrc = (fileId) =>
    `${awHostURL}/storage/buckets/${awBucketId}/files/${fileId}/view?project=${awProjId}`;

import imageManifest from "./imageManifest.json";

const images = {
    brandLogoDark: "/images/brand-logo-dark.png",
    brandLogoLight: "/images/brand-logo-light.png",
    brandIcon192: "/android-chrome-icon-192x192.png",
    brandIcon350: "/android-chrome-icon-512x512.png",
};

for (const [key, fileId] of Object.entries(imageManifest)) {
    if (!images[key]) {
        images[key] = getSrc(fileId);
    }
}

export default images;
