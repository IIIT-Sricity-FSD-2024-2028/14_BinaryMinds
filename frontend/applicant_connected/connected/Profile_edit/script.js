document.addEventListener('DOMContentLoaded', function() {
    var loggedIn = {};
    try { loggedIn = JSON.parse(sessionStorage.getItem('loggedInUser')) || {}; } catch(e) {}
    
    var stored = {};
    try { stored = JSON.parse(localStorage.getItem('applicant_profile_data')) || {}; } catch(e) {}
    if (stored.email && loggedIn.email && stored.email.toLowerCase() !== loggedIn.email.toLowerCase()) {
        stored = {}; 
    }

    var sessionApp = {};
    try { sessionApp = JSON.parse(sessionStorage.getItem('applicationForm') || '{}'); } catch(e) {}

    var apps = [];
    try { apps = JSON.parse(localStorage.getItem('tz_submitted_apps') || '[]'); } catch(e){}
    try { var legacy = JSON.parse(localStorage.getItem('applications') || '[]'); apps = apps.concat(legacy); } catch(e){}
    if (typeof window !== 'undefined' && window.TRADEZO && TRADEZO.applications) {
        apps = apps.concat(TRADEZO.applications);
    }
    var userApp = apps.find(function(a) { 
        var emailMatch = a.email && loggedIn.email && a.email.toLowerCase() === loggedIn.email.toLowerCase();
        var idMatch = a.applicantId && loggedIn.email && a.applicantId.toLowerCase() === loggedIn.email.toLowerCase();
        return emailMatch || idMatch;
    });
    
    var appData = userApp || sessionApp || {};

    var appAddress = appData.shopAddress || appData.address || '';
    if (appAddress) {
        if (appData.city) appAddress += ', ' + appData.city;
        if (appData.state) appAddress += ', ' + appData.state;
        if (appData.pincode) appAddress += ' - ' + appData.pincode;
    }

    var name = stored.name || loggedIn.name || appData.fullName || appData.applicantName || '';
    var email = stored.email || loggedIn.email || appData.email || '';
    var phone = stored.phone || loggedIn.phone || appData.phone || '';
    var address = stored.address || appAddress || '';
    
    var aadhaarRaw = (userApp && userApp.aadhaar) || (sessionApp && sessionApp.aadhaar) || appData.aadhaar;
    var aadhaar = aadhaarRaw ? 'XXXX-XXXX-' + String(aadhaarRaw).slice(-4) : '';
    var gender = (userApp && userApp.gender) || (sessionApp && sessionApp.gender) || appData.gender || '';
  
    document.getElementById('profName').value = name;
    document.getElementById('profEmail').value = email;
    document.getElementById('profPhone').value = phone;
    document.getElementById('profAddress').value = address;
    document.getElementById('profAadhaar').value = aadhaar;
    document.getElementById('profGender').value = gender;
  
    var form = document.getElementById('editProfileForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        var dataToSave = {
            name: document.getElementById('profName').value,
            email: document.getElementById('profEmail').value,
            phone: document.getElementById('profPhone').value,
            address: document.getElementById('profAddress').value
        };
  
        // 1. Update active local profile overwrite
        localStorage.setItem('applicant_profile_data', JSON.stringify(dataToSave));
        
        // 2. Overwrite active session user & saved registry
        if (loggedIn && loggedIn.email) {
            var oldEmail = loggedIn.email;
            
            // Session scope update
            loggedIn.name = dataToSave.name;
            loggedIn.email = dataToSave.email;
            loggedIn.phone = dataToSave.phone;
            sessionStorage.setItem('loggedInUser', JSON.stringify(loggedIn));
            
            // Global registry database update
            var reg = [];
            try { reg = JSON.parse(localStorage.getItem('registeredUsers') || '[]'); } catch(e) {}
            var updated = false;
            for (var i = 0; i < reg.length; i++) {
                if (reg[i].email.toLowerCase() === oldEmail.toLowerCase()) {
                    reg[i].name = dataToSave.name;
                    reg[i].email = dataToSave.email;
                    reg[i].phone = dataToSave.phone;
                    updated = true;
                    break;
                }
            }
            if(updated) {
               localStorage.setItem('registeredUsers', JSON.stringify(reg));
            }
        }
        
        alert('Profile updated successfully!');
        window.location.href = '../Profile/index.html';
    });
});
