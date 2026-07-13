export function isMobileUserAgent(request) {
    const userAgent = request.headers.get("User-Agent") || "";
    return Boolean(
        userAgent.match(
            /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i,
        ),
    );
}

export function isBotUserAgent(request) {
    const userAgent = request?.headers?.get?.("User-Agent") || "";
    return Boolean(
        userAgent.match(
            /bot|crawler|spider|crawling|facebookexternalhit|Twitterbot|Slackbot|Discordbot|WhatsApp|TelegramBot|Applebot|Embedly|SkypeUriPreview/i,
        ),
    );
}
