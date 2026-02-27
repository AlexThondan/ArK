import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import arkLogo from "../../assets/ark-logo.svg";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === "admin" ? "/admin/dashboard" : "/employee/dashboard", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      const loggedUser = await login(String(form.email || "").trim(), form.password);
      navigate(loggedUser.role === "admin" ? "/admin/dashboard" : "/employee/dashboard", { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onForgotPassword = () => {
    toast("Please contact HR/Admin to reset your password.");
  };

  return (
    <div className="login-split-page">
      {/* ── LEFT: Form ── */}
      <div className="login-form-side">

        <div className="login-form-content">
          <div className="login-brand">
            <img src={arkLogo} alt="ArK" />
            <h1>ArK HRMS</h1>
          </div>

          <h2 className="login-title">Sign in</h2>
          <p className="login-subtitle">Please enter your credentials to continue.</p>

          <form className="login-form" onSubmit={onSubmit}>
            <label className="login-field-label" htmlFor="email">Email</label>
            <div className="login-input-wrap">
              <Mail size={15} className="login-field-icon" />
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
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
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <div className="login-options-row">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={() => setRemember((v) => !v)}
                />
                <span>Keep me signed in</span>
              </label>
              <button type="button" className="login-forgot" onClick={onForgotPassword}>
                Forgot password?
              </button>
            </div>

            <button className="login-submit-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
              {!isSubmitting && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        <p className="login-footer-copy">
          © Copyright 2026, <strong>ArK HRMS</strong> – All rights reserved.
        </p>
      </div>

      {/* ── RIGHT: Visual ── */}
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
          <p>Human Resources Management System</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
