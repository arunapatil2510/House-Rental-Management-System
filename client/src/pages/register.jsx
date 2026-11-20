import { useState } from "react";
import "./auth.css";

const API = "http://localhost:5000/api";

function Register({ onNavigate, onRegisterSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "tenant",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const updateForm = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Creating your account...");
    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setMessage("Registration successful! Please login.");
      setForm({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "tenant",
      });

      setTimeout(() => {
        setMessage("");
        if (onRegisterSuccess) {
          onRegisterSuccess();
        } else {
          onNavigate("login");
        }
      }, 1200);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button className="back-home" onClick={() => onNavigate("home")}>
          ← Back to Home
        </button>

        <a
          className="brand auth-brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("home");
          }}
        >
          RentEase<span>.</span>
        </a>

        <h2>Create Your Account</h2>
        <p className="auth-subtitle">Join RentEase and discover comfortable homes.</p>

        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input
            name="name"
            value={form.name}
            onChange={updateForm}
            placeholder="Enter your full name"
            required
          />

          <label>Phone Number</label>
          <input
            name="phone"
            value={form.phone}
            onChange={updateForm}
            placeholder="Enter phone number"
          />

          <label>Register As</label>
          <select name="role" value={form.role} onChange={updateForm}>
            <option value="tenant">Tenant (Looking for rent)</option>
            <option value="owner">Property Owner (Listing homes)</option>
            <option value="admin">Administrator</option>
          </select>

          <label>Email Address</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={updateForm}
            placeholder="Enter your email"
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={updateForm}
            placeholder="Enter your password"
            required
            minLength={6}
          />

          {message && <div className="auth-message">{message}</div>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?
          <button onClick={() => onNavigate("login")}>Login</button>
        </p>
      </div>
    </div>
  );
}

export default Register;
