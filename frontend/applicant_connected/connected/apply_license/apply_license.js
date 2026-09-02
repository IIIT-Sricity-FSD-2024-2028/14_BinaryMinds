
function getCurrentApplicantUser() {
  try { return JSON.parse(sessionStorage.getItem('loggedInUser') || '{}') || {}; } catch(e) { return {}; }
}

// Auto-fill name and email from session on page load
window.onload = function() {
  var user = getCurrentApplicantUser();

  function findRegisteredUser(email) {
    if (!email) return {};
    try {
      var users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      return users.find(function(item) {
        return item.email && item.email.toLowerCase() === email.toLowerCase();
      }) || {};
    } catch(e) {
      return {};
    }
  }

  var localUser = {};
  try { localUser = JSON.parse(localStorage.getItem('user') || '{}') || {}; } catch(e) {}
  var registeredUser = findRegisteredUser((user && user.email) || localUser.email);
  if (user && user.email && !user.phone && registeredUser.phone) {
    user.phone = registeredUser.phone;
    sessionStorage.setItem('loggedInUser', JSON.stringify(user));
  }

  // Prefill from session
  if (user) {
    var f1 = document.getElementById('f1'); if (f1 && !f1.value) f1.value = user.name  || '';
    var f2 = document.getElementById('f2'); if (f2 && !f2.value) f2.value = user.email || '';
    var f3 = document.getElementById('f3'); if (f3 && !f3.value) f3.value = user.phone || registeredUser.phone || localUser.phone || '';
  }

  // Populate and restore municipalities
  function populateMunicipalities() {
    var muniSelect = document.getElementById('f_municipality');
    if (muniSelect && window.TRADEZO && typeof TRADEZO.getMunicipalities === 'function') {
      var munis = TRADEZO.getMunicipalities();
      var currentVal = muniSelect.value;
      muniSelect.innerHTML = '<option value="">Select Municipal Corporation</option>' + munis.map(function(m) {
        return '<option value="' + m.municipality_id + '">' + m.name + '</option>';
      }).join('');
      if (currentVal) muniSelect.value = currentVal;
    }
  }

  populateMunicipalities();

  // Restore saved form (Edit button from review page)
  var saved = sessionStorage.getItem('applicationForm');
  if (!saved) return;
  var form = {};
  try { form = JSON.parse(saved); } catch(e){ return; }
  var formOwner = String(form.ownerEmail || form.email || '').trim().toLowerCase();
  var currentOwner = String((user && user.email) || localUser.email || '').trim().toLowerCase();
  if (!formOwner || !currentOwner || formOwner !== currentOwner) {
    sessionStorage.removeItem('applicationForm');
    sessionStorage.removeItem('uploadedDocs');
    sessionStorage.removeItem('documentsUploaded');
    sessionStorage.removeItem('documentsUploadedCount');
    sessionStorage.removeItem('currentApplication');
    Object.keys(sessionStorage).forEach(function(key) {
      if (key.indexOf('upload_status') === 0 || key.indexOf('upload_error') === 0) {
        sessionStorage.removeItem(key);
      }
    });
    return;
  }
  var map = {
    f1: form.fullName,    f2: form.email,       f3: form.phone,
    f4: form.aadhaar,     f5: form.motherName,  f6: form.gender,
    f7: form.fatherName,  f8: form.businessName,f9: form.businessType,
    f10:form.shopAddress, f11:form.city,        f12:form.district,
    f13:form.state,       f14:form.pincode,
    f16:form.shopArea,
    f_municipality: form.municipalityId
  };
  for (var id in map) {
    var el = document.getElementById(id);
    if (el && map[id]) el.value = map[id];
  }
};
function go() {
  var user = getCurrentApplicantUser();
  var valid = true;

  // Validate required fields
  var required = ['f1','f2','f3','f4','f5','f6','f7','f8','f10','f11','f12','f13','f14'];
  required.forEach(function(id) {
    var el  = document.getElementById(id);
    var err = document.getElementById('e' + id.substring(1));
    var val = el ? el.value.trim() : '';
    if (el && (val === '' || /^0+$/.test(val))) {
      el.classList.add('invalid');
      if (err) {
        err.textContent = /^0+$/.test(val) ? 'Invalid input' : 'Required';
        err.classList.add('show');
      }
      valid = false;
    } else {
      if (el)  el.classList.remove('invalid');
      if (err) err.classList.remove('show');
    }
  });

  // Phone = 10 digits
  if (document.getElementById('f3').value.length !== 10) {
    document.getElementById('e3').classList.add('show'); valid = false;
  }
  // Aadhaar = 12 digits
  if (document.getElementById('f4').value.length !== 12) {
    document.getElementById('e4').classList.add('show'); valid = false;
  }
  // Pincode = 6 digits
  if (document.getElementById('f14').value.length !== 6) {
    document.getElementById('e14').classList.add('show'); valid = false;
  }

  // Shop Area = between 100 and 1500 sq.ft
  var areaEl = document.getElementById('f16');
  var areaErr = document.getElementById('e16');
  var areaVal = areaEl ? parseFloat(areaEl.value) : NaN;
  if (!areaEl || isNaN(areaVal) || areaVal < 100 || areaVal > 1500) {
    if (areaEl) areaEl.classList.add('invalid');
    if (areaErr) {
      areaErr.textContent = 'Enter area between 100 and 1500 sq.ft';
      areaErr.classList.add('show');
    }
    valid = false;
  } else {
    if (areaEl) areaEl.classList.remove('invalid');
    if (areaErr) areaErr.classList.remove('show');
  }

  if (!valid) return;

  var muniEl = document.getElementById('f_municipality');
  var stateEl = document.getElementById('f13');
  var cityEl = document.getElementById('f11');
  var districtEl = document.getElementById('f12');

  var stateVal = stateEl ? stateEl.value.trim().toLowerCase() : '';
  var cityVal = cityEl ? cityEl.value.trim().toLowerCase() : '';
  var districtVal = districtEl ? districtEl.value.trim().toLowerCase() : '';
  var selectedMuniId = '';
  var selectedMuniName = '';

  var munis = (window.TRADEZO && typeof TRADEZO.getMunicipalities === 'function') ? TRADEZO.getMunicipalities() : [];
  var selectedMuni = null;

  if (muniEl && muniEl.value) {
    selectedMuni = munis.find(function(m) { return String(m.municipality_id).toLowerCase() === String(muniEl.value).toLowerCase(); });
  }

  if (!selectedMuni) {
    selectedMuni = munis.find(function(m) {
      var mName = (m.name || '').toLowerCase();
      var mDist = (m.district || '').toLowerCase();
      var mState = (m.state || '').toLowerCase();
      var mId = (m.municipality_id || '').toLowerCase().replace(/^muni-?/i, '');

      return (cityVal && (mName.includes(cityVal) || mDist.includes(cityVal) || cityVal.includes(mDist) || cityVal.includes(mId))) ||
             (districtVal && (mDist.includes(districtVal) || districtVal.includes(mDist))) ||
             (stateVal && mState.includes(stateVal));
    });
  }

  if (selectedMuni) {
    selectedMuniId = selectedMuni.municipality_id;
    selectedMuniName = selectedMuni.name;
  } else if (muniEl && muniEl.value) {
    selectedMuniId = muniEl.value;
    selectedMuniName = (muniEl.options && muniEl.options[muniEl.selectedIndex]) ? muniEl.options[muniEl.selectedIndex].text : muniEl.value;
  }

  // Save ALL form data to sessionStorage so review page can show them
  var formData = {
    municipalityId:   selectedMuniId,
    municipalityName: selectedMuniName,
    fullName:      document.getElementById('f1').value.trim(),
    email:         document.getElementById('f2').value.trim(),
    phone:         document.getElementById('f3').value.trim(),
    aadhaar:       document.getElementById('f4').value.trim(),
    motherName:    document.getElementById('f5').value.trim(),
    gender:        document.getElementById('f6').value,
    fatherName:    document.getElementById('f7').value.trim(),
    businessName:  document.getElementById('f8').value.trim(),
    businessType:  document.getElementById('f9').value,
    shopAddress:   document.getElementById('f10').value.trim(),
    city:          document.getElementById('f11').value.trim(),
    district:      document.getElementById('f12').value.trim(),
    state:         document.getElementById('f13').value.trim(),
    pincode:       document.getElementById('f14').value.trim(),
    tradeCategory: document.getElementById('f9') ? document.getElementById('f9').value : 'Retail Shop',
    shopArea:      document.getElementById('f16') ? document.getElementById('f16').value.trim() : '',
    ownerEmail:    user.email || document.getElementById('f2').value.trim()
  };

  sessionStorage.setItem('applicationForm', JSON.stringify(formData));

  window.location.href = '../upload_document/upload_document.html';
}

