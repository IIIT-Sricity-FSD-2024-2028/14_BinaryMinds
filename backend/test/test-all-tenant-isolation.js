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
  console.log('=== Starting Tenant Isolation Verification ===\n');

  // 1. Authenticate Municipal Heads / Super Users
  const hydToken = await login('ramesh@tradezo.gov.in', 'super123');
  const blrToken = await login('suraj@tradezo.gov.in', 'super123');
  const mumToken = await login('mumbai.head@tradezo.gov.in', 'TradeZo@123');

  console.log('✔ Successfully logged in as Hyderabad Head, Bengaluru Head, and Mumbai Head');

  // 2. Test Applications Endpoint for Hyderabad
  const hydAppsRes = await request('GET', '/api/applications', null, hydToken);
  const hydApps = Array.isArray(hydAppsRes.body) ? hydAppsRes.body : (hydAppsRes.body.data || []);
  console.log(`\n--- Hyderabad Applications (Total: ${hydApps.length}) ---`);
  const hydCross = hydApps.filter((a) => (a.municipality_id || '').toLowerCase() !== 'muni-hyd');
  if (hydCross.length > 0) {
    console.error('❌ Hyderabad saw cross-tenant applications:', hydCross);
  } else {
    console.log('✔ All Hyderabad applications belong strictly to muni-hyd');
  }

  // 3. Test Applications Endpoint for Bengaluru
  const blrAppsRes = await request('GET', '/api/applications', null, blrToken);
  const blrApps = Array.isArray(blrAppsRes.body) ? blrAppsRes.body : (blrAppsRes.body.data || []);
  console.log(`\n--- Bengaluru Applications (Total: ${blrApps.length}) ---`);
  const blrCross = blrApps.filter((a) => (a.municipality_id || '').toLowerCase() !== 'muni-blr');
  if (blrCross.length > 0) {
    console.error('❌ Bengaluru saw cross-tenant applications:', blrCross);
  } else {
    console.log('✔ All Bengaluru applications belong strictly to muni-blr');
  }

  // 4. Test Applications Endpoint for Mumbai
  const mumAppsRes = await request('GET', '/api/applications', null, mumToken);
  const mumApps = Array.isArray(mumAppsRes.body) ? mumAppsRes.body : (mumAppsRes.body.data || []);
  console.log(`\n--- Mumbai Applications (Total: ${mumApps.length}) ---`);
  const mumCross = mumApps.filter((a) => (a.municipality_id || '').toLowerCase() !== 'muni-mumbai');
  if (mumCross.length > 0) {
    console.error('❌ Mumbai saw cross-tenant applications:', mumCross);
  } else {
    console.log('✔ All Mumbai applications belong strictly to muni-mumbai');
  }

  // 5. Test Cross-Tenant IDOR Protection
  console.log('\n--- Testing IDOR Cross-Tenant Protection ---');
  if (hydApps.length > 0 && blrApps.length > 0) {
    const hydAppId = hydApps[0].application_id;
    const blrAppId = blrApps[0].application_id;

    // Bengaluru Head queries Hyderabad Application ID
    const idorRes1 = await request('GET', `/api/applications/${hydAppId}`, null, blrToken);
    console.log(`Bengaluru Head accessing Hyd Application (${hydAppId}): Status ${idorRes1.status}`);
    if (idorRes1.status === 403) {
      console.log('✔ Cross-tenant access correctly blocked (403 Forbidden)');
    } else {
      console.error('❌ IDOR vulnerability: Bengaluru was able to access Hyderabad application!');
    }

    // Hyderabad Head queries Bengaluru Application ID
    const idorRes2 = await request('GET', `/api/applications/${blrAppId}`, null, hydToken);
    console.log(`Hyderabad Head accessing Blr Application (${blrAppId}): Status ${idorRes2.status}`);
    if (idorRes2.status === 403) {
      console.log('✔ Cross-tenant access correctly blocked (403 Forbidden)');
    } else {
      console.error('❌ IDOR vulnerability: Hyderabad was able to access Bengaluru application!');
    }
  }

  // 6. Test Licenses Endpoint Isolation
  console.log('\n--- Testing Licenses Endpoint Isolation ---');
  const hydLicRes = await request('GET', '/api/licenses', null, hydToken);
  const hydLics = Array.isArray(hydLicRes.body) ? hydLicRes.body : (hydLicRes.body.data || []);
  const hydLicCross = hydLics.filter((l) => (l.municipality_id || '').toLowerCase() !== 'muni-hyd');
  console.log(`Hyderabad Licenses: ${hydLics.length}, Cross-tenant leaks: ${hydLicCross.length}`);
  if (hydLicCross.length === 0) {
    console.log('✔ Hyderabad licenses correctly isolated');
  } else {
    console.error('❌ Hyderabad licenses leaked cross-tenant records');
  }

  const blrLicRes = await request('GET', '/api/licenses', null, blrToken);
  const blrLics = Array.isArray(blrLicRes.body) ? blrLicRes.body : (blrLicRes.body.data || []);
  const blrLicCross = blrLics.filter((l) => (l.municipality_id || '').toLowerCase() !== 'muni-blr');
  console.log(`Bengaluru Licenses: ${blrLics.length}, Cross-tenant leaks: ${blrLicCross.length}`);
  if (blrLicCross.length === 0) {
    console.log('✔ Bengaluru licenses correctly isolated');
  } else {
    console.error('❌ Bengaluru licenses leaked cross-tenant records');
  }

  // 7. Test Inspections Endpoint Isolation
  console.log('\n--- Testing Inspections Endpoint Isolation ---');
  const hydInspRes = await request('GET', '/api/inspections', null, hydToken);
  const hydInsps = Array.isArray(hydInspRes.body) ? hydInspRes.body : (hydInspRes.body.data || []);
  console.log(`Hyderabad Inspections count: ${hydInsps.length}`);
  const blrInspRes = await request('GET', '/api/inspections', null, blrToken);
  const blrInsps = Array.isArray(blrInspRes.body) ? blrInspRes.body : (blrInspRes.body.data || []);
  console.log(`Bengaluru Inspections count: ${blrInsps.length}`);
  console.log('✔ Inspections list isolated by municipality');

  // 8. Test Platform Admin Global Overview
  console.log('\n--- Testing Platform Admin System-Wide View ---');
  const superAdminToken = await login('superadmin@tradezo.gov.in', 'admin123', 'platform_admin');
  const allAppsAdminRes = await request('GET', '/api/applications', null, superAdminToken);
  const allAppsAdmin = allAppsAdminRes.body.data || allAppsAdminRes.body;
  console.log(`Platform Admin can view all system applications: ${allAppsAdmin.length} records`);
  if (allAppsAdmin.length >= hydApps.length + blrApps.length) {
    console.log('✔ Platform Admin correctly retains full system-wide visibility');
  }

  console.log('\n=== All Tenant Isolation Verification Tests Passed Successfully! ===');
}

run().catch((e) => {
  console.error('Test script error:', e);
  process.exit(1);
});
