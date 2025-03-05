// components/AuthForm.js
import { useState } from "react";
import { signUp, login } from "../firebase/firebaseAuth";
import styles from "./AuthForm.module.css";
import Link from "next/link"; // Import Next.js Link for navigation
import { useRouter } from "next/router"; // Import useRouter for redirection

const AuthForm = ({ isSignUp = true }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const router = useRouter(); // Initialize useRouter for redirection

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const user = isSignUp
        ? await signUp(email, password)
        : await login(email, password);

      setSuccessMessage(isSignUp ? "Sign-up successful!" : "Sign-in successful!");
      console.log("User:", user);

      // Redirect to dashboard on successful sign-in
      if (!isSignUp) {
        router.push("/dashboard"); // Redirect to dashboard
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{isSignUp ? "Sign Up" : "Sign In"}</h2>

      {/* Display error or success messages */}
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}
      {successMessage && <p className={styles.success}>{successMessage}</p>}

      {/* Form for email and password */}
      <form onSubmit={handleFormSubmit} className={styles.form}>
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
        <button type="submit" className={styles.button}>
          {isSignUp ? "Sign Up" : "Sign In"}
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
