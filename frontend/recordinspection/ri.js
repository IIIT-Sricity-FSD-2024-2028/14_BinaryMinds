// Mock data
const inspections = [
    {
        id: "TL-2026-001",
        name: "Green Valley Restaurant",
        type: "Food & Beverage",
        address: "123 Main Street, Sector 45, Gurugram, Haryana",
        date: "Mar 8, 2026",
        time: "10:00 AM"
    },
    {
        id: "TL-2026-002",
        name: "Tech Hub Electronics",
        type: "Retail",
        address: "456 MG Road, Bangalore",
        date: "Mar 9, 2026",
        time: "02:00 PM"
    },
    {
        id: "TL-2026-003",
        name: "Fresh Mart Grocery",
        type: "Retail",
        address: "Connaught Place, Delhi",
        date: "Mar 10, 2026",
        time: "11:00 AM"
    }
];

// Render cards
function renderCards(data) {
    const container = document.getElementById("inspectionCards");
    const countText = document.getElementById("countText");

    container.innerHTML = "";
    countText.innerText = `Showing ${data.length} inspection(s)`;

    data.forEach(item => {
        const card = `
            <div class="inspection-card blue">
                <h3>${item.name}</h3>
                <small>${item.id}</small>

                <p class="info">📁 ${item.type}</p>
                <p class="info">📍 ${item.address}</p>
                <p class="info">📅 ${item.date}</p>
                <p class="info">⏰ ${item.time}</p>

                <button class="start-btn">Start Inspection</button>
            </div>
        `;

        container.innerHTML += card;
    });
}

// Search filter
document.getElementById("searchInspection").addEventListener("input", function () {
    const value = this.value.toLowerCase();

    const filtered = inspections.filter(item =>
        item.name.toLowerCase().includes(value)
    );

    renderCards(filtered);
});

// Initial load
renderCards(inspections);