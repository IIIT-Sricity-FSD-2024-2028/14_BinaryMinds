function go() {
  var valid = true;

  // Check all required fields — id f1 to f14 except f9(select), f15, f16
  var required = ['f1','f2','f3','f4','f5','f6','f7','f8','f10','f11','f12','f13','f14'];
  required.forEach(function(id, i) {
    var el = document.getElementById(id);
    var err = document.getElementById('e' + (i + 1));
    if (el.value.trim() === '') {
      el.classList.add('invalid');
      if (err) err.classList.add('show');
      valid = false;
    } else {
      el.classList.remove('invalid');
      if (err) err.classList.remove('show');
    }
  });

  // Phone = 10 digits, Aadhaar = 12 digits, Pincode = 6 digits
  if (document.getElementById('f3').value.length !== 10) { document.getElementById('e3').classList.add('show'); valid = false; }
  if (document.getElementById('f4').value.length !== 12) { document.getElementById('e4').classList.add('show'); valid = false; }
  if (document.getElementById('f14').value.length !== 6) { document.getElementById('e14').classList.add('show'); valid = false; }

  if (valid) alert('Details saved! Moving to next step.');
}