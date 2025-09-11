const awHostURL = import.meta.env.VITE_APPWRITE_HOST_URL;
const awBucketId = "67af948b00375c741493";
const awProjId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const getSrc = (fileId) =>
    `${awHostURL}/storage/buckets/${awBucketId}/files/${fileId}/view?project=${awProjId}`;

import imageManifest from "./imageManifest.json";

const images = {};
for (const [key, fileId] of Object.entries(imageManifest)) {
    images[key] = getSrc(fileId);
}

export default images;
