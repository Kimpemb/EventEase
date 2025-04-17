// components/AuthForm.js
import { useState, useEffect } from "react";
import { signUp, login } from "../firebase/firebaseAuth";
import styles from "./AuthForm.module.css";
import Link from "next/link";
import { useRouter } from "next/router";

const AuthForm = ({ isSignUp = true }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setUsername("");
    setEmail("");
    setPassword("");
    setError("");
    setSuccess("");
  }, [isSignUp]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      let user;
      if (isSignUp) {
        user = await signUp(email, password, username);
        setSuccess("Sign-up successful! Check your email for verification.");
      } else {
        user = await login(email, password);
        setSuccess("Login successful!");
        await router.push("/dashboard");
      }
    } catch (err) {
      const friendly = err.message || "An unexpected error occurred.";
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{isSignUp ? "Sign Up" : "Sign In"}</h2>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      <form onSubmit={handleSubmit} className={styles.form}>
        {isSignUp && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={styles.input}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
          required
        />
        <button type="submit" className={styles.button} disabled={loading}>
          {loading
            ? isSignUp
              ? "Signing Up..."
              : "Signing In..."
            : isSignUp
            ? "Sign Up"
            : "Sign In"}
        </button>
      </form>

      <p className={styles.switchText}>
        {isSignUp ? "Already have an account? " : "Don't have an account? "}
        <Link href={isSignUp ? "/signin" : "/signup"}>
          <span className={styles.switchLink}>
            {isSignUp ? "Sign In" : "Sign Up"}
          </span>
        </Link>
      </p>
    </div>
  );
};

export default AuthForm;
