import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./App.module.css";
import Login from "./components/Login/Login";
import Profile from "./components/Profile/Profile";

export default function App() {
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  useEffect(() => {
    const savedAccessToken = localStorage.getItem("accessToken");
    const savedRefreshToken = localStorage.getItem("refreshToken");
    if (savedAccessToken) setAccessToken(savedAccessToken);
    if (savedRefreshToken) setRefreshToken(savedRefreshToken);
  }, []);

  const handleLogin = (newAccessToken, newRefreshToken) => {
    localStorage.setItem("accessToken", newAccessToken);
    localStorage.setItem("refreshToken", newRefreshToken);
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setAccessToken(null);
    setRefreshToken(null);
  };

  const updateAccessToken = (newAccessToken) => {
    localStorage.setItem("accessToken", newAccessToken);
    setAccessToken(newAccessToken);
  };

  return (
    <Router>
      <div className={styles.app}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route
            path="/profile"
            element={
              accessToken ? (
                <Profile 
                  accessToken={accessToken} 
                  refreshToken={refreshToken}
                  onLogout={handleLogout}
                  onTokenRefresh={updateAccessToken}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
        <ToastContainer position="top-center" autoClose={2500} />
      </div>
    </Router>
  );
}
