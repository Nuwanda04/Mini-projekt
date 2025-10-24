import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./Profile.module.css";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function Profile({ accessToken, refreshToken, onLogout, onTokenRefresh }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (err) {
      console.error("Error during logout:", err);
    }

    onLogout();
    navigate("/login");
  }, [refreshToken, onLogout, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);

      try {
        const res = await fetch(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const data = await res.json();

        if (res.ok) {
          setProfile(data);
          toast.success("Profile loaded!");
        } else {
          // If token expired, try to refresh it
          if (res.status === 401 && refreshToken) {
            const refreshed = await tryRefreshToken();
            if (refreshed) {
              // Retry fetching profile with new token
              return;
            }
          }

          toast.error(data.message || "Server error");
          setProfile(null);
        }
      } catch (err) {
        console.error("Error in fetchProfile:", err);
        toast.error("Could not fetch profile.");
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    const tryRefreshToken = async () => {
      try {
        const res = await fetch(`${API_URL}/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        const data = await res.json();

        if (res.ok) {
          onTokenRefresh(data.accessToken);
          toast.info("Session refreshed!");
          return true;
        } else {
          toast.error("Session expired, please log in again");
          handleLogout();
          return false;
        }
      } catch (err) {
        console.error("Error refreshing token:", err);
        handleLogout();
        return false;
      }
    };

    if (accessToken) fetchProfile();
    else setLoading(false);
  }, [accessToken, refreshToken, onTokenRefresh, handleLogout]);

  if (loading) return <p className={styles.loading}>Loading profile...</p>;

  return (
    <div className={styles.profile}>
      <div className={styles.header}>
        <h2>User Profile</h2>
        <button onClick={handleLogout} className={styles.logoutBtn}>Log out</button>
      </div>

      {profile && (
        <div className={styles.content}>
          <div className={styles.userInfo}>
            <img
              src={profile.user.profilePicture}
              alt="Profile"
              className={styles.avatar}
            />
            <div className={styles.details}>
              <h3>Welcome back!</h3>
              <p className={styles.email}>{profile.user.email}</p>
              <p className={styles.userId}>User ID: {profile.user.userId}</p>
            </div>
          </div>

          <div className={styles.jwtSection}>
            <h4>JWT Token Data:</h4>
            <pre>{JSON.stringify(profile.user, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
