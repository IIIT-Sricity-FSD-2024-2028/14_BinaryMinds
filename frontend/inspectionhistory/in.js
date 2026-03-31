const historyData = [
    {
        id: "TL-2026-045",
        name: "Sunset Coffee House",
        category: "Food & Beverage",
        inspectionDate: "2026-03-07",
        result: "Approved",
        submitted: "Mar 7, 2026"
    },
    {
        id: "TL-2026-038",
        name: "Prime Electronics Store",
        category: "Retail",
        inspectionDate: "2026-03-06",
        result: "Rejected",
        submitted: "Mar 6, 2026"
    },
    {
        id: "TL-2026-032",
        name: "Wellness Pharmacy",
        category: "Healthcare",
        inspectionDate: "2026-03-05",
        result: "Approved",
        submitted: "Mar 5, 2026"
    }
];

function renderTable(data) {
    const table = document.getElementById("historyTable");
    const countText = document.getElementById("countText");

    table.innerHTML = "";
    countText.innerText = `Showing ${data.length} inspection(s)`;

    data.forEach(item => {
        const statusClass = item.result === "Approved" ? "approved" : "rejected";

        const row = `
            <tr>
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.inspectionDate}</td>
                <td><span class="status ${statusClass}">${item.result}</span></td>
                <td>${item.submitted}</td>
                <td><button class="view-btn">View Report</button></td>
            </tr>
        `;

        table.innerHTML += row;
    });
}

// Search filter
document.getElementById("searchInput").addEventListener("input", function () {
    const value = this.value.toLowerCase();

    const filtered = historyData.filter(item =>
        item.name.toLowerCase().includes(value)
    );

    renderTable(filtered);
});

// Initial load
renderTable(historyData);