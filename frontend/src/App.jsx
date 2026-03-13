import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("login");
  const [token, setToken] = useState(() => localStorage.getItem("sf_token") || "");
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sf_user") || "null"); } catch { return null; }
  });

  useEffect(() => {
    if (token) localStorage.setItem("sf_token", token);
    else localStorage.removeItem("sf_token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("sf_user", JSON.stringify(user));
    else localStorage.removeItem("sf_user");
  }, [user]);

  useEffect(() => {
    if (token && user) setPage("home");
    else setPage("login");
  }, []);

  const handleLogin = (data) => {
    setToken(data.token);
    setUser(data.user);
    setPage("home");
  };

  const handleLogout = () => {
    setToken("");
    setUser(null);
    setPage("login");
  };

  const navigate = (p) => setPage(p);

  if (!token || !user) {
    return page === "register"
      ? <RegisterPage onLogin={handleLogin} onNavigate={navigate} />
      : <LoginPage onLogin={handleLogin} onNavigate={navigate} />;
  }

  return page === "profile"
    ? <ProfilePage user={user} token={token} onNavigate={navigate} onLogout={handleLogout} onUserUpdate={setUser} />
    : <HomePage user={user} token={token} onNavigate={navigate} onLogout={handleLogout} />;
}