import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import { Container } from "@mantine/core";

import { account } from "@/appwrite";

export default function Verify() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState("Verifying...");

    useEffect(() => {
        async function verifyAccount() {
            try {
                const secret = searchParams.get("secret");
                const userId = searchParams.get("userId");

                if (!secret || !userId) {
                    setStatus("Missing verification parameters");
                    return;
                }

                await account.updateVerification(userId, secret);

                setStatus("Account verified successfully");
            } catch (error) {
                setStatus("Verification failed: " + error?.message);
            }
        }

        verifyAccount();
    }, [searchParams]);

    return (
        <Container className="verification-container">
            <h1>Account Verification</h1>
            <div className="status-message">{status}</div>
        </Container>
    );
}
