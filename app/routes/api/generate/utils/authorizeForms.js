import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export default async function authorize() {
    const credentialsString = process.env.GOOGLE_CREDENTIALS;
    if (!credentialsString) {
        throw new Error('GOOGLE_CREDENTIALS environment variable not set.');
    }
    const credentials = JSON.parse(credentialsString);

    const client = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: [
            'https://www.googleapis.com/auth/forms.body',
            'https://www.googleapis.com/auth/forms.responses.readonly',
        ],
    });

    await client.authorize(); // Authorize the client

    return google.forms({ version: 'v1', auth: client });
}