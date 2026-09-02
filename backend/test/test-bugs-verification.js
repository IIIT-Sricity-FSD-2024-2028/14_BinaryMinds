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
  console.log('=== Starting Targeted Bug Verification ===\n');

  // --- BUG 1 TEST: FO ASSIGNMENT & TENANT ENFORCEMENT ---
  console.log('--- Testing Bug 1: Field Officer Assignment ---');
  const hydToken = await login('ramesh@tradezo.gov.in', 'super123', 'super_user');
  const blrToken = await login('suraj@tradezo.gov.in', 'super123', 'super_user');

  // 1. Get Hyderabad applications
  const hydAppsRes = await request('GET', '/api/applications', null, hydToken);
  const hydApps = Array.isArray(hydAppsRes.body) ? hydAppsRes.body : (hydAppsRes.body.data || []);
  if (hydApps.length === 0) {
    throw new Error('No Hyderabad applications found to test assignment');
  }
  const testApp = hydApps[0];
  console.log(`Testing with Hyderabad Application ID: ${testApp.application_id} (${testApp.application_ref})`);

  // 2. Get Users to find Hyderabad FO and Bengaluru FO
  const usersRes = await request('GET', '/api/users', null, hydToken);
  const hydUsers = Array.isArray(usersRes.body) ? usersRes.body : (usersRes.body.data || []);
  const hydFO = hydUsers.find((u) => u.role === 'field_officer');
  console.log(`Found Hyderabad FO: ${hydFO.full_name} (ID: ${hydFO.user_id}, Email: ${hydFO.email})`);

  // 3. Assign Hyderabad FO to Hyderabad Application
  const assignRes = await request('PATCH', `/api/applications/${testApp.application_id}/assign`, {
    officerId: hydFO.user_id,
  }, hydToken);
  console.log(`Assign Hyderabad FO Response Status: ${assignRes.status}`);
  if (assignRes.status === 200 || assignRes.status === 201) {
    console.log(`✔ Assignment succeeded. assignedOfficerId: ${assignRes.body.assignedOfficerId || assignRes.body.data?.assignedOfficerId}`);
  } else {
    throw new Error(`Assignment failed: ${JSON.stringify(assignRes.body)}`);
  }

  // 4. Verify Application details show assigned officer
  const appDetailRes = await request('GET', `/api/applications/${testApp.application_id}`, null, hydToken);
  const appDetail = appDetailRes.body.data || appDetailRes.body;
  if (appDetail.assignedOfficerId === hydFO.user_id) {
    console.log(`✔ Application ${testApp.application_id} correctly retains assignedOfficerId = ${hydFO.user_id}`);
  } else {
    throw new Error(`Application assignedOfficerId mismatch: ${appDetail.assignedOfficerId} vs expected ${hydFO.user_id}`);
  }

  // 5. Test Cross-Tenant assignment rejection: Attempt to assign Bengaluru FO to Hyderabad application
  const blrUsersRes = await request('GET', '/api/users', null, blrToken);
  const blrUsers = Array.isArray(blrUsersRes.body) ? blrUsersRes.body : (blrUsersRes.body.data || []);
  const blrFO = blrUsers.find((u) => u.role === 'field_officer');
  if (blrFO) {
    console.log(`Found Bengaluru FO: ${blrFO.full_name} (ID: ${blrFO.user_id})`);
    const crossAssignRes = await request('PATCH', `/api/applications/${testApp.application_id}/assign`, {
      officerId: blrFO.user_id,
    }, hydToken);
    console.log(`Attempt cross-tenant FO assignment (Hyd App -> Blr FO) Response Status: ${crossAssignRes.status}`);
    if (crossAssignRes.status === 400 || crossAssignRes.status === 403) {
      console.log('✔ Cross-tenant FO assignment correctly rejected by backend!');
    } else {
      throw new Error(`Cross-tenant assignment should have failed but returned: ${crossAssignRes.status}`);
    }
  }

  // --- BUG 2 TEST: MUNICIPALITY AUTOFILL & BENGALURU DISPLAY ---
  console.log('\n--- Testing Bug 2: Bengaluru Location Autofill & Municipalities ---');
  const munisRes = await request('GET', '/api/municipalities', null, null);
  const munis = Array.isArray(munisRes.body) ? munisRes.body : (munisRes.body.data || []);
  const blrMuni = munis.find((m) => m.municipality_id === 'muni-blr');
  console.log(`muni-blr Name: "${blrMuni.name}", District: "${blrMuni.district}", State: "${blrMuni.state}"`);
  if (blrMuni.district === 'Bengaluru' && blrMuni.name.includes('Bengaluru')) {
    console.log('✔ Bengaluru municipality correctly configured with district "Bengaluru"');
  } else {
    throw new Error(`Bengaluru configuration unexpected: ${JSON.stringify(blrMuni)}`);
  }

  console.log('\n=== All Targeted Bug Verifications Passed Successfully! ===');
}

run().catch((e) => {
  console.error('Targeted test error:', e);
  process.exit(1);
});
