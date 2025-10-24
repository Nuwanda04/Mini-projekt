import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./Login.module.css";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        onLogin(data.accessToken, data.refreshToken);
        toast.success("Login successful!");
        navigate("/profile");
      } else {
        toast.error(data.message || "Invalid login");
      }
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      toast.error("Something went wrong during login");
    } finally {
      setLoading(false);
    }
  };


  return (
    <form className={styles.login} onSubmit={handleSubmit}>
      <h2>Login</h2>


      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />


      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />


      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Log in"}{" "}
      </button>
    </form>
  );
}
