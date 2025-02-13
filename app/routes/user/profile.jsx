export async function loader({ params }) {
    return { userId: params.userId }
}

export default function UserProfile({ loaderData }) {
    console.log({ loaderData });
    return (
        <div>My Profile</div>
    );
};