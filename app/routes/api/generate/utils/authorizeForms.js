import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';

export default async function authorize() {
    const credentialsString = process.env.GOOGLE_CREDENTIALS;
    if (!credentialsString) {
        throw new Error('GOOGLE_CREDENTIALS environment variable not set.');
    }
    const credentials = JSON.parse(credentialsString);

    const client = await authenticate({
        credentials,
        scopes: [
            'https://www.googleapis.com/auth/forms.body',
            'https://www.googleapis.com/auth/forms.responses.readonly',
        ],
    });
    return google.forms({ version: 'v1', auth: client });
}