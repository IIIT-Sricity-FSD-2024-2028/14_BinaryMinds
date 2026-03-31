// Toggle edit mode on profile fields
let editMode = false;

function toggleEdit() {
  editMode = !editMode;
  const btn = document.querySelector('.btn-edit');

  if (editMode) {
    btn.innerHTML = '<i class="fa-solid fa-save"></i> Save Profile';
    btn.style.background = '#1a7a3f';
    // Make detail fields editable
    document.querySelectorAll('.detail-grid p, .address-block p').forEach(p => {
      const val = p.textContent;
      p.innerHTML = `<input type="text" value="${val}" style="border:1px solid #ccc;border-radius:4px;padding:4px 8px;font-size:13px;width:100%"/>`;
    });
  } else {
    btn.innerHTML = '<i class="fa-solid fa-pen"></i> Edit Profile';
    btn.style.background = '#1a3a8f';
    // Save values back as text
    document.querySelectorAll('.detail-grid p, .address-block p').forEach(p => {
      const input = p.querySelector('input');
      if (input) p.textContent = input.value;
    });
    alert('Profile updated successfully!');
  }
}

// Nav active link
document.querySelectorAll('nav a').forEach(link => {
  link.addEventListener('click', function () {
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    this.classList.add('active');
  });
});

// Camera icon click - simulate photo upload
document.querySelector('.cam-icon').addEventListener('click', function () {
  alert('Photo upload feature coming soon!');
});