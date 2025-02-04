import { account, ID } from '@/appwrite';;

export default async function register({ email, password, name }) {
    console.log({ email, password, name });
    // Input validation
    if (!email || !password || !name) {
        return { error: 'Email, password and name are required.' };
    }

    try {
        const session = await account.create(ID.unique(), email, password, name);

        await account.createVerification('http://localhost:5173/verify');

        return ({ email, password, session });
    } catch (error) {
        console.log('Registration error:', error);
        return { error };
    }
};