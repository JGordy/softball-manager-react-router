export function isMobileUserAgent(request) {
    const userAgent = request.headers.get("User-Agent") || "";
    return Boolean(
        userAgent.match(
            /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i,
        ),
    );
}
