const AUTH_API_URL = "https://sample-company-workforce.onrender.com/api/auth";
const authStatus = document.querySelector("#authStatus");
const authForms = document.querySelectorAll(".authForm");

function setPasswordVisibility(button, visible) {
    const passwordInput = document.getElementById(button.getAttribute("aria-controls"));
    passwordInput.type = visible ? "text" : "password";
    button.textContent = visible ? "Hide" : "Show";
    button.setAttribute("aria-pressed", String(visible));
    button.setAttribute("aria-label", `${visible ? "Hide" : "Show"} password`);
}

document.querySelectorAll(".passwordToggle").forEach((button) => {
    button.addEventListener("click", () => {
        setPasswordVisibility(button, button.getAttribute("aria-pressed") !== "true");
    });
});

document.querySelectorAll(".authTab").forEach((tab) => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".authTab").forEach((item) => {
            const active = item === tab;
            item.classList.toggle("active", active);
            item.setAttribute("aria-selected", String(active));
        });
        authForms.forEach((form) => {
            form.hidden = form.id !== tab.dataset.panel;
        });
        document.querySelectorAll(".passwordToggle").forEach((button) => {
            setPasswordVisibility(button, false);
        });
        authStatus.textContent = "";
    });
});

async function submitAuthentication(endpoint, form, successMessage) {
    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    authStatus.textContent = "Please wait...";

    try {
        const response = await fetch(`${AUTH_API_URL}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(new FormData(form)))
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(result?.message || `Request failed (${response.status}).`);
        }

        sessionStorage.setItem("workforceToken", result.token);
        authStatus.textContent = successMessage;
        window.location.replace("index.html");
    } catch (error) {
        authStatus.textContent = error.message;
        console.error("Authentication failed:", error);
    } finally {
        submitButton.disabled = false;
    }
}

document.querySelector("#adminPanel").addEventListener("submit", (event) => {
    event.preventDefault();
    submitAuthentication("admin/login", event.currentTarget, "Signed in. Opening your dashboard...");
});

document.querySelector("#staffLoginPanel").addEventListener("submit", (event) => {
    event.preventDefault();
    submitAuthentication("staff/login", event.currentTarget, "Signed in. Opening your profile...");
});

document.querySelector("#staffSignupPanel").addEventListener("submit", (event) => {
    event.preventDefault();
    submitAuthentication("staff/signup", event.currentTarget, "Account created. Opening your profile...");
});

if (sessionStorage.getItem("workforceToken")) {
    fetch(`${AUTH_API_URL}/me`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("workforceToken")}` }
    }).then((response) => {
        if (response.ok) {
            window.location.replace("index.html");
        }
    }).catch((error) => {
        console.error("Failed to check existing login:", error);
    });
}
