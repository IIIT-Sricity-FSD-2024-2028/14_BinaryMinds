import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SuperuserDashboard from './pages/SuperuserDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import ApplicantDashboard from './applicant/pages/ApplicantDashboard';
import ApplicantApplyLicense from './applicant/pages/ApplicantApplyLicense';
import ApplicantDownloadLicense from './applicant/pages/ApplicantDownloadLicense';
import ApplicantForgotPassword from './applicant/pages/ApplicantForgotPassword';
import ApplicantHelpDesk from './applicant/pages/ApplicantHelpDesk';
import ApplicantLogin from './applicant/pages/ApplicantLogin';
import ApplicantPaymentFailure from './applicant/pages/ApplicantPaymentFailure';
import ApplicantPaymentHistory from './applicant/pages/ApplicantPaymentHistory';
import ApplicantPaymentSuccess from './applicant/pages/ApplicantPaymentSuccess';
import ApplicantPayNow from './applicant/pages/ApplicantPayNow';
import ApplicantProfile from './applicant/pages/ApplicantProfile';
import ApplicantProfileEdit from './applicant/pages/ApplicantProfileEdit';
import ApplicantRegistration from './applicant/pages/ApplicantRegistration';
import ApplicantReviewLicense from './applicant/pages/ApplicantReviewLicense';
import ApplicantTrackStatus from './applicant/pages/ApplicantTrackStatus';
import ApplicantUploadDocuments from './applicant/pages/ApplicantUploadDocuments';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The applicant portal is the default entry point. The dashboard retains
            its own authentication check and sends signed-out users to /login. */}
        <Route path="/" element={<ApplicantDashboard />} />
        <Route path="/applicant" element={<ApplicantDashboard />} />
        <Route path="/dashboard" element={<ApplicantDashboard />} />
        <Route path="/apply-license" element={<ApplicantApplyLicense />} />
        <Route path="/upload-documents" element={<ApplicantUploadDocuments />} />
        <Route path="/track-status" element={<ApplicantTrackStatus />} />
        <Route path="/review-license" element={<ApplicantReviewLicense />} />
        <Route path="/download-license" element={<ApplicantDownloadLicense />} />
        <Route path="/payments" element={<ApplicantPaymentHistory />} />
        <Route path="/pay-now" element={<ApplicantPayNow />} />
        <Route path="/payment-success" element={<ApplicantPaymentSuccess />} />
        <Route path="/payment-failure" element={<ApplicantPaymentFailure />} />
        <Route path="/profile" element={<ApplicantProfile />} />
        <Route path="/profile/edit" element={<ApplicantProfileEdit />} />
        <Route path="/helpdesk" element={<ApplicantHelpDesk />} />
        <Route path="/login" element={<ApplicantLogin />} />
        <Route path="/register" element={<ApplicantRegistration />} />
        <Route path="/forgot-password" element={<ApplicantForgotPassword />} />

        {/* Keep the existing admin and field officer entry points available. */}
        <Route path="/superuser" element={<SuperuserDashboard />} />
        <Route path="/officer/:officerId" element={<OfficerDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
