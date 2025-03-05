// components/AuthForm.js
import { useState } from "react";
import { signUp, login } from "../firebase/firebaseAuth";
import styles from "./AuthForm.module.css";
import Link from "next/link"; // Import Next.js Link for navigation
import { useRouter } from "next/router"; // Import useRouter for redirection

const AuthForm = ({ isSignUp = true }) => {
  const [username, setUsername] = useState(""); // State for username
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(false); // Loading state
  const router = useRouter(); // Initialize useRouter for redirection

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up with username, email, and password
        const user = await signUp(email, password, username); // Pass username to signUp
        setSuccessMessage("Sign-up successful!");
        console.log("User:", user);
      } else {
        // Log in with email and password
        const user = await login(email, password);
        setSuccessMessage("Sign-in successful!");
        console.log("User:", user);
        router.push("/dashboard"); // Redirect to dashboard on successful sign-in
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{isSignUp ? "Sign Up" : "Sign In"}</h2>

      {/* Display error or success messages */}
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}
      {successMessage && <p className={styles.success}>{successMessage}</p>}

      {/* Form for username, email, and password */}
      <form onSubmit={handleFormSubmit} className={styles.form}>
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
        <button
          type="submit"
          className={styles.button}
          disabled={loading} // Disable button while loading
        >
          {loading
            ? isSignUp
              ? "Signing Up..."
              : "Signing In..."
            : isSignUp
            ? "Sign Up"
            : "Sign In"}
        </button>
      </form>

      {/* Switch between Sign Up and Sign In */}
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