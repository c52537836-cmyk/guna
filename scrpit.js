
const REQUIRED_ATTENDANCE = 75;

// Load saved subjects
let subjects = JSON.parse(
    localStorage.getItem("collegeSubjects") || "[]"
);

// Calculate percentage
function getPercentage(subject) {
    if (subject.total === 0) return 0;

    return (subject.attended / subject.total) * 100;
}

// Save data
function saveData() {
    localStorage.setItem(
        "collegeSubjects",
        JSON.stringify(subjects)
    );
}

// Dashboard update
function updateDashboard() {

    let total = 0;
    let attended = 0;

    subjects.forEach(subject => {
        total += subject.total;
        attended += subject.attended;
    });

    const percentage = total > 0
        ? (attended / total) * 100
        : 0;

    document.getElementById("totalSubjects").innerText =
        subjects.length;

    document.getElementById("totalClasses").innerText =
        total;

    document.getElementById("attendedClasses").innerText =
        attended;

    document.getElementById("overallPercentage").innerText =
        percentage.toFixed(1) + "%";

    displaySubjects();
    displayWarnings();
}

// Display subjects
function displaySubjects() {

    const table = document.getElementById("attendanceTable");

    table.innerHTML = "";

    subjects.forEach((subject, index) => {

        const percentage = getPercentage(subject);

        let status = "";
        let statusClass = "";
        let barClass = "";

        if (percentage >= REQUIRED_ATTENDANCE) {
            status = "Safe";
            statusClass = "safe";
            barClass = "good";
        }
        else if (percentage >= 65) {
            status = "Warning";
            statusClass = "medium";
            barClass = "warning";
        }
        else {
            status = "Shortage";
            statusClass = "low";
            barClass = "danger";
        }

        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = subject.name;

        const totalCell = document.createElement("td");
        totalCell.textContent = subject.total;

        const attendedCell = document.createElement("td");
        attendedCell.textContent = subject.attended;

        const percentageCell = document.createElement("td");

        const percentText = document.createElement("span");
        percentText.textContent = percentage.toFixed(1) + "%";

        const progress = document.createElement("div");
        progress.className = "progress";

        const bar = document.createElement("div");
        bar.className = "progress-bar " + barClass;
        bar.style.width = Math.min(percentage, 100) + "%";

        progress.appendChild(bar);
        percentageCell.append(percentText, progress);

        const statusCell = document.createElement("td");
        const badge = document.createElement("span");

        badge.className = "status " + statusClass;
        badge.textContent = status;

        statusCell.appendChild(badge);

        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.className = "action-btn";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
           