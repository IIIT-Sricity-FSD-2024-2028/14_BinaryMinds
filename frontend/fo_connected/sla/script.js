// fo_connected/sla/script.js

document.addEventListener('DOMContentLoaded', function() {
    var data = [];
    
    // 1. Load mock apps
    if (window.TRADEZO && window.TRADEZO.applications) {
        data = data.concat(TRADEZO.applications);
    }
    
    // 2. Load submitted apps
    var submitted = [];
    try { submitted = JSON.parse(localStorage.getItem('tz_submitted_apps') || '[]'); } catch(e){}
    submitted.forEach(function(a) {
        if (!data.some(d => d.id === a.id)) {
            data.push(a);
        }
    });

    // 3. Load localStorage apps (for latest statuses)
    var localApps = [];
    try { localApps = JSON.parse(localStorage.getItem('applications') || '[]'); } catch(e){}
    localApps.forEach(function(a) {
        var existing = data.find(d => d.id === a.id);
        if (existing) {
            Object.assign(existing, a);
        } else {
            data.push(a);
        }
    });

    // We only care about applications that are "pending review" or "scheduled" or "pending inspection" 
    // Usually FO SLA tracking is for pending tasks
    var pendingApps = data.filter(function(a) {
        var s = (a.status || '').toLowerCase();
        return s.includes('pending') || s.includes('scheduled') || s.includes('under verification') || s.includes('under review');
    });

    var overdue = [];
    var critical = [];
    var approaching = [];
    var safe = [];

    var today = new Date();

    pendingApps.forEach(function(app) {
        var submittedDateStr = app.submittedDate || app.createdAt;
        var date = new Date(submittedDateStr || new Date());
        if (isNaN(date.getTime())) date = new Date(); // fallback
        
        var diffTime = today.getTime() - date.getTime();
        var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        app.daysPending = diffDays;
        
        // Define SLA thresholds
        if (diffDays >= 7) overdue.push(app);
        else if (diffDays >= 5) critical.push(app);
        else if (diffDays >= 3) approaching.push(app);
        else safe.push(app);
    });

    // Update stats cards
    var cardsContainer = document.getElementById('slaCards');
    if (cardsContainer) {
        cardsContainer.innerHTML = 
            '<div class="sla-card ' + (overdue.length > 0 ? 'red' : 'green') + '">' +
                '<p>Overdue</p>' +
                '<h2>' + overdue.length + '</h2>' +
            '</div>' +
            '<div class="sla-card ' + (critical.length > 0 ? 'orange' : 'green') + '">' +
                '<p>Critical</p>' +
                '<h2>' + critical.length + '</h2>' +
            '</div>' +
            '<div class="sla-card ' + (approaching.length > 0 ? 'yellow' : 'green') + '">' +
                '<p>Approaching</p>' +
                '<h2>' + approaching.length + '</h2>' +
            '</div>';
    }

    // Update SLA List
    var listContainer = document.getElementById('slaList');
    if (listContainer) {
        var html = '<h3>SLA Status Overview</h3>';
        
        var allSLA = overdue.map(a => Object.assign({}, a, {tag: 'Overdue', color: 'red'}))
            .concat(critical.map(a => Object.assign({}, a, {tag: 'Critical', color: 'orange'})))
            .concat(approaching.map(a => Object.assign({}, a, {tag: 'Approaching', color: 'yellow'})));
            
        // Sort descending by daysPending (highest first)
        allSLA.sort(function(a, b) {
            return b.daysPending - a.daysPending;
        });

        if (allSLA.length === 0) {
            html += '<p style="text-align:center;color:#64748b;padding:20px;font-weight:500;">All pending applications are within safe SLA limits.</p>';
        }

        allSLA.forEach(function(app) {
            var bizName = app.businessName || 'Business Name N/A';
            var appId = app.id || app.appRef || 'N/A';
            html += 
            '<div class="sla-item ' + app.color + '">' +
                '<div>' +
                    '<b>' + appId + '</b><br>' +
                    bizName +
                '</div>' +
                '<span class="tag ' + app.tag.toLowerCase() + '">' + app.tag + ' (' + app.daysPending + ' days)</span>' +
                '<button onclick="viewSlaDetails(\'' + appId + '\')">View →</button>' +
            '</div>';
        });
        
        listContainer.innerHTML = html;
    }
});

// Navigate to detail page
window.viewSlaDetails = function(appId) {
    sessionStorage.setItem('selectedApp', appId);
    window.location.href = '../detail/index.html';
};
