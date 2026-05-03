
// Auto-fill name and email from session on page load
window.onload = function() {
  var user = null;
  try { user = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null'); } catch(e){}

  // Prefill from session
  if (user) {
    var f1 = document.getElementById('f1'); if (f1 && !f1.value) f1.value = user.name  || '';
    var f2 = document.getElementById('f2'); if (f2 && !f2.value) f2.value = user.email || '';
  }

  // Restore saved form (Edit button from review page)
  var saved = sessionStorage.getItem('applicationForm');
  if (!saved) return;
  var form = {};
  try { form = JSON.parse(saved); } catch(e){ return; }
  var map = {
    f1: form.fullName,    f2: form.email,       f3: form.phone,
    f4: form.aadhaar,     f5: form.motherName,  f6: form.gender,
    f7: form.fatherName,  f8: form.businessName,f9: form.businessType,
    f10:form.shopAddress, f11:form.city,        f12:form.district,
    f13:form.state,       f14:form.pincode,     f15:form.tradeCategory,
    f16:form.shopArea
  };
  for (var id in map) {
    var el = document.getElementById(id);
    if (el && map[id]) el.value = map[id];
  }
};
function go() {
  var valid = true;

  // Validate required fields (skip f9 select, f16 optional)
  var required = ['f1','f2','f3','f4','f5','f6','f7','f8','f10','f11','f12','f13','f14','f15'];
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

  if (!valid) return;

  // Save ALL form data to sessionStorage so review page can show them
  var formData = {
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
    tradeCategory: document.getElementById('f15') ? document.getElementById('f15').value.trim() : '',
    shopArea:      document.getElementById('f16') ? document.getElementById('f16').value.trim() : ''
  };

  sessionStorage.setItem('applicationForm', JSON.stringify(formData));

  window.location.href = '../upload_document/upload_document.html';
}