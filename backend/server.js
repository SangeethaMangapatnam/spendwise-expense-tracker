require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());

// =====================================================
// MYSQL CONNECTION
// =====================================================

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
});

// =====================================================
// CONNECT TO MYSQL
// =====================================================

db.connect((error) => {
  if (error) {
    console.log("MySQL connection failed ❌");
    console.log(error.message);
    return;
  }

  console.log("MySQL connected successfully ✅");
});

// =====================================================
// JWT SECRET
// =====================================================

const JWT_SECRET =
  process.env.JWT_SECRET || "spendwise_secret_key";

// =====================================================
// TEST ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.json({
    message: "SpendWise Backend is running 🚀",
  });
});

// =====================================================
// REGISTER API
// =====================================================

app.post("/api/register", async (req, res) => {
  const {
    username,
    email,
    password,
  } = req.body;

  // Check all fields
  if (!username || !email || !password) {
    return res.status(400).json({
      message:
        "Please provide username, email and password",
    });
  }

  // Check password length
  if (password.length < 6) {
    return res.status(400).json({
      message:
        "Password must be at least 6 characters",
    });
  }

  try {
    // Check whether username or email already exists
    const checkSql =
      "SELECT id FROM users WHERE username = ? OR email = ?";

    db.query(
      checkSql,
      [username, email],
      async (error, results) => {
        if (error) {
          console.log(error);

          return res.status(500).json({
            message:
              "Database error while checking user",
          });
        }

        if (results.length > 0) {
          return res.status(409).json({
            message:
              "Username or email already exists",
          });
        }

        // Hash password
        const hashedPassword =
          await bcrypt.hash(password, 10);

        // Insert user
        const insertSql =
          "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";

        db.query(
          insertSql,
          [
            username,
            email,
            hashedPassword,
          ],
          (error, result) => {
            if (error) {
              console.log(error);

              return res.status(500).json({
                message:
                  "Failed to create account",
              });
            }

            res.status(201).json({
              message:
                "Account created successfully ✅",
              userId: result.insertId,
            });
          }
        );
      }
    );
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message:
        "Something went wrong",
    });
  }
});

// =====================================================
// LOGIN API
// =====================================================

app.post("/api/login", (req, res) => {
  const {
    email,
    password,
  } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message:
        "Please provide email and password",
    });
  }

  const sql =
    "SELECT * FROM users WHERE email = ?";

  db.query(
    sql,
    [email],
    async (error, results) => {
      if (error) {
        console.log(error);

        return res.status(500).json({
          message:
            "Database error",
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          message:
            "Invalid email or password",
        });
      }

      const user = results[0];

      // Compare password
      const passwordMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!passwordMatch) {
        return res.status(401).json({
          message:
            "Invalid email or password",
        });
      }

      // Create JWT token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      res.json({
        message:
          "Login successful ✅",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    }
  );
});

// =====================================================
// AUTHENTICATION MIDDLEWARE
// =====================================================

const authenticateToken = (
  req,
  res,
  next
) => {
  const authHeader =
    req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message:
        "Authentication required",
    });
  }

  const token =
    authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message:
        "Invalid authentication token",
    });
  }

  try {
    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      );

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(403).json({
      message:
        "Invalid or expired token",
    });
  }
};

// =====================================================
// ADD EXPENSE API
// =====================================================

app.post(
  "/api/expenses",
  authenticateToken,
  (req, res) => {
    const {
      title,
      amount,
      category,
      expense_date,
    } = req.body;

    if (
      !title ||
      !amount ||
      !category ||
      !expense_date
    ) {
      return res.status(400).json({
        message:
          "Please provide all expense details",
      });
    }

    const sql =
      "INSERT INTO expenses (title, amount, category, expense_date, user_id) VALUES (?, ?, ?, ?, ?)";

    db.query(
      sql,
      [
        title,
        amount,
        category,
        expense_date,
        req.user.id,
      ],
      (error, result) => {
        if (error) {
          console.log(error);

          return res.status(500).json({
            message:
              "Failed to add expense",
          });
        }

        res.status(201).json({
          message:
            "Expense added successfully ✅",
          expenseId:
            result.insertId,
        });
      }
    );
  }
);

// =====================================================
// GET USER EXPENSES API
// =====================================================

app.get(
  "/api/expenses",
  authenticateToken,
  (req, res) => {
    const sql =
      "SELECT * FROM expenses WHERE user_id = ? ORDER BY expense_date DESC, id DESC";

    db.query(
      sql,
      [req.user.id],
      (error, results) => {
        if (error) {
          console.log(error);

          return res.status(500).json({
            message:
              "Failed to fetch expenses",
          });
        }

        res.json(results);
      }
    );
  }
);

// =====================================================
// DELETE USER EXPENSE API
// =====================================================

app.delete(
  "/api/expenses/:id",
  authenticateToken,
  (req, res) => {
    const { id } = req.params;

    const sql =
      "DELETE FROM expenses WHERE id = ? AND user_id = ?";

    db.query(
      sql,
      [id, req.user.id],
      (error, result) => {
        if (error) {
          console.log(error);

          return res.status(500).json({
            message:
              "Failed to delete expense",
          });
        }

        if (
          result.affectedRows === 0
        ) {
          return res.status(404).json({
            message:
              "Expense not found",
          });
        }

        res.json({
          message:
            "Expense deleted successfully ✅",
        });
      }
    );
  }
);

// =====================================================
// START SERVER
// =====================================================

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});