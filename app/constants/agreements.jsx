export const BETA_AGREEMENT_CONTENT = (user) => (
    <>
        <strong>Participant:</strong> {user?.name || "Participant"} <br />
        <strong>Developer:</strong> Joseph Gordy <br />
        <br />
        <strong>Beta Purpose:</strong> You acknowledge that the app is in
        "Beta." It may contain bugs, errors, or data inconsistencies. It is
        provided "As-Is." <br />
        <br />
        <strong>Feedback:</strong> In exchange for free access, you agree to
        provide occasional feedback on features and usability. <br />
        <br />
        <strong>Data Privacy:</strong> We will use your team’s data (lineups,
        rosters) only to improve the app. We won't sell your data to third
        parties. <br />
        <br />
        <strong>No Warranty:</strong> The Developer is not responsible for any
        lost games, incorrect stats, or "dugout drama" caused by app errors.{" "}
        <br />
        <br />
        <strong>Termination:</strong> Either party can stop the beta test at any
        time.
    </>
);

export const PRIVACY_POLICY_CONTENT = (
    <>
        <strong>Data We Collect:</strong> We collect user emails for login and
        team roster data (names, positions) to generate your lineups. <br />
        <br />
        <strong>How We Use It:</strong> To provide the core functionality of the
        app and to communicate beta updates. <br />
        <br />
        <strong>Third Parties:</strong> We use Appwrite for data storage and the
        Google Gemini API for automated lineup suggestions and other AI
        features. Your data is processed securely through these providers.{" "}
        <br />
        <br />
        <strong>Your Rights:</strong> You can request to have your data deleted
        at any time by contacting support@rostrhq.app.
    </>
);
