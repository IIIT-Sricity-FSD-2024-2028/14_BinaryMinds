import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ApplicantLogin from './applicant/pages/ApplicantLogin';
import ApplicantLandingPage from './applicant/pages/ApplicantLandingPage';
import ApplicantRegistration from './applicant/pages/ApplicantRegistration';
import ApplicantDashboard from './applicant/pages/ApplicantDashboard';
import ApplicantProfile from './applicant/pages/ApplicantProfile';
import ApplicantApplyLicense from './applicant/pages/ApplicantApplyLicense';
import ApplicantUploadDocuments from './applicant/pages/ApplicantUploadDocuments';
import ApplicantTrackStatus from './applicant/pages/ApplicantTrackStatus';
import ApplicantReviewLicense from './applicant/pages/ApplicantReviewLicense';
import ApplicantPayNow from './applicant/pages/ApplicantPayNow';
import ApplicantDownloadLicense from './applicant/pages/ApplicantDownloadLicense';
import ApplicantPaymentSuccess from './applicant/pages/ApplicantPaymentSuccess';
import ApplicantPaymentFailure from './applicant/pages/ApplicantPaymentFailure';
import ApplicantPaymentHistory from './applicant/pages/ApplicantPaymentHistory';
import ApplicantForgotPassword from './applicant/pages/ApplicantForgotPassword';
import ApplicantProfileEdit from './applicant/pages/ApplicantProfileEdit';
import CommissionerDashboard from './municipal-commissioner/pages/CommissionerDashboard';
import CommissionerFieldOfficers from './municipal-commissioner/pages/CommissionerFieldOfficers';
import CommissionerDepartmentOfficers from './municipal-commissioner/pages/CommissionerDepartmentOfficers';
import CommissionerApplications from './municipal-commissioner/pages/CommissionerApplications';
import CommissionerSettings from './municipal-commissioner/pages/CommissionerSettings';
import CommissionerAuditLogs from './municipal-commissioner/pages/CommissionerAuditLogs';
import FieldOfficerDashboard from './field-officer/pages/FieldOfficerDashboard';
import Verification from './field-officer/pages/Verification';
import ApplicationDetails from './field-officer/pages/ApplicationDetails';
import VerificationHistory from './field-officer/pages/VerificationHistory';
import ScheduleInspection from './field-officer/pages/ScheduleInspection';
import RecordInspection from './field-officer/pages/RecordInspection';
import StartInspection from './field-officer/pages/StartInspection';
import InspectionHistory from './field-officer/pages/InspectionHistory';
import InspectionReport from './field-officer/pages/InspectionReport';
import FieldOfficerProfile from './field-officer/pages/FieldOfficerProfile';
import EditFieldOfficerProfile from './field-officer/pages/EditFieldOfficerProfile';
import DepartmentOfficerDashboard from './department-officer/pages/DepartmentOfficerDashboard';
import DepartmentOfficerWorklist from './department-officer/pages/DepartmentOfficerWorklist';
import DepartmentOfficerReview from './department-officer/pages/DepartmentOfficerReview';
import DepartmentOfficerCompliance from './department-officer/pages/DepartmentOfficerCompliance';
import DepartmentOfficerGeneratedLicenses from './department-officer/pages/DepartmentOfficerGeneratedLicenses';
import DepartmentOfficerInspectionReport from './department-officer/pages/DepartmentOfficerInspectionReport';
import DepartmentOfficerAuthorization from './department-officer/pages/DepartmentOfficerAuthorization';
import DepartmentOfficerSigning from './department-officer/pages/DepartmentOfficerSigning';
import PlatformAdminLayout from './platform-admin/components/PlatformAdminLayout';
import PlatformAdminLogin from './platform-admin/pages/PlatformAdminLogin';
import PlatformAdminDashboard from './platform-admin/pages/PlatformAdminDashboard';
import PlatformAdminCorporations from './platform-admin/pages/PlatformAdminCorporations';
import PlatformAdminApplications from './platform-admin/pages/PlatformAdminApplications';
import PlatformAdminRevenue from './platform-admin/pages/PlatformAdminRevenue';
import PlatformAdminFeeSettings from './platform-admin/pages/PlatformAdminFeeSettings';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ApplicantLandingPage />} />
        <Route path="/login" element={<ApplicantLogin />} />
        <Route path="/login/index.html" element={<Navigate to="/login" replace />} />
        <Route path="/forgot-password" element={<ApplicantForgotPassword />} />
        <Route path="/register" element={<ApplicantRegistration />} />
        <Route path="/dashboard" element={<ApplicantDashboard />} />
        <Route path="/profile" element={<ApplicantProfile />} />
        <Route path="/profile/edit" element={<ApplicantProfileEdit />} />
        <Route path="/apply-license" element={<ApplicantApplyLicense />} />
        <Route path="/upload-documents" element={<ApplicantUploadDocuments />} />
        <Route path="/track-status" element={<ApplicantTrackStatus />} />
        <Route path="/review-license" element={<ApplicantReviewLicense />} />
        <Route path="/pay-now" element={<ApplicantPayNow />} />
        <Route path="/paynow/index.html" element={<Navigate to="/pay-now" replace />} />
        <Route path="/paynow/" element={<Navigate to="/pay-now" replace />} />
        <Route path="/download-license" element={<ApplicantDownloadLicense />} />
        <Route path="/payment-success" element={<ApplicantPaymentSuccess />} />
        <Route path="/payment-failure" element={<ApplicantPaymentFailure />} />
        <Route path="/payments" element={<ApplicantPaymentHistory />} />
        <Route path="/platform-admin/login" element={<PlatformAdminLogin />} />
        <Route path="/platform-admin" element={<PlatformAdminLayout />}>
          <Route index element={<PlatformAdminDashboard />} />
          <Route path="corporations" element={<PlatformAdminCorporations />} />
          <Route path="corporations/:municipalityId/applications" element={<PlatformAdminApplications />} />
          <Route path="revenue" element={<PlatformAdminRevenue />} />
          <Route path="settings" element={<PlatformAdminFeeSettings />} />
        </Route>
        <Route path="/superuser" element={<CommissionerDashboard />} />
        <Route path="/superuser/index.html" element={<Navigate to="/superuser" replace />} />
        <Route path="/superuser/field-officers" element={<CommissionerFieldOfficers />} />
        <Route path="/superuser/department-officers" element={<CommissionerDepartmentOfficers />} />
        <Route path="/superuser/applications" element={<CommissionerApplications />} />
        <Route path="/superuser/settings" element={<CommissionerSettings />} />
        <Route path="/superuser/audit" element={<CommissionerAuditLogs />} />
        <Route path="/officer/:officerId" element={<FieldOfficerDashboard />} />
        <Route path="/officer/:officerId/verification" element={<Verification />} />
        <Route path="/officer/:officerId/detail" element={<ApplicationDetails />} />
        <Route path="/officer/:officerId/detail/:recordId" element={<ApplicationDetails />} />
        <Route path="/officer/:officerId/verificationhistory" element={<VerificationHistory />} />
        <Route path="/officer/:officerId/scheduleinspection" element={<ScheduleInspection />} />
        <Route path="/officer/:officerId/recordinspection" element={<RecordInspection />} />
        <Route path="/officer/:officerId/start-inspection" element={<StartInspection />} />
        <Route path="/officer/:officerId/start-inspection/:recordId" element={<StartInspection />} />
        <Route path="/officer/:officerId/inspectionhistory" element={<InspectionHistory />} />
        <Route path="/officer/:officerId/inspection_report" element={<InspectionReport />} />
        <Route path="/officer/:officerId/inspection_report/:recordId" element={<InspectionReport />} />
        <Route path="/officer/:officerId/profile" element={<FieldOfficerProfile />} />
        <Route path="/officer/:officerId/profile_edit" element={<EditFieldOfficerProfile />} />
        <Route path="/department-officer" element={<DepartmentOfficerDashboard />} />
        <Route path="/department-officer/worklist" element={<DepartmentOfficerWorklist />} />
        <Route path="/department-officer/review/:applicationId" element={<DepartmentOfficerReview />} />
        <Route path="/department-officer/inspection-report/:applicationId" element={<DepartmentOfficerInspectionReport />} />
        <Route path="/department-officer/authorization" element={<DepartmentOfficerAuthorization />} />
        <Route path="/department-officer/authorization/:applicationId/sign" element={<DepartmentOfficerSigning />} />
        <Route path="/department-officer/compliance" element={<DepartmentOfficerCompliance />} />
        <Route path="/department-officer/generated-licenses" element={<DepartmentOfficerGeneratedLicenses />} />
        <Route path="/do_connected/dashboard/index.html" element={<Navigate to="/department-officer" replace />} />
        <Route path="/do_connected/worklist/index.html" element={<Navigate to="/department-officer/worklist" replace />} />
        <Route path="/do_connected/review/index.html" element={<Navigate to={sessionStorage.getItem('selectedAppDO') ? `/department-officer/review/${sessionStorage.getItem('selectedAppDO')}` : '/department-officer/worklist'} replace />} />
        <Route path="/do_connected/inspection-report/index.html" element={<Navigate to={sessionStorage.getItem('selectedAppDO') ? `/department-officer/inspection-report/${sessionStorage.getItem('selectedAppDO')}` : '/department-officer/worklist'} replace />} />
        <Route path="/do_connected/authorization/index.html" element={<Navigate to="/department-officer/authorization" replace />} />
        <Route path="/do_connected/authorization/signing.html" element={<Navigate to={sessionStorage.getItem('selectedAppDO') ? `/department-officer/authorization/${sessionStorage.getItem('selectedAppDO')}/sign` : '/department-officer/authorization'} replace />} />
        <Route path="/do_connected/compliance/index.html" element={<Navigate to="/department-officer/compliance" replace />} />
        <Route path="/do_connected/generated_licenses/index.html" element={<Navigate to="/department-officer/generated-licenses" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
