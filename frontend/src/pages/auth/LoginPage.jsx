import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Check, CircleUserRound, LockKeyhole, Mail } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import arkLogo from "../../assets/ark-logo.svg";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === "admin" ? "/admin/dashboard" : "/employee/dashboard", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      const user = await login(form.email, form.password);
      navigate(user.role === "admin" ? "/admin/dashboard" : "/employee/dashboard", { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wave-page">
      <section className="auth-wave-hero">
        <div className="auth-wave-nav">
          <div className="auth-wave-brand">
            <img src={arkLogo} alt="ArK" />
            <strong>ArK</strong>
          </div>
        </div>
        <div className="auth-wave-copy">
          <h1>Welcome!</h1>
          <p>Use your company credentials to access your workspace.</p>
        </div>
      </section>
      <section className="auth-wave-bottom" />

      <form className="auth-wave-card" onSubmit={onSubmit}>
        <div className="auth-wave-logo">
          <img src={arkLogo} alt="ArK" />
          <h2>ArK</h2>
        </div>

        <div className="auth-wave-title">
          <CircleUserRound size={16} />
          <strong>Sign in</strong>
        </div>

        <label htmlFor="email">Email</label>
        <div className="auth-input-wrap">
          <Mail size={14} />
          <input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
        </div>

        <label htmlFor="password">Password</label>
        <div className="auth-input-wrap">
          <LockKeyhole size={14} />
          <input
            id="password"
            type="password"
            placeholder="Enter password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
        </div>

        <label className="switch-row">
          <button
            className={`switch-btn ${remember ? "on" : ""}`}
            type="button"
            onClick={() => setRemember((prev) => !prev)}
            aria-label="Remember me"
          >
            {remember ? <Check size={11} /> : null}
          </button>
          Remember me
        </label>

        <button className="btn btn-primary auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
