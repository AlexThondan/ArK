import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Apple, Chrome, Facebook, Instagram, Twitter } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import arkLogo from "../../assets/ark-logo.svg";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remember, setRemember] = useState(true);

  const socialProviders = [
    { id: "google", label: "Google", icon: <Chrome size={16} />, url: "https://accounts.google.com" },
    { id: "facebook", label: "Facebook", icon: <Facebook size={16} />, url: "https://www.facebook.com/login" },
    { id: "instagram", label: "Instagram", icon: <Instagram size={16} />, url: "https://www.instagram.com/accounts/login" },
    { id: "x", label: "X.com", icon: <Twitter size={16} />, url: "https://x.com/i/flow/login" },
    { id: "apple", label: "Apple", icon: <Apple size={16} />, url: "https://appleid.apple.com/sign-in" }
  ];

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

  const onSocialClick = (url) => {
    window.location.href = url;
  };

  return (
    <div className="auth-ref-page">
      <section className="auth-ref-hero">
        <div className="auth-ref-copy">
          <img className="auth-ref-copy-logo" src={arkLogo} alt="ArK" />
          <h1>Welcome!</h1>
          <p>Use these awesome forms to login or create new account in your project for free.</p>
        </div>
      </section>
      <section className="auth-ref-bottom" />

      <form className="auth-ref-card" onSubmit={onSubmit}>
        <h3>Login with</h3>
        <div className="auth-ref-socials">
          {socialProviders.map((provider) => (
            <button
              key={provider.id}
              type="button"
              className={`auth-ref-social-btn ${provider.id}`}
              aria-label={provider.label}
              onClick={() => onSocialClick(provider.url)}
            >
              {provider.icon}
            </button>
          ))}
        </div>
        <p className="auth-ref-or">or</p>

        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          placeholder="Your full name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="Your email address"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          placeholder="Your password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          required
        />

        <label className="auth-ref-remember">
          <button
            className={`auth-ref-switch ${remember ? "on" : ""}`}
            type="button"
            onClick={() => setRemember((prev) => !prev)}
            aria-label="Remember me"
          >
            <span />
          </button>
          <span>Remember me</span>
        </label>

        <button className="auth-ref-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "SIGNING IN..." : "SIGN IN"}
        </button>

        <p className="auth-ref-footer">
          Already have an account? <span>Sign in</span>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
