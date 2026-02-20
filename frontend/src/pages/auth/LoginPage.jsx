import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useAuth from "../../hooks/useAuth";
import arkLogo from "../../assets/ark-logo.svg";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="auth-page split">
      <section className="auth-brand-panel">
        <div className="auth-brand-center">
          <img src={arkLogo} alt="ArK" />
          <h1>ArK</h1>
        </div>
      </section>
      <section className="auth-form-panel">
        <form className="auth-card" onSubmit={onSubmit}>
          <h2>Welcome back</h2>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />

          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>
      </section>
    </div>
  );
};

export default LoginPage;
