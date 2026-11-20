import { useState } from "react";
import "./App.css";

import Dashboard from "./pages/dashboard";
import Login from "./pages/login";
import Register from "./pages/register";
import UserDashboard from "./pages/user";
import AdminDashboard from "./pages/admin";

function App() {
  const [page, setPage] = useState("home"); // "home" | "login" | "register" | "user" | "admin"
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  const handleLoginSuccess = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    if (userData.role === "admin") {
      setPage("admin");
    } else {
      setPage("user");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken("");
    setPage("home");
  };

  const handleNavigate = (targetPage) => {
    if (targetPage === "user" || targetPage === "dashboard") {
      if (!user) {
        setPage("login");
        return;
      }
      if (user.role === "admin") {
        setPage("admin");
        return;
      }
      setPage("user");
      return;
    }

    if (targetPage === "admin") {
      if (!user || user.role !== "admin") {
        setPage("home");
        return;
      }
      setPage("admin");
      return;
    }

    setPage(targetPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {page === "login" && (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onNavigate={handleNavigate}
        />
      )}

      {page === "register" && (
        <Register
          onNavigate={handleNavigate}
          onRegisterSuccess={() => setPage("login")}
        />
      )}

      {page === "user" && (
        <UserDashboard
          user={user}
          token={token}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {page === "admin" && (
        <AdminDashboard
          user={user}
          token={token}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {page === "home" && (
        <Dashboard
          user={user}
          token={token}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}

export default App;
