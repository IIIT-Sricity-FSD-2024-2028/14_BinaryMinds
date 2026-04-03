document.addEventListener('DOMContentLoaded', function() {
    var loggedIn = {};
    try { loggedIn = JSON.parse(sessionStorage.getItem('loggedInUser')) || {}; } catch(e) {}
    
    var stored = {};
    try { stored = JSON.parse(localStorage.getItem('applicant_profile_data')) || {}; } catch(e) {}

    var appAddress = '';
    var apps = [];
    try { apps = JSON.parse(localStorage.getItem('applications') || '[]'); } catch(e){}
    var userApp = apps.find(function(a) { 
        return (a.email && a.email.toLowerCase() === (loggedIn.email || '').toLowerCase()) || 
               (a.applicantName && a.applicantName.toLowerCase() === (loggedIn.name || '').toLowerCase());
    });
    
    if (userApp) {
        appAddress = userApp.shopAddress;
        if (userApp.city) appAddress += ', ' + userApp.city;
        if (userApp.state) appAddress += ', ' + userApp.state;
        if (userApp.pincode) appAddress += ' - ' + userApp.pincode;
    }

    var name = stored.name || loggedIn.name || 'Jiya Mugale';
    var email = stored.email || loggedIn.email || 'jiya.mugale@gmail.com';
    var phone = stored.phone || loggedIn.phone || '+91 8483916284';
    var address = stored.address || appAddress || 'Flat 402, Sunshine Plaza, MG Road,\nBangalore, Karnataka, 560001';
    var aadhaar = userApp && userApp.aadhaar ? 'XXXX-XXXX-' + String(userApp.aadhaar).slice(-4) : 'XXXX-XXXX-4582';
    var gender = userApp && userApp.gender ? userApp.gender : 'Female';
  
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
