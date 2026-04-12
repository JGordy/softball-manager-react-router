import {
    parseSessionCookie,
    createSessionClientFromSecret,
} from "@/utils/appwrite/server";

import { loader } from "../session";

jest.mock("@/utils/appwrite/server");

describe("session API loader", () => {
    it("returns jwt from session client", async () => {
        parseSessionCookie.mockReturnValue("mock-session-token");

        const mockAccount = {
            createJWT: jest.fn().mockResolvedValue({ jwt: "mock-jwt" }),
        };
        createSessionClientFromSecret.mockReturnValue({ account: mockAccount });

        const headers = new Headers();
        headers.set("Cookie", "a_session_xxx=mock-session-token");
        const request = new Request("http://localhost/api/session", {
            headers,
        });

        const response = await loader({ request });
        const data = await response.json();

        expect(data.jwt).toBe("mock-jwt");
    });
});
