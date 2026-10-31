const AUTH_API_URL = "http://localhost:5000/api/auth";

window.authReady = (async () => {
    const token = sessionStorage.getItem("workforceToken");
    if (!token) {
        window.location.replace("auth.html");
        throw new Error("Not authenticated.");
    }

    const response = await fetch(`${AUTH_API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
        sessionStorage.removeItem("workforceToken");
        window.location.replace("auth.html");
        throw new Error(result?.message || "Please log in to continue.");
    }

    return result.user;
})();

window.authFetch = async (url, options = {}) => {
    const token = sessionStorage.getItem("workforceToken");
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers,
            Authorization: `Bearer ${token}`
        }
    });

    if (response.status === 401) {
        sessionStorage.removeItem("workforceToken");
        window.location.replace("auth.html");
    }
    return response;
};
