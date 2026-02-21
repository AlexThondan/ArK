import { Navigate, Route, Routes } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../layouts/MainLayout";
import LoginPage from "../pages/auth/LoginPage";
import EmployeeDashboardPage from "../pages/employee/EmployeeDashboardPage";
import EmployeeProfilePage from "../pages/employee/EmployeeProfilePage";
import EmployeeAttendancePage from "../pages/employee/EmployeeAttendancePage";
import EmployeeLeavePage from "../pages/employee/EmployeeLeavePage";
import EmployeeTasksPage from "../pages/employee/EmployeeTasksPage";
import EmployeeDocumentsPage from "../pages/employee/EmployeeDocumentsPage";
import EmployeeTeamsPage from "../pages/employee/EmployeeTeamsPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminEmployeesPage from "../pages/admin/AdminEmployeesPage";
import AdminTeamsPage from "../pages/admin/AdminTeamsPage";
import AdminLeavePage from "../pages/admin/AdminLeavePage";
import AdminAttendancePage from "../pages/admin/AdminAttendancePage";
import AdminProjectsPage from "../pages/admin/AdminProjectsPage";
import AdminClientsPage from "../pages/admin/AdminClientsPage";
import AdminReportsPage from "../pages/admin/AdminReportsPage";
import SettingsPage from "../pages/SettingsPage";

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/employee/dashboard"} replace />;
};

const AppRouter = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />

    <Route
      path="/"
      element={
        <ProtectedRoute allowedRoles={["admin", "employee"]}>
          <MainLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<RoleRedirect />} />

      <Route
        path="employee/dashboard"
        element={
          <ProtectedRoute allowedRoles={["employee"]}>
            <EmployeeDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="employee/profile"
        element={
          <ProtectedRoute allowedRoles={["employee"]}>
            <EmployeeProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="employee/attendance"
        element={
          <ProtectedRoute allowedRoles={["employee"]}>
            <EmployeeAttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="employee/leave"
        element={
          <ProtectedRoute allowedRoles={["employee"]}>
            <EmployeeLeavePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="employee/tasks"
        element={
          <ProtectedRoute allowedRoles={["employee"]}>
            <EmployeeTasksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="employee/teams"
        element={
          <ProtectedRoute allowedRoles={["employee"]}>
            <EmployeeTeamsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="employee/documents"
        element={
          <ProtectedRoute allowedRoles={["employee"]}>
            <EmployeeDocumentsPage />
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
        path="admin/employees"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
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
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLeavePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin/attendance"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
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
        path="admin/reports"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminReportsPage />
          </ProtectedRoute>
        }
      />
      <Route path="settings" element={<SettingsPage />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRouter;
