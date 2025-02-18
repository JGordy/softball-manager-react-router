import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';

import { account } from '@/utils/appwrite/adminClient';
// import Logout from './logout/logout';

export async function loader() { // This runs on the server
    try {
        const session = await account.get();
        return { isLoggedIn: !!session };
    } catch (error) {
        return { isLoggedIn: false };
    }
}

export default function LoggedWrapper({ children, loaderData }) {
    const isLoggedIn = loaderData?.isLoggedIn || false;

    const navigate = useNavigate();


    useEffect(() => {
        if (isLoggedIn === false) {
            navigate('/login');
        }
    }, [isLoggedIn]);

    // Handle the initial null state while checking authentication
    if (isLoggedIn === null) {
        return <div>Checking authentication...</div>;
    }

    return (
        <>
            <div>
                <Outlet />
                {/* <div className="mt-4">
                        <Logout />
                    </div> */}
            </div>
            {children}
        </>
    );
}