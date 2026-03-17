import { Navigate, Route, Routes } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../layouts/MainLayout";
import LoginPage from "../pages/auth/LoginPage";
import RegisterAdminPage from "../pages/auth/RegisterAdminPage";
import EmployeeDashboardPage from "../pages/employee/EmployeeDashboardPage";
import EmployeeProfilePage from "../pages/employee/EmployeeProfilePage";
import EmployeeAttendancePage from "../pages/employee/EmployeeAttendancePage";
import EmployeeLeavePage from "../pages/employee/EmployeeLeavePage";
import EmployeeTasksPage from "../pages/employee/EmployeeTasksPage";
import EmployeeDocumentsPage from "../pages/employee/EmployeeDocumentsPage";
import EmployeeTeamsPage from "../pages/employee/EmployeeTeamsPage";
import ManagerDashboardPage from "../pages/manager/ManagerDashboardPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminHrDashboardPage from "../pages/admin/AdminHrDashboardPage";
import AdminEmployeesPage from "../pages/admin/AdminEmployeesPage";
import AdminTeamsPage from "../pages/admin/AdminTeamsPage";
import AdminLeavePage from "../pages/admin/AdminLeavePage";
import AdminAttendancePage from "../pages/admin/AdminAttendancePage";
import AdminProjectsPage from "../pages/admin/AdminProjectsPage";
import AdminClientsPage from "../pages/admin/AdminClientsPage";
import AdminReportsPage from "../pages/admin/AdminReportsPage";
import AdminProfilePage from "../pages/admin/AdminProfilePage";
import SettingsPage from "../pages/SettingsPage";
import ChatPage from "../pages/chat/ChatPage";

const resolveHomePath = (role) => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "hr") return "/admin/hr-dashboard";
  if (role === "manager") return "/manager/dashboard";
  return "/employee/dashboard";
};

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={resolveHomePath(user.role)} replace />;
};

const AppRouter = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register-admin" element={<RegisterAdminPage />} />

    <Route
      path="/"
      element={
        <ProtectedRoute allowedRoles={["admin", "hr", "manager", "employee"]}>
          <MainLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<RoleRedirect />} />

      <Route
        path="employee/dashboard"
        element={
          <ProtectedRoute allowedRoles={["employee", "manager"]}>
            <EmployeeDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="employee/profile"
        element={
          <ProtectedRoute allowedRoles={["employee", "manager"]}>
            <EmployeeProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="employee/attendance"
        element={
          <ProtectedRoute allowedRoles={["employee", "manager"]}>
            <EmployeeAttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="employee/leave"
        element={
          <ProtectedRoute allowedRoles={["employee", "manager"]}>
            <EmployeeLeavePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="employee/tasks"
        element={
          <ProtectedRoute allowedRoles={["employee", "manager"]}>
            <EmployeeTasksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="employee/teams"
        element={
          <ProtectedRoute allowedRoles={["employee", "manager"]}>
            <EmployeeTeamsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="employee/documents"
        element={
          <ProtectedRoute allowedRoles={["employee", "manager"]}>
            <EmployeeDocumentsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="manager/dashboard"
        element={
          <ProtectedRoute allowedRoles={["manager"]}>
            <ManagerDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin/hr-dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin", "hr"]}>
            <AdminHrDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin/employees"
        element={
          <ProtectedRoute allowedRoles={["admin", "hr"]}>
            <AdminEmployeesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin/teams"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminTeamsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin/leaves"
        element={
          <ProtectedRoute allowedRoles={["admin", "hr"]}>
            <AdminLeavePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin/attendance"
        element={
          <ProtectedRoute allowedRoles={["admin", "hr"]}>
            <AdminAttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin/projects"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminProjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin/clients"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminClientsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin/profile"
        element={
          <ProtectedRoute allowedRoles={["admin", "hr"]}>
            <AdminProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin/reports"
        element={
          <ProtectedRoute allowedRoles={["admin", "hr"]}>
            <AdminReportsPage />
          </ProtectedRoute>
        }
      />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="chat" element={<ChatPage />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRouter;
