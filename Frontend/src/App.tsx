import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/layouts/app-layout";
import { BranchManagementPage } from "@/pages/branch-management-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { LeaseManagementPage } from "@/pages/lease-management-page";
import { PaymentSchedulePage } from "@/pages/payment-schedule-page";
import { LessorManagementPage } from "@/pages/lessor-management-page";
import { UserManagementPage } from "@/pages/user-management-page";
import type { UserRole } from "@/types/user"
import { LoginPage } from "@/pages/login-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { LogoutPage } from "@/pages/logout-page";
import { ProfilePage } from "@/pages/profile-page";
import { Ifrs16ReportingPage } from "@/pages/ifrs16-reporting-page";
import { ChangeRequestsPage } from "@/pages/change-requests-page";

import { NotificationsPage } from "@/pages/notifications-page";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="branch-management" element={<BranchManagementPage />} />
          <Route path="lease-management" element={<LeaseManagementPage />} />
          <Route path="payment-schedule" element={<PaymentSchedulePage />} />
          <Route path="lessor-management" element={<LessorManagementPage />} />
          <Route path="ifrs-16-reporting" element={<Ifrs16ReportingPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route
            path="user-management"
            element={
              <ProtectedRoute allowedRoles={["admin"] as UserRole[]}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="approval-center"
            element={
              <ProtectedRoute allowedRoles={["admin"] as UserRole[]}>
                <ChangeRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="logout" element={<LogoutPage />} />
        </Route>
        <Route path="login" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
