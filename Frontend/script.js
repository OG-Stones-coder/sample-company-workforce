const STAFF_API_URL = "https://sample-company-workforce.onrender.com/api/staff";
const staffRecords = document.querySelector("#staffRecords");
const workerCardTemplate = document.querySelector("#workerCard");
const recordsStatus = document.querySelector("#recordsStatus");
const workerForm = document.querySelector("#workerForm");
const saveWorkerButton = document.querySelector("#saveWorker");
const cancelEditButton = document.querySelector("#cancelEdit");
const profilePictureInput = workerForm.elements.profilePicture;
const profilePicturePreview = document.querySelector("#profilePicturePreview");
let editingWorkerId = null;
let profilePictureDataUrl = "";

async function requestStaff(url, options = {}) {
    const response = await window.authFetch(url, options);

    const result = await response.json().catch(() => null);
    if (!response.ok) {
        const message = result?.message || result?.error || `Request failed (${response.status}).`;
        throw new Error(message);
    }

    return result;
}

async function loadStaff() {
    recordsStatus.textContent = "Loading worker records...";

    try {
        const staff = await requestStaff(STAFF_API_URL);

        if (!Array.isArray(staff)) {
            throw new Error("The server returned an unexpected worker-record format.");
        }

        staffRecords.replaceChildren();

        for (const worker of staff) {
            const card = workerCardTemplate.content.cloneNode(true);
            const article = card.querySelector(".card");

            article.dataset.workerId = worker._id;
            const profilePicture = card.querySelector(".profilePicture");
            if (worker.profilePicture) {
                profilePicture.src = worker.profilePicture;
                profilePicture.alt = `${worker.name ?? "Worker"} profile picture`;
                profilePicture.hidden = false;
            }
            card.querySelector(".name").textContent = worker.name ?? "";
            card.querySelector(".email").textContent = worker.email ?? "";
            card.querySelector(".position").textContent = worker.position ?? "";
            card.querySelector(".salary").textContent = `Salary: $${worker.salary ?? ""}`;
            card.querySelector(".age").textContent = `Age: ${worker.age ?? ""}`;
            card.querySelector(".department").textContent = `Department: ${worker.department ?? ""}`;
            if (window.currentUser.role === "admin") {
                card.querySelector(".edit").addEventListener("click", () => startEditing(worker));
                card.querySelector(".delete").addEventListener("click", () => removeWorker(worker));
            } else {
                card.querySelector(".recordLabel").textContent = "YOUR PROFILE";
                card.querySelector(".edit").hidden = true;
                card.querySelector(".delete").hidden = true;
            }

            staffRecords.append(card);
        }

        recordsStatus.textContent = staff.length
            ? ""
            : "No worker records found.";
        return true;
    } catch (error) {
        recordsStatus.textContent = error.message;
        console.error("Failed to load worker records:", error);
        return false;
    }
}

function startEditing(worker) {
    editingWorkerId = worker._id;
    profilePictureDataUrl = worker.profilePicture ?? "";
    profilePictureInput.required = !profilePictureDataUrl;
    updateProfilePicturePreview(profilePictureDataUrl);
    workerForm.elements.name.value = worker.name ?? "";
    workerForm.elements.email.value = worker.email ?? "";
    workerForm.elements.position.value = worker.position ?? "";
    workerForm.elements.salary.value = worker.salary ?? "";
    workerForm.elements.age.value = worker.age ?? "";
    workerForm.elements.department.value = worker.department ?? "";
    workerForm.querySelector("h2").textContent = "Edit worker";
    workerForm.querySelector(".formTitle .muted").textContent = "Update the details then save your changes.";
    saveWorkerButton.textContent = "Save changes";
    cancelEditButton.hidden = false;
    workerForm.elements.name.focus();
}

function resetWorkerForm() {
    editingWorkerId = null;
    profilePictureDataUrl = "";
    profilePictureInput.required = true;
    workerForm.reset();
    updateProfilePicturePreview("");
    workerForm.querySelector("h2").textContent = "Add a worker";
    workerForm.querySelector(".formTitle .muted").textContent = "Complete all fields then save your record.";
    saveWorkerButton.textContent = "Add worker";
    cancelEditButton.hidden = true;
}

