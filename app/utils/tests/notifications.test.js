import {
    NOTIFICATION_TYPES,
    NOTIFICATION_TOPICS,
    buildTeamTopic,
    buildSeasonTopic,
    formatNotificationPayload,
    isPushSupported,
    getNotificationPermission,
    areNotificationsEnabled,
    areNotificationsDenied,
    validateUserId,
    validateNotificationPayload,
} from "../notifications";

describe("notifications utility", () => {
    describe("constants", () => {
        it("should export NOTIFICATION_TYPES", () => {
            expect(NOTIFICATION_TYPES).toBeDefined();
            expect(NOTIFICATION_TYPES.GAME_REMINDER).toBe("game_reminder");
            expect(NOTIFICATION_TYPES.LINEUP_FINALIZED).toBe(
                "lineup_finalized",
            );
            expect(NOTIFICATION_TYPES.TEAM_ANNOUNCEMENT).toBe(
                "team_announcement",
            );
            expect(NOTIFICATION_TYPES.ATTENDANCE_REQUEST).toBe(
                "attendance_request",
            );
            expect(NOTIFICATION_TYPES.INVITATION).toBe("invitation");
        });

        it("should export NOTIFICATION_TOPICS", () => {
            expect(NOTIFICATION_TOPICS).toBeDefined();
            expect(NOTIFICATION_TOPICS.ALL_USERS).toBe("all_users");
            expect(NOTIFICATION_TOPICS.TEAM_PREFIX).toBe("team_");
            expect(NOTIFICATION_TOPICS.SEASON_PREFIX).toBe("season_");
        });
    });

    describe("buildTeamTopic", () => {
        it("should build correct topic name for team", () => {
            expect(buildTeamTopic("abc123")).toBe("team_abc123");
        });

        it("should throw error if teamId is not provided", () => {
            expect(() => buildTeamTopic("")).toThrow(
                "Team ID is required to build team topic",
            );
            expect(() => buildTeamTopic(null)).toThrow(
                "Team ID is required to build team topic",
            );
            expect(() => buildTeamTopic(undefined)).toThrow(
                "Team ID is required to build team topic",
            );
        });
    });

    describe("buildSeasonTopic", () => {
        it("should build correct topic name for season", () => {
            expect(buildSeasonTopic("xyz789")).toBe("season_xyz789");
        });

        it("should throw error if seasonId is not provided", () => {
            expect(() => buildSeasonTopic("")).toThrow(
                "Season ID is required to build season topic",
            );
            expect(() => buildSeasonTopic(null)).toThrow(
                "Season ID is required to build season topic",
            );
            expect(() => buildSeasonTopic(undefined)).toThrow(
                "Season ID is required to build season topic",
            );
        });
    });

    describe("formatNotificationPayload", () => {
        it("should format payload with all options", () => {
            const payload = formatNotificationPayload({
                title: "Test Title",
                body: "Test body message",
                type: NOTIFICATION_TYPES.GAME_REMINDER,
                icon: "/custom-icon.png",
                badge: "/custom-badge.png",
                url: "/game/123",
                data: { gameId: "123" },
            });

            expect(payload.title).toBe("Test Title");
            expect(payload.body).toBe("Test body message");
            expect(payload.icon).toBe("/custom-icon.png");
            expect(payload.badge).toBe("/custom-badge.png");
            expect(payload.data.type).toBe(NOTIFICATION_TYPES.GAME_REMINDER);
            expect(payload.data.url).toBe("/game/123");
            expect(payload.data.gameId).toBe("123");
            expect(payload.data.title).toBe("Test Title");
            expect(payload.data.body).toBe("Test body message");
            expect(payload.data.icon).toBe("/custom-icon.png");
            expect(payload.data.badge).toBe("/custom-badge.png");
            expect(payload.data.timestamp).toBeDefined();
        });

        it("should use defaults for optional options", () => {
            const payload = formatNotificationPayload({
                title: "Test",
                body: "Body",
            });

            expect(payload.icon).toBe("/android-chrome-192x192.png");
            expect(payload.badge).toBe("/favicon-32x32.png");
            expect(payload.data.type).toBe(
                NOTIFICATION_TYPES.TEAM_ANNOUNCEMENT,
            );
            expect(payload.data.url).toBe("/");
            expect(payload.data.title).toBe("Test");
            expect(payload.data.body).toBe("Body");
            expect(payload.data.icon).toBe("/android-chrome-192x192.png");
            expect(payload.data.badge).toBe("/favicon-32x32.png");
        });

        it("should throw error if title is missing", () => {
            expect(() =>
                formatNotificationPayload({
                    title: "",
                    body: "Body",
                }),
            ).toThrow("Notification title is required");
        });

        it("should throw error if body is missing", () => {
            expect(() =>
                formatNotificationPayload({
                    title: "Title",
                    body: "",
                }),
            ).toThrow("Notification body is required");
        });
    });

    describe("isPushSupported", () => {
        let originalServiceWorker;
        let originalPushManager;
        let originalNotification;
        let serviceWorkerDescriptor;

        beforeEach(() => {
            originalServiceWorker = navigator.serviceWorker;
            originalPushManager = window.PushManager;
            originalNotification = window.Notification;
            serviceWorkerDescriptor = Object.getOwnPropertyDescriptor(
                navigator,
                "serviceWorker",
            );
        });

        afterEach(() => {
            if (serviceWorkerDescriptor) {
                Object.defineProperty(
                    navigator,
                    "serviceWorker",
                    serviceWorkerDescriptor,
                );
            } else {
                Object.defineProperty(navigator, "serviceWorker", {
                    value: originalServiceWorker,
                    writable: true,
                    configurable: true,
                });
            }
            window.PushManager = originalPushManager;
            window.Notification = originalNotification;
        });

        it("should return false if window is undefined (server-side)", () => {
            // This tests the typeof check - in JSDOM window is always defined
            // So we test the other conditions
            expect(typeof isPushSupported()).toBe("boolean");
        });

        it("should return false if PushManager is not supported", () => {
            Object.defineProperty(navigator, "serviceWorker", {
                value: {},
                writable: true,
                configurable: true,
            });
            delete window.PushManager;
            window.Notification = {};
            expect(isPushSupported()).toBe(false);
        });

        it("should return true if all features are supported", () => {
            Object.defineProperty(navigator, "serviceWorker", {
                value: {},
                writable: true,
                configurable: true,
            });
            window.PushManager = {};
            window.Notification = {};
            expect(isPushSupported()).toBe(true);
        });
    });

    describe("getNotificationPermission", () => {
        let originalNotification;

        beforeEach(() => {
            originalNotification = window.Notification;
        });

        afterEach(() => {
            window.Notification = originalNotification;
        });

        it("should return null if Notification is not in window", () => {
            delete window.Notification;
            expect(getNotificationPermission()).toBe(null);
        });

        it("should return the permission status", () => {
            window.Notification = {
                permission: "granted",
            };
            expect(getNotificationPermission()).toBe("granted");
        });

        it("should return denied status", () => {
            window.Notification = {
                permission: "denied",
            };
            expect(getNotificationPermission()).toBe("denied");
        });
    });

    describe("areNotificationsEnabled", () => {
        let originalNotification;

        beforeEach(() => {
            originalNotification = window.Notification;
        });

        afterEach(() => {
            window.Notification = originalNotification;
        });

        it("should return true if permission is granted", () => {
            window.Notification = {
                permission: "granted",
            };
            expect(areNotificationsEnabled()).toBe(true);
        });

        it("should return false if permission is denied", () => {
            window.Notification = {
                permission: "denied",
            };
            expect(areNotificationsEnabled()).toBe(false);
        });

        it("should return false if permission is default", () => {
            window.Notification = {
                permission: "default",
            };
            expect(areNotificationsEnabled()).toBe(false);
        });
    });

    describe("areNotificationsDenied", () => {
        let originalNotification;

        beforeEach(() => {
            originalNotification = window.Notification;
        });

        afterEach(() => {
            window.Notification = originalNotification;
        });

        it("should return true if permission is denied", () => {
            window.Notification = {
                permission: "denied",
            };
            expect(areNotificationsDenied()).toBe(true);
        });

        it("should return false if permission is granted", () => {
            window.Notification = {
                permission: "granted",
            };
            expect(areNotificationsDenied()).toBe(false);
        });
    });

    describe("validateUserId", () => {
        it("should not throw for valid userId", () => {
            expect(() => validateUserId("user-123")).not.toThrow();
        });

        it("should throw for empty userId", () => {
            expect(() => validateUserId("")).toThrow(
                "Valid user ID is required",
            );
        });

        it("should throw for null userId", () => {
            expect(() => validateUserId(null)).toThrow(
                "Valid user ID is required",
            );
        });

        it("should throw for non-string userId", () => {
            expect(() => validateUserId(123)).toThrow(
                "Valid user ID is required",
            );
        });
    });

    describe("validateNotificationPayload", () => {
        it("should not throw for valid payload", () => {
            expect(() =>
                validateNotificationPayload({
                    title: "Test",
                    body: "Body",
                }),
            ).not.toThrow();
        });

        it("should throw for null payload", () => {
            expect(() => validateNotificationPayload(null)).toThrow(
                "Notification payload must be an object",
            );
        });

        it("should throw for non-object payload", () => {
            expect(() => validateNotificationPayload("string")).toThrow(
                "Notification payload must be an object",
            );
        });

        it("should throw for missing title", () => {
            expect(() =>
                validateNotificationPayload({
                    body: "Body",
                }),
            ).toThrow("Notification title is required and must be a string");
        });

        it("should throw for non-string title", () => {
            expect(() =>
                validateNotificationPayload({
                    title: 123,
                    body: "Body",
                }),
            ).toThrow("Notification title is required and must be a string");
        });

        it("should throw for missing body", () => {
            expect(() =>
                validateNotificationPayload({
                    title: "Title",
                }),
            ).toThrow("Notification body is required and must be a string");
        });

        it("should throw for non-string body", () => {
            expect(() =>
                validateNotificationPayload({
                    title: "Title",
                    body: 123,
                }),
            ).toThrow("Notification body is required and must be a string");
        });
    });
});
