import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { KeyRound, Lock, Mail, User } from "lucide-react";
import { authApi } from "../../api/authApi";
import useAuth from "../../hooks/useAuth";
import arkLogo from "../../assets/ark-logo.svg";

const resolveHomePath = (role) => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "hr") return "/admin/hr-dashboard";
  if (role === "manager") return "/manager/dashboard";
  return "/employee/dashboard";
};

const RegisterAdminPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    bootstrapKey: ""
  });

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      await authApi.registerAdmin({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        bootstrapKey: form.bootstrapKey
      });
      const user = await login(String(form.email || "").trim(), form.password);
      navigate(resolveHomePath(user.role), { replace: true });
    } catch (error) {
      toast.error(error.message || "Unable to create admin account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-split-page">
      <div className="login-form-side">
        <div className="login-form-content">
          <div className="login-brand">
            <img src={arkLogo} alt="ArK" />
            <h1>ArK HRMS</h1>
          </div>

          <h2 className="login-title">Create Admin</h2>
          <p className="login-subtitle">Bootstrap your first admin account.</p>

          <form className="login-form" onSubmit={onSubmit}>
            <label className="login-field-label" htmlFor="firstName">First Name</label>
            <div className="login-input-wrap">
              <User size={15} className="login-field-icon" />
              <input
                id="firstName"
                type="text"
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </div>

            <label className="login-field-label" htmlFor="lastName">Last Name</label>
            <div className="login-input-wrap">
              <User size={15} className="login-field-icon" />
              <input
                id="lastName"
                type="text"
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </div>

            <label className="login-field-label" htmlFor="email">Email</label>
            <div className="login-input-wrap">
              <Mail size={15} className="login-field-icon" />
              <input
                id="email"
                type="email"
                placeholder="admin@company.com"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <label className="login-field-label" htmlFor="password">Password</label>
            <div className="login-input-wrap">
              <Lock size={15} className="login-field-icon" />
              <input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>

            <label className="login-field-label" htmlFor="bootstrapKey">Bootstrap Key</label>
            <div className="login-input-wrap">
              <KeyRound size={15} className="login-field-icon" />
              <input
                id="bootstrapKey"
                type="password"
                placeholder="ADMIN_BOOTSTRAP_KEY"
                value={form.bootstrapKey}
                onChange={(e) => setForm((prev) => ({ ...prev, bootstrapKey: e.target.value }))}
                required
              />
            </div>

            <button className="login-submit-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Admin"}
            </button>
          </form>
        </div>

        <p className="login-footer-copy">
          (C) Copyright 2026, <strong>ArK HRMS</strong> - All rights reserved.
        </p>
      </div>

      <div className="login-visual-side">
        <div className="login-visual-circles">
          <span className="lvc lvc-1" />
          <span className="lvc lvc-2" />
          <span className="lvc lvc-3" />
          <span className="lvc lvc-4" />
        </div>
        <div className="login-visual-brand">
          <div className="login-visual-logo">
            <img src={arkLogo} alt="ArK" />
          </div>
          <h2>ArK HRMS</h2>
          <p>Administrator Bootstrap</p>
        </div>
      </div>
    </div>
  );
};

export default RegisterAdminPage;
