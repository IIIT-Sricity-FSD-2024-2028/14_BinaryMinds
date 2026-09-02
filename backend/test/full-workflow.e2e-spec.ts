import { join } from 'node:path';
process.env.TRADEZO_DATA_FILE = join(__dirname, '..', 'data', 'tradezo.test.json');

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { ApplicationStatus } from '../src/common/enums/application-status.enum';
import { LicenseStatus } from '../src/common/enums/license-status.enum';
import { JsonStore } from '../src/common/persistence/json-store';

describe('Full Multi-Tenant Workflow (e2e)', () => {
  let app: INestApplication;

  let hydHeadToken: string;
  let hydFoToken: string;
  let hydDoToken: string;

  let blrHeadToken: string;
  let blrFoToken: string;
  let blrDoToken: string;

  let applicantToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const store = app.get(JsonStore);
    const snapshot = store.snapshot();
    snapshot.users.forEach(u => {
      u.status = 'Active';
    });
    snapshot.users = snapshot.users.filter(u => !u.email.includes('workflow'));
    snapshot.applications = [];
    snapshot.payments = [];
    snapshot.licenses = [];
    store.save();

    // Logins for Hyderabad (muni-hyd)
    const hydHead = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'ramesh@tradezo.gov.in', password: 'TradeZo@123', role: 'municipal_commissioner' })
      .expect(201);
    hydHeadToken = hydHead.body.accessToken;

    const hydFo = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'ravi@tradezo.gov.in', password: 'TradeZo@123', role: 'field_officer' })
      .expect(201);
    hydFoToken = hydFo.body.accessToken;

    const hydDo = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'kumar@tradezo.gov.in', password: 'TradeZo@123', role: 'department_officer' })
      .expect(201);
    hydDoToken = hydDo.body.accessToken;

    // Logins for Bangalore (muni-blr)
    const blrHead = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'suraj@tradezo.gov.in', password: 'TradeZo@123', role: 'municipal_commissioner' })
      .expect(201);
    blrHeadToken = blrHead.body.accessToken;

    const blrFo = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'arjun@tradezo.gov.in', password: 'TradeZo@123', role: 'field_officer' })
      .expect(201);
    blrFoToken = blrFo.body.accessToken;

    const blrDo = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'naveen@tradezo.gov.in', password: 'TradeZo@123', role: 'department_officer' })
      .expect(201);
    blrDoToken = blrDo.body.accessToken;

    // Register Applicant dynamically for test run
    const rajeshEmail = `rajesh.${Date.now()}@applicant.com`;
    const rajeshPhone = `97${String(Date.now()).slice(-8)}`;

    await request(app.getHttpServer())
      .post('/api/users/register')
      .send({
        full_name: 'Rajesh Kumar',
        email: rajeshEmail,
        phone: rajeshPhone,
        password: 'applicant123',
      })
      .expect(201);

    // Applicant Login
    const applicantRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: rajeshEmail, password: 'applicant123', role: 'applicant' })
      .expect(201);
    applicantToken = applicantRes.body.accessToken;
  });

  it('Complete Workflow for MC001 (Hyderabad / GHMC)', async () => {
    // 1. Submit Application
    const appRes = await request(app.getHttpServer())
      .post('/api/applications')
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({
        applicantName: 'Rajesh Kumar',
        businessName: 'Hyderabad Spice Hub',
        tradeCategory: 'Food & Beverage',
        shopAddress: 'Banjara Hills, Hyderabad',
        phone: '9876543220',
        municipalityId: 'muni-hyd',
      })
      .expect(201);

    const appId = appRes.body.data.application_id;
    expect(appRes.body.data.municipality_id).toBe('muni-hyd');

    // 2. Process Payment
    const payRes = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({
        application_id: appId,
        amount: 1510,
        platform_fee: 250,
        processing_fee: 1200,
        service_tax: 60,
        municipality_id: 'muni-hyd',
        payment_method: 'UPI',
      })
      .expect(201);

    const paymentId = payRes.body.payment_id;
    expect(payRes.body.municipality_id).toBe('muni-hyd');

    // Verify payment
    await request(app.getHttpServer())
      .post(`/api/payments/${paymentId}/verify`)
      .set('Authorization', `Bearer ${hydDoToken}`)
      .send({ transaction_id: 'TXN-HYD-001', is_successful: true })
      .expect(201);

    // Update application paymentDone = true
    await request(app.getHttpServer())
      .patch(`/api/applications/${appId}`)
      .set('Authorization', `Bearer ${hydHeadToken}`)
      .send({ paymentDone: true })
      .expect(200);

    // 3. Municipal Head assigns application to Field Officer Ravi (user_id 2)
    const assignRes = await request(app.getHttpServer())
      .patch(`/api/applications/${appId}/assign`)
      .set('Authorization', `Bearer ${hydHeadToken}`)
      .send({ officerId: 2 })
      .expect(200);

    expect(assignRes.body.data.application_status).toBe(ApplicationStatus.ASSIGNED);
    expect(assignRes.body.data.assignedOfficerId).toBe(2);

    // 4. Field Officer verifies application
    const verifyRes = await request(app.getHttpServer())
      .patch(`/api/applications/${appId}/verify`)
      .set('Authorization', `Bearer ${hydFoToken}`)
      .expect(200);

    expect(verifyRes.body.data.application_status).toBe(ApplicationStatus.VERIFIED);

    // 5. Department Officer reviews and approves application
    const approveRes = await request(app.getHttpServer())
      .patch(`/api/applications/${appId}`)
      .set('Authorization', `Bearer ${hydDoToken}`)
      .send({ application_status: ApplicationStatus.APPROVED })
      .expect(200);

    expect(approveRes.body.data.application_status).toBe(ApplicationStatus.APPROVED);

    // 6. Issue License
    const licRes = await request(app.getHttpServer())
      .post('/api/licenses')
      .set('Authorization', `Bearer ${hydDoToken}`)
      .send({
        application_id: appId,
        issued_by: 3,
        expiry_date: new Date('2027-12-31').toISOString(),
      })
      .expect(201);

    expect(licRes.body.municipality_id).toBe('muni-hyd');
    expect(licRes.body.status).toBe(LicenseStatus.ACTIVE);
  });

  it('Complete Workflow for MC002 (Bangalore / BBMP)', async () => {
    // 1. Submit Application for Bangalore
    const appRes = await request(app.getHttpServer())
      .post('/api/applications')
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({
        applicantName: 'Rajesh Kumar',
        businessName: 'Bangalore Tech Bistro',
        tradeCategory: 'Restaurant',
        shopAddress: 'Indiranagar, Bengaluru',
        phone: '9876543220',
        municipalityId: 'muni-blr',
      })
      .expect(201);

    const appId = appRes.body.data.application_id;
    expect(appRes.body.data.municipality_id).toBe('muni-blr');

    // 2. Process Payment
    const payRes = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({
        application_id: appId,
        amount: 1510,
        platform_fee: 250,
        processing_fee: 1200,
        service_tax: 60,
        municipality_id: 'muni-blr',
        payment_method: 'CARD',
      })
      .expect(201);

    const paymentId = payRes.body.payment_id;
    expect(payRes.body.municipality_id).toBe('muni-blr');

    // Verify payment
    await request(app.getHttpServer())
      .post(`/api/payments/${paymentId}/verify`)
      .set('Authorization', `Bearer ${blrDoToken}`)
      .send({ transaction_id: 'TXN-BLR-001', is_successful: true })
      .expect(201);

    // Update application paymentDone = true
    await request(app.getHttpServer())
      .patch(`/api/applications/${appId}`)
      .set('Authorization', `Bearer ${blrHeadToken}`)
      .send({ paymentDone: true })
      .expect(200);

    // 3. Bangalore Municipal Head assigns application to Field Officer Arjun (user_id 5)
    const assignRes = await request(app.getHttpServer())
      .patch(`/api/applications/${appId}/assign`)
      .set('Authorization', `Bearer ${blrHeadToken}`)
      .send({ officerId: 5 })
      .expect(200);

    expect(assignRes.body.data.application_status).toBe(ApplicationStatus.ASSIGNED);
    expect(assignRes.body.data.assignedOfficerId).toBe(5);

    // 4. Bangalore Field Officer verifies application
    const verifyRes = await request(app.getHttpServer())
      .patch(`/api/applications/${appId}/verify`)
      .set('Authorization', `Bearer ${blrFoToken}`)
      .expect(200);

    expect(verifyRes.body.data.application_status).toBe(ApplicationStatus.VERIFIED);

    // 5. Bangalore Department Officer reviews and approves application
    const approveRes = await request(app.getHttpServer())
      .patch(`/api/applications/${appId}`)
      .set('Authorization', `Bearer ${blrDoToken}`)
      .send({ application_status: ApplicationStatus.APPROVED })
      .expect(200);

    expect(approveRes.body.data.application_status).toBe(ApplicationStatus.APPROVED);

    // 6. Issue License
    const licRes = await request(app.getHttpServer())
      .post('/api/licenses')
      .set('Authorization', `Bearer ${blrDoToken}`)
      .send({
        application_id: appId,
        issued_by: 6,
        expiry_date: new Date('2027-12-31').toISOString(),
      })
      .expect(201);

    expect(licRes.body.municipality_id).toBe('muni-blr');
    expect(licRes.body.status).toBe(LicenseStatus.ACTIVE);
  });

  afterAll(async () => {
    const store = app.get(JsonStore);
    const snapshot = store.snapshot();
    snapshot.applications = [];
    snapshot.payments = [];
    snapshot.licenses = [];
    snapshot.platform.revenue_records = [];
    snapshot.users = snapshot.users.filter((u) => u.user_id >= 0 && u.user_id <= 6);
    snapshot.counters = { users: 7, applications: 1, payments: 1, licenses: 1 };
    store.save();
    await app.close();
  });
});
