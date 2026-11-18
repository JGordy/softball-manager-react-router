import {
    parseSessionCookie,
    createSessionClientFromSecret,
    createAdminClient,
} from "@/utils/appwrite/server";

import { loader } from "../session";

jest.mock("@/utils/appwrite/server");

describe("session API loader", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns null jwt when no session cookie is present", async () => {
        parseSessionCookie.mockReturnValue(null);

        const request = new Request("http://localhost/api/session");
        const response = await loader({ request });
        const data = await response.json();

        expect(data.jwt).toBeNull();
        expect(createSessionClientFromSecret).not.toHaveBeenCalled();
    });

    it("returns jwt using users.createJWT after verifying session account", async () => {
        parseSessionCookie.mockReturnValue("mock-session-token");

        const mockAccount = {
            get: jest.fn().mockResolvedValue({ $id: "user-123" }),
        };
        const mockUsers = {
            createJWT: jest.fn().mockResolvedValue({ jwt: "mock-jwt" }),
        };
        createSessionClientFromSecret.mockReturnValue({ account: mockAccount });
        createAdminClient.mockReturnValue({ users: mockUsers });

        const headers = new Headers();
        headers.set("Cookie", "a_session_xxx=mock-session-token");
        const request = new Request("http://localhost/api/session", {
            headers,
        });

        const response = await loader({ request });
        const data = await response.json();

        expect(mockAccount.get).toHaveBeenCalled();
        expect(mockUsers.createJWT).toHaveBeenCalledWith({
            userId: "user-123",
        });
        expect(data.jwt).toBe("mock-jwt");
    });
});