window.go = go;

document.addEventListener('DOMContentLoaded', function() {
  var nextBtn = document.getElementById('nextApplicationBtn');
  if (nextBtn) {
    nextBtn.addEventListener('click', go);
  }

  var muniEl = document.getElementById('f_municipality');
  var stateEl = document.getElementById('f13');
  var cityEl = document.getElementById('f11');
  var districtEl = document.getElementById('f12');

  if (muniEl && window.TRADEZO && typeof TRADEZO.getMunicipalities === 'function') {
    var munis = TRADEZO.getMunicipalities();
    if (!muniEl.options || muniEl.options.length <= 1) {
      muniEl.innerHTML = '<option value="">Select Municipal Corporation</option>' + munis.map(function(m) {
        return '<option value="' + m.municipality_id + '">' + m.name + '</option>';
      }).join('');
    }
  }

  function syncMuniFromLocation() {
    var state = (stateEl ? stateEl.value.trim().toLowerCase() : '');
    var city = (cityEl ? cityEl.value.trim().toLowerCase() : '');
    var district = (districtEl ? districtEl.value.trim().toLowerCase() : '');
    var munis = (window.TRADEZO && typeof TRADEZO.getMunicipalities === 'function') ? TRADEZO.getMunicipalities() : [];

    var match = munis.find(function(m) {
      var mName = (m.name || '').toLowerCase();
      var mDist = (m.district || '').toLowerCase();
      var mState = (m.state || '').toLowerCase();
      var mId = (m.municipality_id || '').toLowerCase().replace(/^muni-?/i, '');

      return (city && (mName.includes(city) || mDist.includes(city) || city.includes(mDist) || city.includes(mId))) ||
             (district && (mDist.includes(district) || district.includes(mDist))) ||
             (state && mState.includes(state));
    });

    if (match && muniEl) {
      muniEl.value = match.municipality_id;
    }
  }

  function syncLocationFromMuni() {
    if (!muniEl || !muniEl.value) return;
    var munis = (window.TRADEZO && typeof TRADEZO.getMunicipalities === 'function') ? TRADEZO.getMunicipalities() : [];
    var match = munis.find(function(m) { return String(m.municipality_id).toLowerCase() === String(muniEl.value).toLowerCase(); });
    if (match) {
      var resolvedCity = match.district || match.city || '';
      if (resolvedCity.toLowerCase() === 'bangalore') resolvedCity = 'Bengaluru';
      var resolvedDistrict = match.district || match.city || '';
      if (resolvedDistrict.toLowerCase() === 'bangalore') resolvedDistrict = 'Bengaluru';

      if (stateEl && (!stateEl.value || stateEl.value === 'Telangana' || stateEl.value === 'Karnataka' || stateEl.value === 'Maharashtra')) stateEl.value = match.state || '';
      if (cityEl && (!cityEl.value || cityEl.value === 'Hyderabad' || cityEl.value === 'Bangalore' || cityEl.value === 'Bengaluru' || cityEl.value === 'Mumbai')) cityEl.value = resolvedCity;
      if (districtEl && (!districtEl.value || districtEl.value === 'Hyderabad' || districtEl.value === 'Bangalore' || districtEl.value === 'Bengaluru' || districtEl.value === 'Mumbai')) districtEl.value = resolvedDistrict;
    }
  }

  if (stateEl) stateEl.addEventListener('input', syncMuniFromLocation);
  if (cityEl) cityEl.addEventListener('input', syncMuniFromLocation);
  if (districtEl) districtEl.addEventListener('input', syncMuniFromLocation);
  if (muniEl) muniEl.addEventListener('change', syncLocationFromMuni);
});

