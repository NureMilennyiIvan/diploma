export const post = async (
    baseUrl: string,
    scope: string,
    route: string,
    payload: any
): Promise<unknown> => {
    const fullUrl = `${baseUrl}${scope}${route}`;
    const response = await fetch(fullUrl, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Request failed: ${response.status} - ${text}`);
    }

    return await response.json();
};
export const postBase64Tx = async (
    baseUrl: string,
    scope: string,
    route: string,
    payload: any
): Promise<string> => {
    const result = await post(baseUrl, scope, route, payload);

    if (typeof result !== "string") {
        throw new Error("Expected base64 transaction string response");
    }

    return result;
};
export const postBase64TxAndPubkey = async (
    baseUrl: string,
    scope: string,
    route: string,
    payload: any
): Promise<[string, string]> => {
    const result = await post(baseUrl, scope, route, payload);

    if (!Array.isArray(result) || result.length !== 2 || typeof result[0] !== "string" || typeof result[1] !== "string") {
        throw new Error("Expected [base64_tx, pubkey] string tuple response");
    }

    return result as [string, string];
};

export const requireEnv = (key: string) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

export const shortenAddress = (address: string, visible: number = 4): string => {
    if (address.length <= visible * 2) return address;
    return `${address.slice(0, visible)}…${address.slice(-visible)}`;
};