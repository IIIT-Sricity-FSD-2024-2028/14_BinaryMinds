import { join } from 'node:path';
process.env.TRADEZO_DATA_FILE = join(__dirname, '..', 'data', 'tradezo.test.json');

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { JsonStore } from '../src/common/persistence/json-store';
import { UsersService } from '../src/users/users.service';
import { Role } from '../src/common/enums/role.enum';

describe('Multi-Tenant Isolation Scenarios A-N (e2e)', () => {
  let app: INestApplication;
  let superAdminToken: string;
  let hydHeadToken: string;
  let blrHeadToken: string;
  let hydAppId: number;
  let blrAppId: number;
  let hydFoId: number;
  let blrFoId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Clean up store collections for pristine testing
    const store = app.get(JsonStore);
    const snapshot = store.snapshot();
    snapshot.applications = [];
    snapshot.payments = [];
    snapshot.licenses = [];
    snapshot.platform.revenue_records = [];
    snapshot.municipalities = snapshot.municipalities.filter(
      (m) => m.municipality_id === 'muni-hyd' || m.municipality_id === 'muni-blr'
    );
    snapshot.users.forEach((u) => {
      u.status = 'Active';
    });
    store.save();

    // Login Super Admin
    const superAdminRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'superadmin@tradezo.gov.in', password: 'admin123', role: 'platform_admin' })
      .expect(201);
    superAdminToken = superAdminRes.body.accessToken;

    // Login Hyderabad Municipal Head (Ramesh - muni-hyd)
    const hydHeadRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'ramesh@tradezo.gov.in', password: 'TradeZo@123', role: 'municipal_commissioner' })
      .expect(201);
    hydHeadToken = hydHeadRes.body.accessToken;

    // Login Bangalore Municipal Head (Suraj - muni-blr)
    const blrHeadRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'suraj@tradezo.gov.in', password: 'TradeZo@123', role: 'municipal_commissioner' })
      .expect(201);
    blrHeadToken = blrHeadRes.body.accessToken;
  });

  // -------------------------------------------------------------
  // Scenario A: Bangalore applicant (Karnataka, Bangalore) -> muni-blr
  // -------------------------------------------------------------
  it('Scenario A: Bangalore applicant location resolves strictly to muni-blr', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/applications')
      .set('Authorization', `Bearer ${blrHeadToken}`)
      .send({
        applicantName: 'Bangalore Applicant',
        businessName: 'MG Road Cafe',
        tradeCategory: 'Restaurant',
        shopAddress: '100 MG Road',
        city: 'Bangalore',
        state: 'Karnataka',
        district: 'Bengaluru',
        pincode: '560001',
        phone: '9876500020',
      })
      .expect(201);

    expect(res.body.data.municipality_id).toBe('muni-blr');
    blrAppId = res.body.data.application_id;
  });

  // -------------------------------------------------------------
  // Scenario B: Hyderabad applicant (Telangana, Hyderabad) -> muni-hyd
  // -------------------------------------------------------------
  it('Scenario B: Hyderabad applicant location resolves strictly to muni-hyd', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/applications')
      .set('Authorization', `Bearer ${hydHeadToken}`)
      .send({
        applicantName: 'Hyderabad Applicant',
        businessName: 'Charminar Stores',
        tradeCategory: 'Retail',
        shopAddress: 'Charminar Road',
        city: 'Hyderabad',
        state: 'Telangana',
        district: 'Hyderabad',
        pincode: '500002',
        phone: '9876500010',
      })
      .expect(201);

    expect(res.body.data.municipality_id).toBe('muni-hyd');
    hydAppId = res.body.data.application_id;
  });

  // -------------------------------------------------------------
  // Scenario C: Bangalore SUPER_USER sees only muni-blr applications
  // -------------------------------------------------------------
  it('Scenario C: Bangalore SUPER_USER sees only muni-blr applications and users', async () => {
    const appRes = await request(app.getHttpServer())
      .get('/api/applications')
      .set('Authorization', `Bearer ${blrHeadToken}`)
      .expect(200);

    const apps = appRes.body.data;
    expect(apps.every((a: any) => a.municipality_id === 'muni-blr')).toBe(true);
    expect(apps.some((a: any) => a.application_id === blrAppId)).toBe(true);
    expect(apps.some((a: any) => a.application_id === hydAppId)).toBe(false);

    const userRes = await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${blrHeadToken}`)
      .expect(200);

    const users = userRes.body;
    expect(users.every((u: any) => u.municipality_id === 'muni-blr')).toBe(true);
  });

  // -------------------------------------------------------------
  // Scenario D: Hyderabad SUPER_USER sees only muni-hyd applications
  // -------------------------------------------------------------
  it('Scenario D: Hyderabad SUPER_USER sees only muni-hyd applications and users', async () => {
    const appRes = await request(app.getHttpServer())
      .get('/api/applications')
      .set('Authorization', `Bearer ${hydHeadToken}`)
      .expect(200);

    const apps = appRes.body.data;
    expect(apps.every((a: any) => a.municipality_id === 'muni-hyd')).toBe(true);
    expect(apps.some((a: any) => a.application_id === hydAppId)).toBe(true);
    expect(apps.some((a: any) => a.application_id === blrAppId)).toBe(false);

    const userRes = await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${hydHeadToken}`)
      .expect(200);

    const users = userRes.body;
    expect(users.every((u: any) => u.municipality_id === 'muni-hyd')).toBe(true);
  });

  // -------------------------------------------------------------
  // Scenario E: Bangalore SUPER_USER cannot access Hyderabad application (403)
  // -------------------------------------------------------------
  it('Scenario E: Bangalore SUPER_USER cannot access Hyderabad application', async () => {
    await request(app.getHttpServer())
      .get(`/api/applications/${hydAppId}`)
      .set('Authorization', `Bearer ${blrHeadToken}`)
      .expect(403);
  });

  // -------------------------------------------------------------
  // Scenario F: Hyderabad SUPER_USER cannot access Bangalore application (403)
  // -------------------------------------------------------------
  it('Scenario F: Hyderabad SUPER_USER cannot access Bangalore application', async () => {
    await request(app.getHttpServer())
      .get(`/api/applications/${blrAppId}`)
      .set('Authorization', `Bearer ${hydHeadToken}`)
      .expect(403);
  });

  // -------------------------------------------------------------
  // Scenario G: Bangalore SUPER_USER creates FO -> FO gets muni-blr
  // -------------------------------------------------------------
  it('Scenario G: Bangalore SUPER_USER creates FO and FO automatically gets muni-blr', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${blrHeadToken}`)
      .send({
        full_name: 'Bangalore Field Officer 2',
        email: 'fo.blr.2@tradezo.gov.in',
        phone: '9876540001',
        role: 'field_officer',
        password_hash: 'TradeZo@123',
      })
      .expect(201);

    expect(res.body.municipality_id).toBe('muni-blr');
    blrFoId = res.body.user_id;
  });

  // -------------------------------------------------------------
  // Scenario H: Hyderabad SUPER_USER creates FO -> FO gets muni-hyd
  // -------------------------------------------------------------
  it('Scenario H: Hyderabad SUPER_USER creates FO and FO automatically gets muni-hyd', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${hydHeadToken}`)
      .send({
        full_name: 'Hyderabad Field Officer 2',
        email: 'fo.hyd.2@tradezo.gov.in',
        phone: '9876540002',
        role: 'field_officer',
        password_hash: 'TradeZo@123',
      })
      .expect(201);

    expect(res.body.municipality_id).toBe('muni-hyd');
    hydFoId = res.body.user_id;
  });

  // -------------------------------------------------------------
  // Scenario I: Bangalore SUPER_USER cannot create/assign a Hyderabad officer
  // -------------------------------------------------------------
  it('Scenario I: Bangalore SUPER_USER cannot create a user with muni-hyd', async () => {
    await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${blrHeadToken}`)
      .send({
        full_name: 'Illegal Cross Tenant FO',
        email: 'illegal.fo@tradezo.gov.in',
        phone: '9876540003',
        role: 'field_officer',
        password_hash: 'TradeZo@123',
        municipality_id: 'muni-hyd',
      })
      .expect(403);
  });

  // -------------------------------------------------------------
  // Scenario J: Bangalore application cannot be assigned to Hyderabad FO
  // -------------------------------------------------------------
  it('Scenario J: Bangalore application cannot be assigned to Hyderabad FO', async () => {
    await request(app.getHttpServer())
      .patch(`/api/applications/${blrAppId}/assign`)
      .set('Authorization', `Bearer ${blrHeadToken}`)
      .send({ officerId: hydFoId })
      .expect(400);
  });

  // -------------------------------------------------------------
  // Scenario K: Hyderabad application cannot be assigned to Bangalore FO
  // -------------------------------------------------------------
  it('Scenario K: Hyderabad application cannot be assigned to Bangalore FO', async () => {
    await request(app.getHttpServer())
      .patch(`/api/applications/${hydAppId}/assign`)
      .set('Authorization', `Bearer ${hydHeadToken}`)
      .send({ officerId: blrFoId })
      .expect(400);
  });

  // -------------------------------------------------------------
  // Scenario L & M: Bangalore & Hyderabad payment and revenue attribution
  // -------------------------------------------------------------
  it('Scenario L & M: Payments and revenues are strictly attributed by municipality', async () => {
    // 1. Pay for Bangalore application
    const blrPayRes = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${blrHeadToken}`)
      .send({
        application_id: blrAppId,
        amount: 1510,
        payment_status: 'COMPLETED',
      })
      .expect(201);

    expect(blrPayRes.body.municipality_id).toBe('muni-blr');

    // 2. Pay for Hyderabad application
    const hydPayRes = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${hydHeadToken}`)
      .send({
        application_id: hydAppId,
        amount: 2500,
        payment_status: 'COMPLETED',
      })
      .expect(201);

    expect(hydPayRes.body.municipality_id).toBe('muni-hyd');

    // 3. Check Bangalore Municipal Head payments query
    const blrPayments = await request(app.getHttpServer())
      .get('/api/payments')
      .set('Authorization', `Bearer ${blrHeadToken}`)
      .expect(200);

    expect(blrPayments.body.every((p: any) => p.municipality_id === 'muni-blr')).toBe(true);

    // 4. Check Hyderabad Municipal Head payments query
    const hydPayments = await request(app.getHttpServer())
      .get('/api/payments')
      .set('Authorization', `Bearer ${hydHeadToken}`)
      .expect(200);

    expect(hydPayments.body.every((p: any) => p.municipality_id === 'muni-hyd')).toBe(true);
  });

  // -------------------------------------------------------------
  // Scenario N: SUPER_ADMIN can see aggregated data across all municipalities
  // -------------------------------------------------------------
  it('Scenario N: SUPER_ADMIN can see aggregated data across all municipalities', async () => {
    const revenueRes = await request(app.getHttpServer())
      .get('/api/platform-admin/revenue')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    expect(revenueRes.body.total_municipal_corporations).toBe(2);
    expect(revenueRes.body.total_applications).toBe(2);
    expect(revenueRes.body.completed_transactions).toBe(2);
    expect(revenueRes.body.total_gross_collection).toBe(3020); // 2 apps * 1510 = 3020
    expect(revenueRes.body.total_tradezo_revenue).toBe(500); // 2 apps * 250 = 500
    expect(revenueRes.body.total_municipal_share).toBe(2520); // 2 apps * 1260 = 2520

    const corps = revenueRes.body.corporations;
    const hydCorp = corps.find((c: any) => c.municipality_id === 'muni-hyd');
    const blrCorp = corps.find((c: any) => c.municipality_id === 'muni-blr');

    expect(hydCorp.applications).toBe(1);
    expect(hydCorp.gross_collection).toBe(1510);
    expect(hydCorp.tradezo_revenue).toBe(250);
    expect(hydCorp.municipal_share).toBe(1260);

    expect(blrCorp.applications).toBe(1);
    expect(blrCorp.gross_collection).toBe(1510);
    expect(blrCorp.tradezo_revenue).toBe(250);
    expect(blrCorp.municipal_share).toBe(1260);
  });

  // -------------------------------------------------------------
  // FIELD OFFICER CREATION AND LOGIN VALIDATION (Requirements A - J)
  // -------------------------------------------------------------
  describe('Field Officer Creation and Login End-to-End Flow', () => {
    const hydFoEmail = 'fo.hyd.flow@tradezo.gov.in';
    const blrFoEmail = 'fo.blr.flow@tradezo.gov.in';
    const foPassword = 'CustomPassword@123';

    it('A, B, C: Hyderabad SUPER_USER creates FO -> persisted with FIELD_OFFICER + muni-hyd, authenticates, session gets muni-hyd', async () => {
      // 1. Create Hyderabad FO
      const createRes = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .send({
          full_name: 'Hyderabad Flow Officer',
          email: hydFoEmail,
          phone: '9876543201',
          employee_id: 'FO-HYD-FLOW-01',
          password: foPassword,
          role: 'field_officer',
        })
        .expect(201);

      expect(createRes.body.user_id).toBeDefined();
      expect(createRes.body.role).toBe('field_officer');
      expect(createRes.body.municipality_id).toBe('muni-hyd');

      // 2. Authenticate using those exact credentials
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: hydFoEmail,
          password: foPassword,
          role: 'field_officer',
        })
        .expect(201);

      expect(loginRes.body.accessToken).toBeDefined();
      expect(loginRes.body.user.role).toBe('field_officer');
      expect(loginRes.body.user.municipality_id).toBe('muni-hyd');
      expect(loginRes.body.user.email).toBe(hydFoEmail);

      // Verify token access to FO endpoints
      const foProfileRes = await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .expect(200);

      expect(foProfileRes.body.municipality_id).toBe('muni-hyd');
    });

    it('D, E, F: Bangalore SUPER_USER creates FO -> persisted with FIELD_OFFICER + muni-blr, authenticates, session gets muni-blr', async () => {
      // 1. Create Bangalore FO
      const createRes = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .send({
          full_name: 'Bangalore Flow Officer',
          email: blrFoEmail,
          phone: '9876543202',
          employee_id: 'FO-BLR-FLOW-01',
          password_hash: foPassword,
          role: 'field_officer',
        })
        .expect(201);

      expect(createRes.body.user_id).toBeDefined();
      expect(createRes.body.role).toBe('field_officer');
      expect(createRes.body.municipality_id).toBe('muni-blr');

      // 2. Authenticate using those exact credentials
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: blrFoEmail,
          password: foPassword,
          role: 'field_officer',
        })
        .expect(201);

      expect(loginRes.body.accessToken).toBeDefined();
      expect(loginRes.body.user.role).toBe('field_officer');
      expect(loginRes.body.user.municipality_id).toBe('muni-blr');
      expect(loginRes.body.user.email).toBe(blrFoEmail);
    });

    it('G: Cross-tenant officer creation by Municipal Head is rejected (403)', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .send({
          full_name: 'Illegal Cross FO',
          email: 'illegal.cross@tradezo.gov.in',
          phone: '9876543299',
          employee_id: 'FO-CROSS-01',
          password: foPassword,
          role: 'field_officer',
          municipality_id: 'muni-blr',
        })
        .expect(403);
    });

    it('H: Invalid password is rejected (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: hydFoEmail,
          password: 'WrongPassword@999',
          role: 'field_officer',
        })
        .expect(401);
    });

    it('I: Wrong role is rejected (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: hydFoEmail,
          password: foPassword,
          role: 'department_officer',
        })
        .expect(401);
    });

    it('J: Field Officer management listing and authentication resolve the same persistent user', async () => {
      // Query users as Hyderabad Municipal Head
      const usersRes = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .expect(200);

      const hydUsers = usersRes.body;
      const createdInListing = hydUsers.find((u: any) => u.email === hydFoEmail);
      expect(createdInListing).toBeDefined();
      expect(createdInListing.role).toBe('field_officer');
      expect(createdInListing.municipality_id).toBe('muni-hyd');

      // Bangalore Municipal Head should NOT see Hyderabad FO
      const blrUsersRes = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .expect(200);

      expect(blrUsersRes.body.some((u: any) => u.email === hydFoEmail)).toBe(false);
      expect(blrUsersRes.body.some((u: any) => u.email === blrFoEmail)).toBe(true);
    });
  });

  describe('Saif Hyderabad Applicant Visibility & Tenant Scoping', () => {
    let saifToken: string;
    let saifAppId: number;
    const saifEmail = `saif.${Date.now()}@gmail.com`;
    const saifPhone = `98${String(Date.now()).slice(-8)}`;

    it('creates/registers Hyderabad applicant Saif', async () => {
      const regRes = await request(app.getHttpServer())
        .post('/api/users/register')
        .send({
          full_name: 'Saif',
          email: saifEmail,
          phone: saifPhone,
          password: 'Password@123',
        })
        .expect(201);

      expect(regRes.body.user_id).toBeDefined();
      expect(regRes.body.role).toBe('applicant');

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: saifEmail,
          password: 'Password@123',
          role: 'applicant',
        })
        .expect(201);

      saifToken = loginRes.body.accessToken;
      expect(saifToken).toBeDefined();
    });

    it('submits a Hyderabad application for Saif', async () => {
      const appRes = await request(app.getHttpServer())
        .post('/api/applications')
        .set('Authorization', `Bearer ${saifToken}`)
        .send({
          applicantName: 'Saif',
          businessName: 'Saif Enterprises',
          businessType: 'Retail Shop',
          tradeCategory: 'Retail Shop',
          shopAddress: 'Road No 12, Banjara Hills',
          city: 'Hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
          pincode: '500034',
          phone: saifPhone,
          municipality_id: 'muni-hyd',
        })
        .expect(201);

      expect(appRes.body.success).toBe(true);
      expect(appRes.body.data.municipality_id).toBe('muni-hyd');
      saifAppId = appRes.body.data.application_id;
      expect(saifAppId).toBeDefined();
    });

    it('Hyderabad SUPER_USER sees Saif application in application list', async () => {
      const hydAppsRes = await request(app.getHttpServer())
        .get('/api/applications')
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .expect(200);

      const apps = hydAppsRes.body.data;
      const saifApp = apps.find((a: any) => a.application_id === saifAppId || a.full_name === 'Saif');
      expect(saifApp).toBeDefined();
      expect(saifApp.municipality_id).toBe('muni-hyd');
      expect(saifApp.city.toLowerCase()).toBe('hyderabad');
      expect(saifApp.state.toLowerCase()).toBe('telangana');
    });

    it('Bangalore SUPER_USER cannot see Saif Hyderabad application', async () => {
      const blrAppsRes = await request(app.getHttpServer())
        .get('/api/applications')
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .expect(200);

      const apps = blrAppsRes.body.data;
      const saifApp = apps.find((a: any) => a.application_id === saifAppId || a.full_name === 'Saif');
      expect(saifApp).toBeUndefined();
    });
  });

  describe('Applicant Location to Municipality Routing & Super User Visibility (Tests 1 - 10)', () => {
    let appuToken: string;
    let appuAppId: number;
    let hydApplicantToken: string;
    let hydApplicantAppId: number;

    it('Test 1 — Hyderabad routing: Telangana + Hyderabad -> muni-hyd, visible to Hyd SUPER_USER and not Blr', async () => {
      const email = `applicant.hyd.${Date.now()}@gmail.com`;
      const phone = `97${String(Date.now()).slice(-8)}`;

      const regRes = await request(app.getHttpServer())
        .post('/api/users/register')
        .send({ full_name: 'Hyd Citizen', email, phone, password: 'Password@123' })
        .expect(201);

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'Password@123', role: 'applicant' })
        .expect(201);

      hydApplicantToken = loginRes.body.accessToken;

      const appRes = await request(app.getHttpServer())
        .post('/api/applications')
        .set('Authorization', `Bearer ${hydApplicantToken}`)
        .send({
          applicantName: 'Hyd Citizen',
          businessName: 'Charminar Traders',
          businessType: 'Retail Shop',
          shopAddress: 'Near Charminar',
          city: 'Hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
          pincode: '500002',
          phone,
        })
        .expect(201);

      expect(appRes.body.data.municipality_id).toBe('muni-hyd');
      hydApplicantAppId = appRes.body.data.application_id;

      // Hyderabad SUPER_USER sees application
      const hydApps = await request(app.getHttpServer())
        .get('/api/applications')
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .expect(200);
      expect(hydApps.body.data.some((a: any) => a.application_id === hydApplicantAppId)).toBe(true);

      // Bangalore SUPER_USER does NOT see application
      const blrApps = await request(app.getHttpServer())
        .get('/api/applications')
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .expect(200);
      expect(blrApps.body.data.some((a: any) => a.application_id === hydApplicantAppId)).toBe(false);
    });

    it('Test 2 — Bangalore routing: Karnataka + Bangalore -> muni-blr, visible to Blr SUPER_USER and not Hyd', async () => {
      const email = `appu.${Date.now()}@gmail.com`;
      const phone = `98${String(Date.now()).slice(-8)}`;

      const regRes = await request(app.getHttpServer())
        .post('/api/users/register')
        .send({ full_name: 'Appu', email, phone, password: 'Password@123' })
        .expect(201);

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'Password@123', role: 'applicant' })
        .expect(201);

      appuToken = loginRes.body.accessToken;

      const appRes = await request(app.getHttpServer())
        .post('/api/applications')
        .set('Authorization', `Bearer ${appuToken}`)
        .send({
          applicantName: 'Appu',
          businessName: 'Appu Enterprises',
          businessType: 'Retail Shop',
          shopAddress: '100 Feet Rd, Indiranagar',
          city: 'Bangalore',
          district: 'Bangalore',
          state: 'Karnataka',
          pincode: '560038',
          phone,
        })
        .expect(201);

      expect(appRes.body.data.municipality_id).toBe('muni-blr');
      appuAppId = appRes.body.data.application_id;

      // Bangalore SUPER_USER sees Appu
      const blrApps = await request(app.getHttpServer())
        .get('/api/applications')
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .expect(200);
      expect(blrApps.body.data.some((a: any) => a.application_id === appuAppId)).toBe(true);

      // Hyderabad SUPER_USER does NOT see Appu
      const hydApps = await request(app.getHttpServer())
        .get('/api/applications')
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .expect(200);
      expect(hydApps.body.data.some((a: any) => a.application_id === appuAppId)).toBe(false);
    });

    it('Test 3 — Bengaluru spelling: Karnataka + Bengaluru -> muni-blr', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/applications')
        .set('Authorization', `Bearer ${appuToken}`)
        .send({
          applicantName: 'Appu',
          businessName: 'Appu Branch 2',
          city: 'Bengaluru',
          district: 'Bengaluru Urban',
          state: 'Karnataka',
          pincode: '560001',
        })
        .expect(201);

      expect(res.body.data.municipality_id).toBe('muni-blr');
    });

    it('Test 4 — Conflicting municipality: Karnataka + Bangalore with muni-hyd -> 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/applications')
        .set('Authorization', `Bearer ${appuToken}`)
        .send({
          applicantName: 'Appu Conflict',
          businessName: 'Appu Bad Store',
          city: 'Bangalore',
          state: 'Karnataka',
          municipality_id: 'muni-hyd',
        })
        .expect(400);

      expect(res.body.message).toContain('conflicts with application location');
    });

    it('Test 5 — Unsupported location: Unsupported state/city -> 400 Bad Request (No static fallback to Hyderabad)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/applications')
        .set('Authorization', `Bearer ${appuToken}`)
        .send({
          applicantName: 'Appu Other',
          businessName: 'Mumbai Store',
          city: 'Mumbai',
          state: 'Maharashtra',
        })
        .expect(400);

      expect(res.body.message).toContain('No active municipal corporation found');
    });

    it('Test 6 — Tenant isolation: Cross-municipality GET /api/applications/:id is rejected with 403', async () => {
      // Hyderabad SUPER_USER cannot view Bangalore Appu application
      await request(app.getHttpServer())
        .get(`/api/applications/${appuAppId}`)
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .expect(403);

      // Bangalore SUPER_USER cannot view Hyderabad application
      await request(app.getHttpServer())
        .get(`/api/applications/${hydApplicantAppId}`)
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .expect(403);
    });

    it('Test 7 & 8: Existing FO and DO workflows continue to operate under tenant segregation', async () => {
      // FO listing for Hyd
      const hydFos = await request(app.getHttpServer())
        .get('/api/officers')
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .expect(200);
      const hydList = hydFos.body.data;
      expect(Array.isArray(hydList)).toBe(true);
      expect(hydList.every((fo: any) => fo.municipality_id === 'muni-hyd')).toBe(true);

      // DO lookup for Blr
      const blrDo = await request(app.getHttpServer())
        .get('/api/users/department-officer')
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .expect(200);
      expect(blrDo.body.success).toBe(true);
    });

    it('Test 9 — Application workflow: Application assignable to officer in same municipality, rejected for other municipality', async () => {
      // Find Bangalore FO (Arjun / user_id: 5)
      const blrFos = await request(app.getHttpServer())
        .get('/api/officers')
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .expect(200);
      const blrFoList = blrFos.body.data;
      expect(Array.isArray(blrFoList) && blrFoList.length > 0).toBe(true);
      const blrFoId = blrFoList[0].user_id || blrFoList[0].id;

      // Assign Appu's application to Bangalore FO -> Success
      const assignRes = await request(app.getHttpServer())
        .patch(`/api/applications/${appuAppId}/assign`)
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .send({ officerId: blrFoId })
        .expect(200);
      expect(assignRes.body.data.assignedOfficerId).toBe(blrFoId);

      // Attempt assigning Appu's Bangalore application to Hyderabad FO -> 400 Bad Request
      const hydFos = await request(app.getHttpServer())
        .get('/api/officers')
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .expect(200);
      const hydFoList = hydFos.body.data;
      expect(Array.isArray(hydFoList) && hydFoList.length > 0).toBe(true);
      const hydFoId = hydFoList[0].user_id || hydFoList[0].id;

      await request(app.getHttpServer())
        .patch(`/api/applications/${appuAppId}/assign`)
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .send({ officerId: hydFoId })
        .expect(400);
    });

    it('Test 10 — Newly created municipality routes automatically without code changes', async () => {
      const muniId = `muni-chennai-${Date.now()}`;
      await request(app.getHttpServer())
        .post('/api/municipalities')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          municipality_id: muniId,
          name: 'Greater Chennai Corporation',
          state: 'Tamil Nadu',
          district: 'Chennai',
          head_name: 'Chennai Commissioner',
          head_email: `chennai.head.${Date.now()}@tradezo.gov.in`,
          head_phone: `99${String(Date.now()).slice(-8)}`,
        })
        .expect(201);

      // Submit application with Tamil Nadu + Chennai
      const res = await request(app.getHttpServer())
        .post('/api/applications')
        .set('Authorization', `Bearer ${appuToken}`)
        .send({
          applicantName: 'Appu Chennai Store',
          businessName: 'Marina Goods',
          city: 'Chennai',
          district: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600001',
        })
        .expect(201);

      expect(res.body.data.municipality_id).toBe(muniId);
      expect(res.body.data.municipalityName).toBe('Greater Chennai Corporation');
    });
  });

  describe('Automatic Field Officer Employee ID Generation (Tests 1 - 14)', () => {
    let blrFo1EmpId: string;
    let blrFo2EmpId: string;
    let hydFo1EmpId: string;
    let hydFo2EmpId: string;
    const testFoPass = 'TradeZo@123';

    it('Test 1: First Bengaluru FO receives FO-BLR-001 from pristine state', async () => {
      // Clean test FOs for BLR to test sequence strictly from 001
      const store = app.get(JsonStore);
      const snapshot = store.snapshot();
      snapshot.users = snapshot.users.filter(
        (u) => !(u.employee_id && u.employee_id.startsWith('FO-BLR-')),
      );
      store.save();

      const res = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .send({
          full_name: 'Bengaluru Officer One',
          email: `fo.blr.seq.test1.${Date.now()}@tradezo.gov.in`,
          phone: `91${String(Date.now()).slice(-8)}`,
          password: testFoPass,
          role: 'field_officer',
        })
        .expect(201);

      expect(res.body.employee_id).toBe('FO-BLR-001');
      blrFo1EmpId = res.body.employee_id;
    });

    it('Test 2: Second Bengaluru FO receives FO-BLR-002', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .send({
          full_name: 'Bengaluru Officer Two',
          email: `fo.blr.seq.test2.${Date.now()}@tradezo.gov.in`,
          phone: `92${String(Date.now()).slice(-8)}`,
          password: testFoPass,
          role: 'field_officer',
        })
        .expect(201);

      expect(res.body.employee_id).toBe('FO-BLR-002');
      blrFo2EmpId = res.body.employee_id;
    });

    it('Test 3: First Hyderabad FO receives FO-HYD-001 independently', async () => {
      // Clean test FOs for HYD to test sequence strictly from 001
      const store = app.get(JsonStore);
      const snapshot = store.snapshot();
      snapshot.users = snapshot.users.filter(
        (u) => !(u.employee_id && u.employee_id.startsWith('FO-HYD-')),
      );
      store.save();

      const res = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .send({
          full_name: 'Hyderabad Officer One',
          email: `fo.hyd.seq.test1.${Date.now()}@tradezo.gov.in`,
          phone: `93${String(Date.now()).slice(-8)}`,
          password: testFoPass,
          role: 'field_officer',
        })
        .expect(201);

      expect(res.body.employee_id).toBe('FO-HYD-001');
      hydFo1EmpId = res.body.employee_id;
    });

    it('Test 4: Second Hyderabad FO receives FO-HYD-002', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .send({
          full_name: 'Hyderabad Officer Two',
          email: `fo.hyd.seq.test2.${Date.now()}@tradezo.gov.in`,
          phone: `94${String(Date.now()).slice(-8)}`,
          password: testFoPass,
          role: 'field_officer',
        })
        .expect(201);

      expect(res.body.employee_id).toBe('FO-HYD-002');
      hydFo2EmpId = res.body.employee_id;
    });

    it('Test 5: Bengaluru sequence continues independently regardless of Hyderabad officer count', async () => {
      // Create FO-BLR-003
      const res = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .send({
          full_name: 'Bengaluru Officer Three',
          email: `fo.blr.seq.test3.${Date.now()}@tradezo.gov.in`,
          phone: `95${String(Date.now()).slice(-8)}`,
          password: testFoPass,
          role: 'field_officer',
        })
        .expect(201);

      expect(res.body.employee_id).toBe('FO-BLR-003');

      // Create 5 Hyderabad officers (003 -> 007)
      for (let i = 3; i <= 7; i++) {
        const hRes = await request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${hydHeadToken}`)
          .send({
            full_name: `Hyd Bulk Officer ${i}`,
            email: `fo.hyd.bulk.${i}.${Date.now()}@tradezo.gov.in`,
            phone: `71${String(Date.now() + i).slice(-8)}`,
            password: testFoPass,
            role: 'field_officer',
          })
          .expect(201);
        expect(hRes.body.employee_id).toBe(`FO-HYD-00${i}`);
      }

      // Next Bengaluru officer must be FO-BLR-004, NOT affected by Hyderabad reaching 7
      const nextBlrRes = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .send({
          full_name: 'Bengaluru Officer Four',
          email: `fo.blr.seq.test4.${Date.now()}@tradezo.gov.in`,
          phone: `96${String(Date.now()).slice(-8)}`,
          password: testFoPass,
          role: 'field_officer',
        })
        .expect(201);

      expect(nextBlrRes.body.employee_id).toBe('FO-BLR-004');
    });

    it('Test 6: Server persistence does not reset sequence counter', async () => {
      // Sequence check from store snapshot
      const usersService = app.get(UsersService);
      const nextEmpId = usersService.generateNextEmployeeId(Role.FIELD_OFFICER, 'muni-blr');
      expect(nextEmpId).toMatch(/^FO-BLR-\d{3}$/);
    });

    it('Test 7: Deactivated FO does not cause Employee ID reuse', async () => {
      const store = app.get(JsonStore);
      const snapshot = store.snapshot();
      // Deactivate officer two
      const fo2 = snapshot.users.find((u) => u.employee_id === blrFo2EmpId);
      if (fo2) fo2.status = 'Inactive';
      store.save();

      const usersService = app.get(UsersService);
      const nextId = usersService.generateNextEmployeeId(Role.FIELD_OFFICER, 'muni-blr');
      const nextNum = parseInt(nextId.split('-')[2], 10);
      const maxExistingNum = Math.max(
        ...snapshot.users
          .filter((u) => (u.employee_id || '').startsWith('FO-BLR-'))
          .map((u) => parseInt(u.employee_id!.split('-')[2], 10)),
      );
      expect(nextNum).toBeGreaterThan(maxExistingNum);
    });

    it('Test 8: Two close/concurrent creation requests receive distinct sequential unique IDs', async () => {
      const p1 = request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .send({
          full_name: 'Concurrent FO A',
          email: `fo.blr.concurrentA.${Date.now()}@tradezo.gov.in`,
          phone: `81${String(Date.now()).slice(-8)}`,
          password: testFoPass,
          role: 'field_officer',
        });

      const p2 = request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .send({
          full_name: 'Concurrent FO B',
          email: `fo.blr.concurrentB.${Date.now() + 1}@tradezo.gov.in`,
          phone: `82${String(Date.now() + 1).slice(-8)}`,
          password: testFoPass,
          role: 'field_officer',
        });

      const [res1, res2] = await Promise.all([p1, p2]);
      expect(res1.body.employee_id).toBeDefined();
      expect(res2.body.employee_id).toBeDefined();
      expect(res1.body.employee_id).not.toBe(res2.body.employee_id);
    });

    it('Test 9: SUPER_USER cannot provide custom employee_id to bypass backend generation', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .send({
          full_name: 'Bypass Attempt Officer',
          email: `fo.blr.bypass.${Date.now()}@tradezo.gov.in`,
          phone: `83${String(Date.now()).slice(-8)}`,
          password: testFoPass,
          role: 'field_officer',
          employee_id: 'CUSTOM-FO-999',
        })
        .expect(201);

      expect(res.body.employee_id).toMatch(/^FO-BLR-\d{3}$/);
      expect(res.body.employee_id).not.toBe('CUSTOM-FO-999');
    });

    it('Test 10 & 11: Hyderabad SUPER_USER gets FO-HYD prefix, Bangalore gets FO-BLR prefix', async () => {
      const hydRes = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .send({
          full_name: 'Hyd Prefix Test',
          email: `fo.hyd.prefix.${Date.now()}@tradezo.gov.in`,
          phone: `84${String(Date.now()).slice(-8)}`,
          password: testFoPass,
          role: 'field_officer',
        })
        .expect(201);
      expect(hydRes.body.employee_id.startsWith('FO-HYD-')).toBe(true);

      const blrRes = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .send({
          full_name: 'Blr Prefix Test',
          email: `fo.blr.prefix.${Date.now()}@tradezo.gov.in`,
          phone: `85${String(Date.now()).slice(-8)}`,
          password: testFoPass,
          role: 'field_officer',
        })
        .expect(201);
      expect(blrRes.body.employee_id.startsWith('FO-BLR-')).toBe(true);
    });

    it('Test 12 & 13: Generated Employee ID is persisted, returned by API, and officer can log in', async () => {
      const officerEmail = `fo.login.verify.${Date.now()}@tradezo.gov.in`;
      const res = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .send({
          full_name: 'Login Verify Officer',
          email: officerEmail,
          phone: `86${String(Date.now()).slice(-8)}`,
          password: testFoPass,
          role: 'field_officer',
        })
        .expect(201);

      const createdEmpId = res.body.employee_id;
      expect(createdEmpId).toBeDefined();

      // Verify officer can log in with their credentials
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: officerEmail,
          password: testFoPass,
          role: 'field_officer',
        })
        .expect(201);

      expect(loginRes.body.accessToken).toBeDefined();
      expect(loginRes.body.user.employee_id).toBe(createdEmpId);
      expect(loginRes.body.user.municipality_id).toBe('muni-blr');
    });

    it('Test 14: Existing Field Officer authentication tests continue to pass', async () => {
      // Ravi (Hyderabad FO) login
      const raviLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'ravi@tradezo.gov.in',
          password: 'TradeZo@123',
          role: 'field_officer',
        })
        .expect(201);
      expect(raviLogin.body.user.municipality_id).toBe('muni-hyd');

      // Arjun (Bangalore FO) login
      const arjunLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'arjun@tradezo.gov.in',
          password: 'TradeZo@123',
          role: 'field_officer',
        })
        .expect(201);
      expect(arjunLogin.body.user.municipality_id).toBe('muni-blr');
    });
  });

  describe('Department Officer Management & One-DO-Per-Municipality Isolation', () => {
    const ts = Date.now();
    const hydDo1Email = `do.hyd.1.${ts}@tradezo.gov.in`;
    const hydDo2Email = `do.hyd.2.${ts}@tradezo.gov.in`;
    const blrDoEmail = `do.blr.1.${ts}@tradezo.gov.in`;
    const doPass = 'TradeZo@123';

    it('1: GET /api/users/department-officer returns null when no active DO exists', async () => {
      // Clear DOs for hyd to test empty state
      const store = app.get(JsonStore);
      const snapshot = store.snapshot();
      snapshot.users.forEach(u => {
        if (u.role === 'department_officer') u.status = 'Inactive';
      });
      store.save();

      const res = await request(app.getHttpServer())
        .get('/api/users/department-officer')
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();
    });

    it('2: Hyderabad SUPER_USER adds DO -> DO persisted with muni-hyd and role department_officer', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/users/department-officer')
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .send({
          full_name: 'Hyderabad DO One',
          email: hydDo1Email,
          phone: `91${String(Date.now()).slice(-8)}`,
          password: doPass,
          department: 'Trade License Department',
        })
        .expect(201);

      expect(res.body.user_id).toBeDefined();
      expect(res.body.role).toBe('department_officer');
      expect(res.body.municipality_id).toBe('muni-hyd');
      expect(res.body.status).toBe('Active');
    });

    it('3: Hyderabad DO can log in with supplied credentials', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: hydDo1Email,
          password: doPass,
          role: 'department_officer',
        })
        .expect(201);

      expect(loginRes.body.accessToken).toBeDefined();
      expect(loginRes.body.user.municipality_id).toBe('muni-hyd');
    });

    it('4: Hyderabad SUPER_USER sees only Hyderabad active DO', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users/department-officer')
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.email).toBe(hydDo1Email);
      expect(res.body.data.municipality_id).toBe('muni-hyd');
    });

    it('5: Attempt to create a second Hyderabad DO without replace returns 409 Conflict', async () => {
      await request(app.getHttpServer())
        .post('/api/users/department-officer')
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .send({
          full_name: 'Hyderabad DO Duplicate',
          email: `do.hyd.dup.${Date.now()}@tradezo.gov.in`,
          phone: `92${String(Date.now()).slice(-8)}`,
          password: doPass,
          department: 'Trade License Department',
        })
        .expect(409);
    });

    it('6: Replace Hyderabad DO -> old DO becomes inactive and new DO becomes the single active DO', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/users/department-officer/replace')
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .send({
          full_name: 'Hyderabad DO Two (Replaced)',
          email: hydDo2Email,
          phone: `93${String(Date.now()).slice(-8)}`,
          password: doPass,
          department: 'Trade License Department',
        })
        .expect(201);

      expect(res.body.email).toBe(hydDo2Email);
      expect(res.body.municipality_id).toBe('muni-hyd');
      expect(res.body.status).toBe('Active');

      // Check that GET returns DO 2
      const getRes = await request(app.getHttpServer())
        .get('/api/users/department-officer')
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .expect(200);

      expect(getRes.body.data.email).toBe(hydDo2Email);
    });

    it('7: New Hyderabad DO can log in and old DO cannot log in (inactive)', async () => {
      // New DO logins successfully
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: hydDo2Email,
          password: doPass,
          role: 'department_officer',
        })
        .expect(201);

      // Old DO login fails (inactive)
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: hydDo1Email,
          password: doPass,
          role: 'department_officer',
        })
        .expect(401);
    });

    it('8 & 9: Bangalore SUPER_USER adds DO -> DO persisted with muni-blr and can log in', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/users/department-officer')
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .send({
          full_name: 'Bangalore DO One',
          email: blrDoEmail,
          phone: `94${String(Date.now()).slice(-8)}`,
          password: doPass,
          department: 'Trade License Department',
        })
        .expect(201);

      expect(res.body.municipality_id).toBe('muni-blr');

      // Bangalore DO login
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: blrDoEmail,
          password: doPass,
          role: 'department_officer',
        })
        .expect(201);

      expect(loginRes.body.user.municipality_id).toBe('muni-blr');
    });

    it('10 & 11: Hyderabad SUPER_USER sees only Hyd DO and Bangalore SUPER_USER sees only Blr DO', async () => {
      const hydRes = await request(app.getHttpServer())
        .get('/api/users/department-officer')
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .expect(200);
      expect(hydRes.body.data.email).toBe(hydDo2Email);
      expect(hydRes.body.data.municipality_id).toBe('muni-hyd');

      const blrRes = await request(app.getHttpServer())
        .get('/api/users/department-officer')
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .expect(200);
      expect(blrRes.body.data.email).toBe(blrDoEmail);
      expect(blrRes.body.data.municipality_id).toBe('muni-blr');
    });

    it('12: New municipality dynamically created uses the exact same Add/Replace DO flow', async () => {
      const newMuniId = 'muni-pune';
      // Register Pune Municipal Head
      const puneHeadRes = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          full_name: 'Pune Commissioner',
          email: `pune.head.${Date.now()}@tradezo.gov.in`,
          phone: `95${String(Date.now()).slice(-8)}`,
          password: 'TradeZo@123',
          role: 'municipal_commissioner',
          municipality_id: newMuniId,
        })
        .expect(201);

      const puneLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: puneHeadRes.body.email,
          password: 'TradeZo@123',
          role: 'municipal_commissioner',
        })
        .expect(201);

      const puneHeadToken = puneLogin.body.accessToken;

      // Pune Head adds DO
      const puneDoEmail = `pune.do.${Date.now()}@tradezo.gov.in`;
      const puneDoRes = await request(app.getHttpServer())
        .post('/api/users/department-officer')
        .set('Authorization', `Bearer ${puneHeadToken}`)
        .send({
          full_name: 'Pune Department Officer',
          email: puneDoEmail,
          phone: `96${String(Date.now()).slice(-8)}`,
          password: 'TradeZo@123',
          department: 'Trade License Department',
        })
        .expect(201);

      expect(puneDoRes.body.municipality_id).toBe(newMuniId);

      // Verify Pune DO Login
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: puneDoEmail,
          password: 'TradeZo@123',
          role: 'department_officer',
        })
        .expect(201);
    });

    it('13: Historical applications remain untouched after DO replacement', async () => {
      const hydAppsRes = await request(app.getHttpServer())
        .get('/api/applications')
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .expect(200);

      // Applications submitted earlier are still intact
      expect(Array.isArray(hydAppsRes.body.data)).toBe(true);
      hydAppsRes.body.data.forEach((app: any) => {
        expect(app.municipality_id).toBe('muni-hyd');
      });
    });
  });

  // ================================================================
  // Municipality Resolution Regression Tests — Document Upload Fix
  // ================================================================
  describe('Municipality Resolution (Document Upload Fix)', () => {
    let applicantToken: string;
    let applicantBlrToken: string;

    beforeAll(async () => {
      // Register and login a Hyderabad applicant
      const hydEmail = `hyd.applicant.docfix.${Date.now()}@gmail.com`;
      await request(app.getHttpServer())
        .post('/api/users/register')
        .send({ full_name: 'HYD Doc Fix Applicant', email: hydEmail, phone: `8111${String(Date.now()).slice(-6)}`, password: 'Password@123' })
        .expect(201);
      const hydLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: hydEmail, password: 'Password@123', role: 'applicant' })
        .expect(201);
      applicantToken = hydLogin.body.accessToken;

      // Register and login a Bangalore applicant
      const blrEmail = `blr.applicant.docfix.${Date.now()}@gmail.com`;
      await request(app.getHttpServer())
        .post('/api/users/register')
        .send({ full_name: 'BLR Doc Fix Applicant', email: blrEmail, phone: `8222${String(Date.now()).slice(-6)}`, password: 'Password@123' })
        .expect(201);
      const blrLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: blrEmail, password: 'Password@123', role: 'applicant' })
        .expect(201);
      applicantBlrToken = blrLogin.body.accessToken;
    });

    // Scenario A: Hyderabad with explicit municipality_id (exact UI payload)
    it('A: Hyderabad applicant — state=Telangana, city=Hyderabad, municipality_id=muni-hyd → resolves to muni-hyd', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/applications')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          applicantName: 'Hyderabad Doc Fix A',
          businessName: 'HYD Business A',
          tradeCategory: 'Retail',
          shopAddress: '1 Tank Bund Rd',
          city: 'Hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
          pincode: '500001',
          phone: '9000000001',
          municipality_id: 'muni-hyd',
          municipalityId: 'muni-hyd',
        })
        .expect(201);
      expect(res.body.data.municipality_id).toBe('muni-hyd');
    });

    // Scenario B: Lowercase city with explicit municipality_id
    it('B: Lowercase city "hyderabad" + state Telangana + municipality_id=muni-hyd → muni-hyd', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/applications')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          applicantName: 'Hyderabad Doc Fix B',
          businessName: 'HYD Business B',
          tradeCategory: 'Retail',
          shopAddress: '2 Tank Bund Rd',
          city: 'hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
          pincode: '500001',
          phone: '9000000002',
          municipality_id: 'muni-hyd',
          municipalityId: 'muni-hyd',
        })
        .expect(201);
      expect(res.body.data.municipality_id).toBe('muni-hyd');
    });

    // Scenario C: Lowercase state with explicit municipality_id
    it('C: city=Hyderabad + lowercase state "telangana" + municipality_id=muni-hyd → muni-hyd', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/applications')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          applicantName: 'Hyderabad Doc Fix C',
          businessName: 'HYD Business C',
          tradeCategory: 'Retail',
          shopAddress: '3 Tank Bund Rd',
          city: 'Hyderabad',
          district: 'Hyderabad',
          state: 'telangana',
          pincode: '500001',
          phone: '9000000003',
          municipality_id: 'muni-hyd',
          municipalityId: 'muni-hyd',
        })
        .expect(201);
      expect(res.body.data.municipality_id).toBe('muni-hyd');
    });

    // Scenario D: Bengaluru with explicit municipality_id
    it('D: Karnataka + Bangalore + municipality_id=muni-blr → resolves to muni-blr', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/applications')
        .set('Authorization', `Bearer ${applicantBlrToken}`)
        .send({
          applicantName: 'Bangalore Doc Fix D',
          businessName: 'BLR Business D',
          tradeCategory: 'Retail',
          shopAddress: '1 MG Road',
          city: 'Bangalore',
          district: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          phone: '9100000001',
          municipality_id: 'muni-blr',
          municipalityId: 'muni-blr',
        })
        .expect(201);
      expect(res.body.data.municipality_id).toBe('muni-blr');
    });

    // Scenario E: Bengaluru spelling variant
    it('E: Karnataka + Bengaluru (alternate spelling) + municipality_id=muni-blr → muni-blr', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/applications')
        .set('Authorization', `Bearer ${applicantBlrToken}`)
        .send({
          applicantName: 'Bangalore Doc Fix E',
          businessName: 'BLR Business E',
          tradeCategory: 'Retail',
          shopAddress: '2 MG Road',
          city: 'Bengaluru',
          district: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          phone: '9100000002',
          municipality_id: 'muni-blr',
          municipalityId: 'muni-blr',
        })
        .expect(201);
      expect(res.body.data.municipality_id).toBe('muni-blr');
    });

    // Scenario F: Unsupported location without explicit municipality_id → must fail
    it('F: Unsupported location without municipality_id → 400 No active municipal corporation found', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/applications')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          applicantName: 'Unknown City Applicant',
          businessName: 'Unknown Business',
          tradeCategory: 'Retail',
          shopAddress: '1 Nowhere Street',
          city: 'Atlantis',
          district: 'Atlantis',
          state: 'Mythical State',
          pincode: '000000',
          phone: '9200000001',
          // No municipality_id provided
        })
        .expect(400);
      expect(res.body.message).toMatch(/No active municipal corporation found/);
    });

    // Scenario G: Invalid/inactive municipality_id → must fail
    it('G: Invalid municipality_id → 400 does not exist or is inactive', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/applications')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          applicantName: 'Invalid Muni Applicant',
          businessName: 'Invalid Business',
          tradeCategory: 'Retail',
          shopAddress: '1 Fake Street',
          city: 'Hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
          pincode: '500001',
          phone: '9300000001',
          municipality_id: 'muni-nonexistent',
          municipalityId: 'muni-nonexistent',
        })
        .expect(400);
      expect(res.body.message).toMatch(/does not exist or is inactive/);
    });

    // Scenario H: Existing application with municipality_id (only municipality_id, no city/state)
    it('H: Only municipality_id provided, no city/state → trusts explicit municipality_id', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/applications')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          applicantName: 'HYD Doc Fix H',
          businessName: 'HYD Business H',
          tradeCategory: 'Retail',
          shopAddress: '5 Test Street',
          pincode: '500001',
          phone: '9400000001',
          municipality_id: 'muni-hyd',
          municipalityId: 'muni-hyd',
        })
        .expect(201);
      expect(res.body.data.municipality_id).toBe('muni-hyd');
    });

    // Scenario I: Hyderabad application NOT visible to Bengaluru SUPER_USER (tenant isolation)
    it('I: Hyderabad application NOT visible to Bengaluru SUPER_USER', async () => {
      // Create a new Hyderabad application
      const hydAppRes = await request(app.getHttpServer())
        .post('/api/applications')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          applicantName: 'HYD Isolation Test I',
          businessName: 'HYD Isolation Business',
          tradeCategory: 'Retail',
          shopAddress: '7 Isolation Road',
          city: 'Hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
          pincode: '500001',
          phone: '9500000001',
          municipality_id: 'muni-hyd',
          municipalityId: 'muni-hyd',
        })
        .expect(201);
      const newHydAppId = hydAppRes.body.data.application_id;

      // Bengaluru SUPER_USER should NOT see this Hyderabad application
      const blrAppsRes = await request(app.getHttpServer())
        .get('/api/applications')
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .expect(200);

      const blrAppIds = blrAppsRes.body.data.map((a: any) => a.application_id);
      expect(blrAppIds).not.toContain(newHydAppId);
      // Hyderabad SUPER_USER SHOULD see it
      const hydAppsRes = await request(app.getHttpServer())
        .get('/api/applications')
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .expect(200);
      const hydAppIds = hydAppsRes.body.data.map((a: any) => a.application_id);
      expect(hydAppIds).toContain(newHydAppId);
    });

    // Scenario J: Conflicting location vs municipality_id → must reject
    it('J: Hyderabad location + municipality_id=muni-blr (conflict) → 400 conflict error', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/applications')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          applicantName: 'Conflict Test J',
          businessName: 'Conflict Business J',
          tradeCategory: 'Retail',
          shopAddress: '1 Conflict Street',
          city: 'Hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
          pincode: '500001',
          phone: '9600000001',
          municipality_id: 'muni-blr',
          municipalityId: 'muni-blr',
        })
        .expect(400);
      expect(res.body.message).toMatch(/conflicts with application location/);
    });

    // Scenario K: Field Officer Deletion with Strict Tenant Isolation
    it('K1: Hyderabad SUPER_USER creates and successfully deletes Hyderabad Field Officer', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .send({
          full_name: 'Temp Hyd FO Delete Test',
          email: 'temp.hyd.fo.del@tradezo.gov.in',
          phone: '9876543290',
          password_hash: 'TradeZo@123',
          role: 'field_officer',
        })
        .expect(201);

      const createdId = createRes.body.user_id;
      expect(createRes.body.municipality_id).toBe('muni-hyd');

      // Delete the created officer
      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/users/${createdId}`)
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .expect(200);

      expect(deleteRes.body.success).toBe(true);

      // Verify user is gone from Hyderabad users list
      const listRes = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .expect(200);

      const found = listRes.body.find((u: any) => u.user_id === createdId);
      expect(found).toBeUndefined();
    });

    it('K2: Hyderabad SUPER_USER cannot delete Bangalore Field Officer (403 Forbidden)', async () => {
      const createBlrRes = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .send({
          full_name: 'Temp Blr FO Cross Test',
          email: 'temp.blr.fo.cross@tradezo.gov.in',
          phone: '9876543291',
          password_hash: 'TradeZo@123',
          role: 'field_officer',
        })
        .expect(201);

      const blrFoId = createBlrRes.body.user_id;

      // Hyderabad Head attempts to delete Bangalore FO -> 403 Forbidden
      const crossDelRes = await request(app.getHttpServer())
        .delete(`/api/users/${blrFoId}`)
        .set('Authorization', `Bearer ${hydHeadToken}`)
        .expect(403);

      expect(crossDelRes.body.message).toMatch(/outside your municipality/i);

      // Bangalore Head can successfully delete their own FO
      await request(app.getHttpServer())
        .delete(`/api/users/${blrFoId}`)
        .set('Authorization', `Bearer ${blrHeadToken}`)
        .expect(200);
    });
  });

  afterAll(async () => {
    const store = app.get(JsonStore);

    const snapshot = store.snapshot();
    snapshot.applications = [];
    snapshot.payments = [];
    snapshot.licenses = [];
    snapshot.platform.revenue_records = [];
    snapshot.municipalities = snapshot.municipalities.filter(
      (m) => m.municipality_id === 'muni-hyd' || m.municipality_id === 'muni-blr',
    );
    // remove test users created
    snapshot.users = snapshot.users.filter(
      (u) =>
        !u.email.includes('flow') &&
        !u.email.startsWith('fo.blr.2') &&
        !u.email.startsWith('fo.hyd.2') &&
        !u.email.includes('do.hyd') &&
        !u.email.includes('do.blr') &&
        !u.email.includes('pune.') &&
        !u.email.includes('chennai.') &&
        !u.email.includes('applicant.hyd.') &&
        !u.email.includes('appu.') &&
        !u.email.includes('docfix.'),
    );
    snapshot.users.forEach((u) => {
      u.status = 'Active';
    });
    store.save();
    await app.close();
  });
});
