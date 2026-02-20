import {
  BarChart3,
  Building2,
  CalendarCheck2,
  ClipboardList,
  IdCard,
  FileText,
  LayoutDashboard,
  Settings,
  Users
} from "lucide-react";

export const employeeNav = [
  { label: "Dashboard", to: "/employee/dashboard", icon: LayoutDashboard },
  { label: "Profile", to: "/employee/profile", icon: IdCard },
  { label: "Tasks", to: "/employee/tasks", icon: ClipboardList },
  { label: "Leave", to: "/employee/leave", icon: CalendarCheck2 },
  { label: "Attendance", to: "/employee/attendance", icon: BarChart3 },
  { label: "Documents", to: "/employee/documents", icon: FileText },
  { label: "Settings", to: "/settings", icon: Settings }
];

export const adminNav = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Employees", to: "/admin/employees", icon: Users },
  { label: "Projects", to: "/admin/projects", icon: ClipboardList },
  { label: "Leave", to: "/admin/leaves", icon: CalendarCheck2 },
  { label: "Attendance", to: "/admin/attendance", icon: BarChart3 },
  { label: "Clients", to: "/admin/clients", icon: Building2 },
  { label: "Reports", to: "/admin/reports", icon: FileText },
  { label: "Settings", to: "/settings", icon: Settings }
];
