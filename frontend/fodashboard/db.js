// Mock Data
let applications = [
    { id: "TL-2026-001", name: "Green Valley Restaurant", location: "Gurugram" },
    { id: "TL-2026-002", name: "Tech Hub Electronics", location: "Bangalore" },
    { id: "TL-2026-003", name: "Fresh Mart Grocery", location: "Delhi" },
    { id: "TL-2026-004", name: "Urban Fitness Center", location: "Mumbai" }
];

// Render Table
function renderTable(data) {
    let table = document.getElementById("tableBody");
    table.innerHTML = "";

    data.forEach(app => {
        let row = `
            <tr>
                <td>${app.id}</td>
                <td>${app.name}</td>
                <td>${app.location}</td>
            </tr>
        `;
        table.innerHTML += row;
    });
}

// Search Function
document.getElementById("search").addEventListener("input", function () {
    let value = this.value.toLowerCase();

    let filtered = applications.filter(app =>
        app.id.toLowerCase().includes(value) ||
        app.name.toLowerCase().includes(value) ||
        app.location.toLowerCase().includes(value)
    );

    renderTable(filtered);
});

// Initial Load
renderTable(applications);
const inspections = [
    {
        id: "TL-2026-001",
        name: "Green Valley Restaurant",
        location: "Sector 45, Gurugram"
    },
    {
        id: "TL-2026-002",
        name: "Tech Hub Electronics",
        location: "MG Road, Bangalore"
    },
    {
        id: "TL-2026-003",
        name: "Fresh Mart Grocery",
        location: "Connaught Place, Delhi"
    },
    {
        id: "TL-2026-004",
        name: "Urban Fitness Center",
        location: "Bandra West, Mumbai"
    }
];
function renderTable() {
    const table = document.getElementById("tableBody");
    table.innerHTML = "";

    inspections.forEach(item => {
        const row = `
            <tr>
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.location}</td>
            </tr>
        `;
        table.innerHTML += row;
    });
}

// call function
renderTable();