function updateProfilePicturePreview(imageDataUrl) {
    profilePicturePreview.src = imageDataUrl;
    profilePicturePreview.hidden = !imageDataUrl;
}

profilePictureInput.addEventListener("change", () => {
    const [file] = profilePictureInput.files;
    if (!file) {
        return;
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
        profilePictureInput.value = "";
        recordsStatus.textContent = "Choose a PNG, JPEG, GIF, or WebP image.";
        return;
    }
    if (file.size > 2 * 1024 * 1024) {
        profilePictureInput.value = "";
        recordsStatus.textContent = "The profile picture must be 2 MB or smaller.";
        return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
        if (typeof reader.result !== "string") {
            recordsStatus.textContent = "The selected profile picture could not be read.";
            return;
        }
        profilePictureDataUrl = reader.result;
        updateProfilePicturePreview(profilePictureDataUrl);
        recordsStatus.textContent = "";
    });
    reader.addEventListener("error", () => {
        recordsStatus.textContent = "The selected profile picture could not be read.";
    });
    reader.readAsDataURL(file);
});

workerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (window.currentUser.role !== "admin") {
        return;
    }
    const worker = Object.fromEntries(new FormData(workerForm));
    delete worker.profilePicture;
    worker.salary = Number(worker.salary);
    worker.age = Number(worker.age);
    if (profilePictureDataUrl) {
        worker.profilePicture = profilePictureDataUrl;
    }

    const url = editingWorkerId
        ? `${STAFF_API_URL}/${encodeURIComponent(editingWorkerId)}`
        : STAFF_API_URL;

    saveWorkerButton.disabled = true;
    recordsStatus.textContent = editingWorkerId ? "Saving changes..." : "Adding worker...";

    try {
        await requestStaff(url, {
            method: editingWorkerId ? "PATCH" : "POST",
            body: JSON.stringify(worker)
        });
        resetWorkerForm();
        if (await loadStaff()) {
            recordsStatus.textContent = "Worker record saved.";
        }
    } catch (error) {
        recordsStatus.textContent = error.message;
        console.error("Failed to save worker record:", error);
    } finally {
        saveWorkerButton.disabled = false;
    }
});

cancelEditButton.addEventListener("click", () => {
    resetWorkerForm();
    recordsStatus.textContent = "";
});

async function removeWorker(worker) {
    if (!window.confirm(`Delete the record for ${worker.name}?`)) {
        return;
    }

    recordsStatus.textContent = `Deleting ${worker.name}...`;

    try {
        await requestStaff(`${STAFF_API_URL}/${encodeURIComponent(worker._id)}`, {
            method: "DELETE"
        });
        if (editingWorkerId === worker._id) {
            resetWorkerForm();
        }
        if (await loadStaff()) {
            recordsStatus.textContent = "Worker record deleted.";
        }
    } catch (error) {
        recordsStatus.textContent = error.message;
        console.error("Failed to delete worker record:", error);
    }
}

window.authReady.then((user) => {
    window.currentUser = user;
    document.querySelector("#accountInfo").textContent = user.role === "admin"
        ? `Signed in as admin: ${user.username}`
        : `Signed in as ${user.name}`;

    if (user.role !== "admin") {
        workerForm.hidden = true;
        document.querySelector(".records > h2").textContent = "Your Staff Profile";
        document.querySelector(".records > .muted").textContent = "Your personal staff details.";
    }

    document.querySelector("#logoutButton").addEventListener("click", async () => {
        try {
            await window.authFetch("https://sample-company-workforce.onrender.com/api/auth/logout", { method: "POST" });
        } catch (error) {
            console.error("Failed to log out:", error);
        } finally {
            sessionStorage.removeItem("workforceToken");
            window.location.replace("auth.html");
        }
    });

    document.body.hidden = false;
    loadStaff();
}).catch((error) => {
    console.error("Authentication check failed:", error);
});