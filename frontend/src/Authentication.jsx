import { useState } from "react";
import "./Authentication.css";

const API_URL = "http://localhost:5000/api";

function Authentication({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    if (!isLogin && !username) {
      alert("Please enter a username");
      return;
    }

    if (!isLogin && password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin
        ? `${API_URL}/login`
        : `${API_URL}/register`;

      const requestBody = isLogin
        ? {
            email,
            password,
          }
        : {
            username,
            email,
            password,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Something went wrong ❌");
        return;
      }

      // REGISTER SUCCESS
      if (!isLogin) {
        alert("Account created successfully ✅");

        setUsername("");
        setEmail("");
        setPassword("");
        setShowPassword(false);

        setIsLogin(true);

        return;
      }

      // LOGIN SUCCESS
      localStorage.setItem(
        "spendwise_token",
        data.token
      );

      localStorage.setItem(
        "spendwise_user",
        JSON.stringify(data.user)
      );

      if (onLogin) {
        onLogin(data.user);
      }

    } catch (error) {
      console.error("Authentication error:", error);

      alert(
        "Could not connect to SpendWise backend ❌"
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);

    setUsername("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
  };

  return (
    <div className="auth-page">

      {/* LEFT SIDE */}
      <div className="auth-left">

        <div className="auth-brand">

          <div className="brand-icon">
            ₹
          </div>

          <span>SpendWise</span>

        </div>

        <div className="auth-left-content">

          <h1>
            Take control of
            <span> your money.</span>
          </h1>

          <p>
            Track your expenses, understand your
            spending habits, and make smarter
            financial decisions.
          </p>

          <div className="auth-features">

            <div className="feature">
              <div className="feature-icon">✓</div>

              <div>
                <strong>Track Every Expense</strong>
                <p>
                  Keep all your spending organized
                  in one place.
                </p>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">↗</div>

              <div>
                <strong>Understand Your Spending</strong>
                <p>
                  See where your money goes with
                  powerful analytics.
                </p>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">₹</div>

              <div>
                <strong>Build Better Habits</strong>
                <p>
                  Make informed decisions about
                  your financial future.
                </p>
              </div>
            </div>

          </div>

        </div>

        <div className="auth-footer">
          © 2026 SpendWise. Manage money wisely.
        </div>

      </div>


      {/* RIGHT SIDE */}
      <div className="auth-right">

        <div className="auth-card">

          {/* MOBILE LOGO */}
          <div className="mobile-brand">

            <div className="brand-icon">
              ₹
            </div>

            <span>SpendWise</span>

          </div>


          {/* HEADER */}
          <div className="auth-header">

            <h2>
              {isLogin
                ? "Welcome back"
                : "Create your account"}
            </h2>

            <p>
              {isLogin
                ? "Enter your details to continue to SpendWise."
                : "Start your journey toward smarter spending."}
            </p>

          </div>


          {/* MODE SWITCH */}
          <div className="auth-tabs">

            <button
              type="button"
              className={isLogin ? "active" : ""}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>

            <button
              type="button"
              className={!isLogin ? "active" : ""}
              onClick={() => setIsLogin(false)}
            >
              Create Account
            </button>

          </div>


          {/* FORM */}
          <form onSubmit={handleSubmit}>

            {!isLogin && (
              <div className="input-group">

                <label>
                  Username
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    👤
                  </span>

                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value)
                    }
                  />

                </div>

              </div>
            )}


            <div className="input-group">

              <label>
                Email Address
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  ✉
                </span>

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />

              </div>

            </div>


            <div className="input-group">

              <label>
                Password
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

            </div>


            {/* LOGIN OPTIONS */}
            {isLogin && (
              <div className="login-options">

                <label className="remember-me">

                  <input
                    type="checkbox"
                  />

                  <span>
                    Remember me
                  </span>

                </label>

                <span className="forgot-password">
                  Forgot password?
                </span>

              </div>
            )}


            {/* SUBMIT */}
            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >

              {loading ? (
                <span>
                  Please wait...
                </span>
              ) : (
                <>
                  <span>
                    {isLogin
                      ? "Login to SpendWise"
                      : "Create My Account"}
                  </span>

                  <span className="button-arrow">
                    →
                  </span>
                </>
              )}

            </button>

          </form>


          {/* BOTTOM */}
          <div className="auth-switch">

            <span>
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}
            </span>

            <button
              type="button"
              onClick={switchMode}
            >
              {isLogin
                ? "Create Account"
                : "Login"}
            </button>

          </div>


          <div className="security-note">

            <span>🔒</span>

            <span>
              Your financial data is protected
              with secure authentication.
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Authentication;