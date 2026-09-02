const http = require('http');

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL('http://127.0.0.1:3000' + path);
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }
    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function login(email, password, role = 'super_user') {
  const res = await request('POST', '/api/auth/login', { email, password, role });
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  return res.body.accessToken || res.body.token || (res.body.data && (res.body.data.accessToken || res.body.data.token));
}

async function run() {
  console.log('=== Verifying FO Profile & Application Details Email ===\n');

  // Test 1: Field Officer Profile Authenticated Data
  console.log('--- Test 1: Field Officer Authentication & Profile Data ---');
  const hydFOToken = await login('ravi@tradezo.gov.in', 'TradeZo@123', 'field_officer');
  const blrFOToken = await login('arjun@tradezo.gov.in', 'TradeZo@123', 'field_officer');

  const hydUserRes = await request('GET', '/api/users/2', null, hydFOToken);
  const hydUser = hydUserRes.body.data || hydUserRes.body;
  console.log('Hyderabad FO:', {
    name: hydUser.full_name,
    email: hydUser.email,
    employee_id: hydUser.employee_id,
    municipality_id: hydUser.municipality_id,
  });

  if (hydUser.full_name === 'Ravi' && hydUser.email === 'ravi@tradezo.gov.in' && hydUser.municipality_id === 'muni-hyd') {
    console.log('✔ Hyderabad FO profile data verified correctly.');
  } else {
    throw new Error('Hyderabad FO profile data invalid');
  }

  const blrUserRes = await request('GET', '/api/users/5', null, blrFOToken);
  const blrUser = blrUserRes.body.data || blrUserRes.body;
  console.log('Bengaluru FO:', {
    name: blrUser.full_name,
    email: blrUser.email,
    employee_id: blrUser.employee_id,
    municipality_id: blrUser.municipality_id,
  });

  if (blrUser.full_name === 'Arjun' && blrUser.email === 'arjun@tradezo.gov.in' && blrUser.municipality_id === 'muni-blr') {
    console.log('✔ Bengaluru FO profile data verified correctly.');
  } else {
    throw new Error('Bengaluru FO profile data invalid');
  }

  // Test 2: Application Details Applicant Email
  console.log('\n--- Test 2: Application Details Applicant Email ---');
  const suToken = await login('ramesh@tradezo.gov.in', 'super123', 'super_user');
  const appsRes = await request('GET', '/api/applications', null, suToken);
  const apps = Array.isArray(appsRes.body) ? appsRes.body : (appsRes.body.data || []);
  console.log(`Fetched ${apps.length} Hyderabad applications.`);

  let verifiedCount = 0;
  for (const app of apps) {
    if (app.email || app.applicant_email) {
      verifiedCount++;
      console.log(`✔ App ${app.application_ref} (${app.full_name}) -> Email: ${app.email || app.applicant_email}`);
    }
  }

  if (verifiedCount > 0) {
    console.log(`✔ Verified ${verifiedCount} applications have real applicant email populated dynamically.`);
  } else {
    throw new Error('No applications had email populated');
  }

  console.log('\n=== All Profile and Email Tests Passed Successfully! ===');
}

run().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});
