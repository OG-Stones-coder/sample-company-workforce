const loadingOverlay = document.querySelector("#loadingOverlay");
const loadingMessage = document.querySelector("#loadingMessage");

if (!loadingOverlay || !loadingMessage) {
    throw new Error("The loading indicator is missing from this page.");
}

window.loadingIndicator = {
    show(message) {
        loadingOverlay.dataset.state = "loading";
        loadingMessage.textContent = message;
        loadingOverlay.hidden = false;
    },
    fail(message) {
        loadingOverlay.dataset.state = "error";
        loadingMessage.textContent = message;
        loadingOverlay.hidden = false;
    },
    hide() {
        loadingOverlay.hidden = true;
    }
};
