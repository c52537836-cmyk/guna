async function api(url, method = "GET", data = null) {
    const options = {
        method,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" }
    };

    if (data) options.body = JSON.stringify(data);

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) throw new Error(result.message);

    return result;
}

async function register() {
    try {
        const result = await api("/api/register", "POST", {
            name: document.getElementById("name").value,
            email: document.getElementById("regEmail").value,
            password: document.getElementById("regPassword").value,
            role: document.getElementById("role").value
        });

        document.getElementById("message").innerText = result.message;
    } catch (error) {
        document.getElementById("message").innerText = error.message;
    }
}

async function login() {
    try {
        await api("/api/login", "POST", {
            email: document.getElementById("email").value,
            password: document.getElementById("password").value
        });

        window.location.href = "/dashboard.html";
    } catch (error) {
        document.getElementById("message").innerText = error.message;
    }
}

async function markAttendance() {
    try {
        const result = await api("/api/attendance", "POST", {
            user_id: Number(document.getElementById("studentId").value),
            status: document.getElementById("status").value
        });

        alert(result.message);
        loadAttendance();
    } catch (error) {
        alert(error.message);
    }
}

async function loadAttendance() {
    try {
        const records = await api("/api/attendance");
        const tbody = document.getElementById("records");

        tbody.innerHTML = "";

        records.forEach(record => {
            const tr = document.createElement("tr");

            [record.name, record.date, record.status].forEach(value => {
                const td = document.createElement("td");
                td.textContent = value;
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });
    } catch (error) {
        alert(error.message);
    }
}

async function logout() {
    await api("/api/logout", "POST");
    window.location.href = "/";
}

async function initializeDashboard() {
    try {
        const user = await api("/api/me");

        document.getElementById("welcome").innerText =
            "Welcome " + user.name + " (" + user.role + ")";

        if (user.role === "student") {
            document.getElementById("markSection").style.display = "none";
        }

        loadAttendance();
    } catch {
        window.location.href = "/";
    }
}

if (document.getElementById("welcome")) {
    initializeDashboard();
}