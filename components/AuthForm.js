import { useState, useEffect } from "react";
import { signUp, login } from "../firebase/firebaseAuth";
import styles from "./AuthForm.module.css";
import Link from "next/link";
import { useRouter } from "next/router";

const AuthForm = ({ isSignUp = true }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Reset fields when component mounts or form type changes
  useEffect(() => {
    setEmail("");
    setPassword("");
    setUsername("");
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [isSignUp]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up logic
        const user = await signUp(email, password, username);
        setSuccessMessage("Sign-up successful!");
        console.log("User:", user);
      } else {
        // Login logic
        const user = await login(email, password);
        setSuccessMessage("Sign-in successful!");
        console.log("User:", user);

        // Redirect to dashboard after successful login
        try {
          await router.push("/dashboard");
        } catch (error) {
          console.error("Redirect error:", error); // Log the error
          setErrorMessage("Failed to redirect. Please try again.");
        }
      }
    } catch (error) {
      // Handle Firebase authentication errors
      console.error("Error:", error); // Log the error
      let message = "An error occurred. Please try again.";
      switch (error.code) {
        case "auth/user-not-found":
          message = "User not found. Please sign up.";
          break;
        case "auth/wrong-password":
          message = "Incorrect password. Please try again.";
          break;
        case "auth/email-already-in-use":
          message = "Email already in use. Please sign in.";
          break;
        default:
          message = error.message; // Use the error message
      }
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{isSignUp ? "Sign Up" : "Sign In"}</h2>

      {/* Display error and success messages */}
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}
      {successMessage && <p className={styles.success}>{successMessage}</p>}

      {/* Form */}
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
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? (isSignUp ? "Signing Up..." : "Signing In...") : isSignUp ? "Sign Up" : "Sign In"}
        </button>
      </form>

      {/* Switch between Sign Up and Sign In */}
      <p className={styles.switchText}>
        {isSignUp ? "Already have an account? " : "Don't have an account? "}
        <Link href={isSignUp ? "/signin" : "/signup"}>
          <span className={styles.switchLink}>{isSignUp ? "Sign In" : "Sign Up"}</span>
        </Link>
      </p>
    </div>
  );
};

export default AuthForm;