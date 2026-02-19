import { parseSessionCookie } from "@/utils/appwrite/server";

import { loader } from "../session";

jest.mock("@/utils/appwrite/server");

describe("session API loader", () => {
    it("returns session from cookie", async () => {
        parseSessionCookie.mockReturnValue("mock-session-token");

        const headers = new Headers();
        headers.set("Cookie", "a_session_xxx=mock-session-token");
        const request = new Request("http://localhost/api/session", {
            headers,
        });

        const response = await loader({ request });
        const data = await response.json();

        expect(data.session).toBe("mock-session-token");
    });
});
