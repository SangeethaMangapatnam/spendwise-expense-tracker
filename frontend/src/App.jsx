import { useEffect, useMemo, useState } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import "./App.css";
import Authentication from "./Authentication";

const API_URL = "http://localhost:5000/api/expenses";

// =====================================================
// CATEGORY COLORS
// =====================================================

const categoryColors = {
  Food: "#4f46e5",
  Shopping: "#8b5cf6",
  Transport: "#06b6d4",
  Recharge: "#10b981",
  Bills: "#f59e0b",
  Other: "#ef4444",
};

// =====================================================
// EXPENSE SUGGESTIONS
// =====================================================

const expenseSuggestions = [
  { name: "Snacks", category: "Food" },
  { name: "Breakfast", category: "Food" },
  { name: "Lunch", category: "Food" },
  { name: "Dinner", category: "Food" },
  { name: "Coffee", category: "Food" },
  { name: "Tea", category: "Food" },
  { name: "Restaurant", category: "Food" },
  { name: "Groceries", category: "Food" },

  { name: "Sunscreen", category: "Shopping" },
  { name: "Shirt", category: "Shopping" },
  { name: "Shoes", category: "Shopping" },
  { name: "Clothes", category: "Shopping" },
  { name: "Bag", category: "Shopping" },
  { name: "Watch", category: "Shopping" },

  { name: "Mobile Recharge", category: "Recharge" },
  { name: "Internet Recharge", category: "Recharge" },

  { name: "Electricity Bill", category: "Bills" },
  { name: "Water Bill", category: "Bills" },
  { name: "Rent", category: "Bills" },

  { name: "Bus", category: "Transport" },
  { name: "Auto", category: "Transport" },
  { name: "Cab", category: "Transport" },
  { name: "Petrol", category: "Transport" },
];

// =====================================================
// LOCAL DATE
// =====================================================

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// =====================================================
// APP
// =====================================================

function App() {
  const [expenses, setExpenses] = useState([]);

  // =====================================================
  // AUTH STATE
  // =====================================================

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("spendwise_user");

    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("spendwise_token") || "";
  });

  // =====================================================
  // UI STATE
  // =====================================================

  const [showForm, setShowForm] = useState(false);

  const [currentPage, setCurrentPage] = useState("dashboard");

  const [loading, setLoading] = useState(true);

  // =====================================================
  // FORM STATE
  // =====================================================

  const [title, setTitle] = useState("");

  const [amount, setAmount] = useState("");

  const [category, setCategory] = useState("Food");

  const [date, setDate] = useState(getLocalDateString());

  const [showSuggestions, setShowSuggestions] = useState(false);

  // =====================================================
  // SEARCH / FILTER
  // =====================================================

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("All");

  // =====================================================
  // FETCH EXPENSES
  // =====================================================

  const fetchExpenses = async () => {
    if (!token) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch expenses"
        );
      }

      setExpenses(data);
    } catch (error) {
      console.error("Error fetching expenses:", error);

      if (
        error.message.toLowerCase().includes("token") ||
        error.message.toLowerCase().includes("authorization")
      ) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [token]);

  // =====================================================
  // ADD EXPENSE
  // =====================================================

  const handleAddExpense = async (e) => {
    e.preventDefault();

    if (
      !title.trim() ||
      !amount ||
      !category ||
      !date
    ) {
      alert("Please fill all fields");
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          title: title.trim(),
          amount: Number(amount),
          category,
          expense_date: date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to add expense");
        return;
      }

      alert("Expense added successfully ✅");

      setTitle("");
      setAmount("");
      setCategory("Food");
      setDate(getLocalDateString());

      setShowSuggestions(false);
      setShowForm(false);

      fetchExpenses();
    } catch (error) {
      console.error(error);

      alert("Could not connect to backend ❌");
    }
  };

  // =====================================================
  // DELETE EXPENSE
  // =====================================================

  const handleDeleteExpense = async (expenseId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const id = Number(expenseId);

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to delete expense");
        return;
      }

      alert("Expense deleted successfully ✅");

      setExpenses((currentExpenses) =>
        currentExpenses.filter(
          (expense) => Number(expense.id) !== id
        )
      );
    } catch (error) {
      console.error("Delete error:", error);

      alert("Could not connect to backend ❌");
    }
  };

  // =====================================================
  // EXPENSE SUGGESTIONS
  // =====================================================

  const filteredSuggestions = useMemo(() => {
    const search = title.trim().toLowerCase();

    if (!search) {
      return [];
    }

    const predefined = expenseSuggestions.filter((item) =>
      item.name.toLowerCase().startsWith(search)
    );

    const previousExpenses = expenses
      .filter((expense) =>
        expense.title.toLowerCase().startsWith(search)
      )
      .map((expense) => ({
        name: expense.title,
        category: expense.category,
      }));

    const combined = [
      ...predefined,
      ...previousExpenses,
    ];

    const unique = [];
    const names = new Set();

    combined.forEach((item) => {
      const key = item.name.toLowerCase();

      if (!names.has(key)) {
        names.add(key);
        unique.push(item);
      }
    });

    return unique.slice(0, 8);
  }, [title, expenses]);

  // =====================================================
  // SELECT SUGGESTION
  // =====================================================

  const handleSelectSuggestion = (suggestion) => {
    setTitle(suggestion.name);
    setCategory(suggestion.category);
    setShowSuggestions(false);
  };

  // =====================================================
  // DATE HELPERS
  // =====================================================

  const today = new Date();

  const getExpenseDate = (expense) => {
    const rawDate = String(expense.expense_date);

    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      const [year, month, day] = rawDate
        .split("-")
        .map(Number);

      return new Date(year, month - 1, day);
    }

    const parsedDate = new Date(rawDate);

    return new Date(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate()
    );
  };

  // =====================================================
  // DATE FILTERS
  // =====================================================

  const isToday = (expense) => {
    const expenseDate = getExpenseDate(expense);

    return (
      expenseDate.getFullYear() === today.getFullYear() &&
      expenseDate.getMonth() === today.getMonth() &&
      expenseDate.getDate() === today.getDate()
    );
  };

  const isThisWeek = (expense) => {
    const expenseDate = getExpenseDate(expense);

    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const sevenDaysAgo = new Date(startOfToday);

    sevenDaysAgo.setDate(
      startOfToday.getDate() - 6
    );

    return (
      expenseDate >= sevenDaysAgo &&
      expenseDate <= startOfToday
    );
  };

  const isThisMonth = (expense) => {
    const expenseDate = getExpenseDate(expense);

    return (
      expenseDate.getFullYear() === today.getFullYear() &&
      expenseDate.getMonth() === today.getMonth()
    );
  };

  const isThisYear = (expense) => {
    const expenseDate = getExpenseDate(expense);

    return (
      expenseDate.getFullYear() === today.getFullYear()
    );
  };

  // =====================================================
  // TOTAL
  // =====================================================

  const total = (list) =>
    list.reduce(
      (sum, expense) =>
        sum + Number(expense.amount),
      0
    );

  const todayTotal = total(
    expenses.filter(isToday)
  );

  const weekTotal = total(
    expenses.filter(isThisWeek)
  );

  const monthTotal = total(
    expenses.filter(isThisMonth)
  );

  const yearTotal = total(
    expenses.filter(isThisYear)
  );

  // =====================================================
  // CATEGORY DATA
  // =====================================================

  const categoryData = useMemo(() => {
    const map = {};

    expenses.forEach((expense) => {
      if (!map[expense.category]) {
        map[expense.category] = 0;
      }

      map[expense.category] += Number(
        expense.amount
      );
    });

    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  // =====================================================
  // WEEKLY DATA
  // =====================================================

  const weeklyData = useMemo(() => {
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();

      date.setHours(0, 0, 0, 0);

      date.setDate(today.getDate() - i);

      const dateString =
        getLocalDateString(date);

      const amountForDay = expenses
        .filter((expense) => {
          const expenseDate =
            getExpenseDate(expense);

          return (
            getLocalDateString(expenseDate) ===
            dateString
          );
        })
        .reduce(
          (sum, expense) =>
            sum + Number(expense.amount),
          0
        );

      data.push({
        day: date.toLocaleDateString(
          "en-US",
          {
            weekday: "short",
          }
        ),

        amount: amountForDay,
      });
    }

    return data;
  }, [expenses]);

  // =====================================================
  // FILTERED EXPENSES
  // =====================================================

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((expense) => {
        const matchesSearch =
          expense.title
            .toLowerCase()
            .includes(
              searchTerm.toLowerCase()
            );

        const matchesCategory =
          selectedCategory === "All" ||
          expense.category === selectedCategory;

        return (
          matchesSearch &&
          matchesCategory
        );
      })
      .sort(
        (a, b) =>
          getExpenseDate(b) -
          getExpenseDate(a)
      );
  }, [
    expenses,
    searchTerm,
    selectedCategory,
  ]);

  // =====================================================
  // ICON
  // =====================================================

  const getExpenseIcon = (category) => {
    if (category === "Food") {
      return "🍔";
    }

    if (category === "Shopping") {
      return "🛍️";
    }

    if (category === "Transport") {
      return "🚗";
    }

    if (category === "Recharge") {
      return "📱";
    }

    if (category === "Bills") {
      return "📄";
    }

    return "💰";
  };

  // =====================================================
  // AUTHENTICATION
  // =====================================================

  const handleLogin = (loggedInUser) => {
    const savedToken =
      localStorage.getItem(
        "spendwise_token"
      ) || "";

    setUser(loggedInUser);
    setToken(savedToken);
  };

  const handleLogout = () => {
    localStorage.removeItem(
      "spendwise_token"
    );

    localStorage.removeItem(
      "spendwise_user"
    );

    setToken("");
    setUser(null);
    setExpenses([]);
    setCurrentPage("dashboard");
  };

  // =====================================================
  // QUICK STATS
  // =====================================================

  const averageExpense =
    expenses.length > 0
      ? Math.round(
          total(expenses) /
            expenses.length
        )
      : 0;

  const topCategory =
    categoryData.length > 0
      ? categoryData[0].name
      : "No data";

  // =====================================================
  // DASHBOARD
  // =====================================================

  const Dashboard = (
    <>
      <header className="topbar">
        <div>
          <p className="welcome">
            PERSONAL FINANCE
          </p>

          <h1>
            Good evening, {user?.username} 👋
          </h1>

          <p>
            Here's your spending overview for today.
          </p>
        </div>

        <button
          className="add-button"
          onClick={() =>
            setShowForm(true)
          }
        >
          + Add Expense
        </button>
      </header>

      {/* =====================================================
          SUMMARY CARDS
          ===================================================== */}

      <section className="summary-grid">

        <div className="summary-card">
          <div className="card-top">
            <span>
              Today's Spending
            </span>

            <div className="card-icon blue">
              ₹
            </div>
          </div>

          <h2>
            ₹
            {todayTotal.toLocaleString(
              "en-IN"
            )}
          </h2>

          <p>
            Today's expenses
          </p>
        </div>

        <div className="summary-card">
          <div className="card-top">
            <span>
              This Week
            </span>

            <div className="card-icon purple">
              ↗
            </div>
          </div>

          <h2>
            ₹
            {weekTotal.toLocaleString(
              "en-IN"
            )}
          </h2>

          <p>
            Last 7 days
          </p>
        </div>

        <div className="summary-card">
          <div className="card-top">
            <span>
              This Month
            </span>

            <div className="card-icon green">
              ₹
            </div>
          </div>

          <h2>
            ₹
            {monthTotal.toLocaleString(
              "en-IN"
            )}
          </h2>

          <p>
            {today.toLocaleDateString(
              "en-US",
              {
                month: "long",
                year: "numeric",
              }
            )}
          </p>
        </div>

        <div className="summary-card">
          <div className="card-top">
            <span>
              This Year
            </span>

            <div className="card-icon orange">
              ▣
            </div>
          </div>

          <h2>
            ₹
            {yearTotal.toLocaleString(
              "en-IN"
            )}
          </h2>

          <p>
            {today.getFullYear()} spending
          </p>
        </div>

      </section>

      {/* =====================================================
          QUICK STATS
          ===================================================== */}

      <section className="quick-stats">

        <div className="quick-stat-card">

          <div className="quick-stat-icon">
            #
          </div>

          <div>
            <p>
              Total Transactions
            </p>

            <h3>
              {expenses.length}
            </h3>

            <span>
              All recorded expenses
            </span>
          </div>

        </div>


        <div className="quick-stat-card">

          <div className="quick-stat-icon">
            ₹
          </div>

          <div>
            <p>
              Average Expense
            </p>

            <h3>
              ₹
              {averageExpense.toLocaleString(
                "en-IN"
              )}
            </h3>

            <span>
              Average per transaction
            </span>
          </div>

        </div>


        <div className="quick-stat-card">

          <div className="quick-stat-icon">
            ★
          </div>

          <div>
            <p>
              Top Category
            </p>

            <h3>
              {topCategory}
            </h3>

            <span>
              Highest spending category
            </span>
          </div>

        </div>

      </section>

      {/* =====================================================
          CHARTS
          ===================================================== */}

      <section className="analytics-grid">

        {/* WEEKLY CHART */}

        <div className="chart-card large">

          <div className="section-heading">

            <div>
              <h3>
                Spending Overview
              </h3>

              <p>
                Your spending over the last 7 days
              </p>
            </div>

            <span className="chart-period">
              Last 7 Days
            </span>

          </div>

          <div className="chart-container">

            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <BarChart
                data={weeklyData}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="day"
                />

                <YAxis />

                <Tooltip
                  formatter={(value) => [
                    `₹${value}`,
                    "Spending",
                  ]}
                />

                <Bar
                  dataKey="amount"
                  fill="#4f46e5"
                  radius={[
                    8,
                    8,
                    0,
                    0,
                  ]}
                />

              </BarChart>
            </ResponsiveContainer>

          </div>

        </div>


        {/* CATEGORY CHART */}

        <div className="chart-card">

          <div className="section-heading">

            <div>
              <h3>
                Categories
              </h3>

              <p>
                Where your money goes
              </p>
            </div>

          </div>

          {categoryData.length > 0 ? (
            <>
              <div className="pie-container">

                <ResponsiveContainer
                  width="100%"
                  height={220}
                >
                  <PieChart>

                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >

                      {categoryData.map(
                        (entry, index) => (
                          <Cell
                            key={index}
                            fill={
                              categoryColors[
                                entry.name
                              ] || "#64748b"
                            }
                          />
                        )
                      )}

                    </Pie>

                    <Tooltip
                      formatter={(value) =>
                        `₹${value}`
                      }
                    />

                  </PieChart>
                </ResponsiveContainer>

              </div>

              <div className="category-list">

                {categoryData.map(
                  (item) => (
                    <div
                      className="category-item"
                      key={item.name}
                    >

                      <span>
                        <i
                          style={{
                            background:
                              categoryColors[
                                item.name
                              ] ||
                              "#64748b",
                          }}
                        ></i>

                        {item.name}
                      </span>

                      <strong>
                        ₹
                        {item.value.toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                    </div>
                  )
                )}

              </div>
            </>
          ) : (
            <div className="empty-chart">

              <div>
                ₹
              </div>

              <p>
                No expenses yet
              </p>

              <small>
                Add an expense to see categories.
              </small>

            </div>
          )}

        </div>

      </section>

      {/* =====================================================
          RECENT TRANSACTIONS
          ===================================================== */}

      <section className="transactions-card">

        <div className="section-heading">

          <div>
            <h3>
              Recent Transactions
            </h3>

            <p>
              Your latest expenses
            </p>
          </div>

          <button
            className="view-all"
            onClick={() =>
              setCurrentPage("expenses")
            }
          >
            View All →
          </button>

        </div>


        {loading ? (
          <div className="empty-state">
            Loading expenses...
          </div>
        ) : expenses.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              ₹
            </div>

            <h3>
              No expenses yet
            </h3>

            <p>
              Add your first expense to start
              tracking your spending.
            </p>

            <button
              className="add-button"
              onClick={() =>
                setShowForm(true)
              }
            >
              + Add Expense
            </button>

          </div>

        ) : (

          <div className="transaction-list">

            {expenses
              .slice()
              .sort(
                (a, b) =>
                  getExpenseDate(b) -
                  getExpenseDate(a)
              )
              .slice(0, 5)
              .map((expense) => (

                <div
                  className="transaction"
                  key={expense.id}
                >

                  <div className="transaction-left">

                    <div className="transaction-icon">
                      {getExpenseIcon(
                        expense.category
                      )}
                    </div>

                    <div>

                      <strong>
                        {expense.title}
                      </strong>

                      <span>
                        {expense.category}
                        {" • "}
                        {getLocalDateString(
                          getExpenseDate(
                            expense
                          )
                        )}
                      </span>

                    </div>

                  </div>

                  <strong className="transaction-amount">
                    - ₹
                    {Number(
                      expense.amount
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </strong>

                </div>

              ))}

          </div>

        )}

      </section>
    </>
  );

  // =====================================================
  // EXPENSES PAGE
  // =====================================================

  const expensesPageContent = (
    <>
      <header className="topbar">

        <div>

          <p className="welcome">
            PERSONAL FINANCE
          </p>

          <h1>
            Expenses
          </h1>

          <p>
            Manage and track all your spending.
          </p>

        </div>

        <button
          className="add-button"
          onClick={() =>
            setShowForm(true)
          }
        >
          + Add Expense
        </button>

      </header>


      {/* SUMMARY */}

      <section className="summary-grid">

        <div className="summary-card">

          <div className="card-top">

            <span>
              Total Expenses
            </span>

            <div className="card-icon blue">
              ₹
            </div>

          </div>

          <h2>
            ₹
            {total(expenses).toLocaleString(
              "en-IN"
            )}
          </h2>

          <p>
            All recorded expenses
          </p>

        </div>


        <div className="summary-card">

          <div className="card-top">

            <span>
              Number of Expenses
            </span>

            <div className="card-icon purple">
              #
            </div>

          </div>

          <h2>
            {expenses.length}
          </h2>

          <p>
            Transactions recorded
          </p>

        </div>

      </section>


      {/* ALL EXPENSES */}

      <section className="transactions-card">

        <div className="section-heading">

          <div>

            <h3>
              All Expenses
            </h3>

            <p>
              Search and filter your transactions.
            </p>

          </div>

        </div>


        {/* SEARCH */}

        <div className="expense-filters">

          <input
            type="text"
            placeholder="🔍 Search expenses..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
          />


          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(
                e.target.value
              )
            }
          >

            <option value="All">
              All Categories
            </option>

            <option value="Food">
              Food
            </option>

            <option value="Shopping">
              Shopping
            </option>

            <option value="Transport">
              Transport
            </option>

            <option value="Recharge">
              Recharge
            </option>

            <option value="Bills">
              Bills
            </option>

            <option value="Other">
              Other
            </option>

          </select>

        </div>


        {/* TABLE */}

        {loading ? (

          <div className="empty-state">
            Loading expenses...
          </div>

        ) : filteredExpenses.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              🔍
            </div>

            <h3>
              No expenses found
            </h3>

            <p>
              Try changing your search or
              category filter.
            </p>

          </div>

        ) : (

          <div className="table-wrapper">

            <table>

              <thead>

                <tr>

                  <th>
                    Expense
                  </th>

                  <th>
                    Category
                  </th>

                  <th>
                    Date
                  </th>

                  <th className="amount-heading">
                    Amount
                  </th>

                  <th className="action-heading">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredExpenses.map(
                  (expense) => (

                    <tr
                      key={expense.id}
                    >

                      <td>

                        <div className="expense-name-cell">

                          <div className="transaction-icon">
                            {getExpenseIcon(
                              expense.category
                            )}
                          </div>

                          <strong>
                            {expense.title}
                          </strong>

                        </div>

                      </td>


                      <td>

                        <span
                          className={`category-badge category-${expense.category.toLowerCase()}`}
                        >
                          {expense.category}
                        </span>

                      </td>


                      <td>

                        {getLocalDateString(
                          getExpenseDate(
                            expense
                          )
                        )}

                      </td>


                      <td className="amount-cell">

                        ₹
                        {Number(
                          expense.amount
                        ).toLocaleString(
                          "en-IN"
                        )}

                      </td>


                      <td className="action-cell">

                        <button
                          className="delete-button"
                          onClick={() =>
                            handleDeleteExpense(
                              expense.id
                            )
                          }
                        >
                          🗑️ Delete
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>
    </>
  );

  // =====================================================
  // SIDEBAR
  // =====================================================

  const sidebar = (
    <aside className="sidebar">

      <div className="logo">

        <div className="logo-icon">
          ₹
        </div>

        <span>
          SpendWise
        </span>

      </div>


      <div className="sidebar-label">
        MENU
      </div>


      <nav>

        <button
          className={
            currentPage === "dashboard"
              ? "nav-item active"
              : "nav-item"
          }
          onClick={() =>
            setCurrentPage("dashboard")
          }
        >

          <span>
            ⌂
          </span>

          Dashboard

        </button>


        <button
          className={
            currentPage === "expenses"
              ? "nav-item active"
              : "nav-item"
          }
          onClick={() =>
            setCurrentPage("expenses")
          }
        >

          <span>
            ₹
          </span>

          Expenses

        </button>


        <button
          className="nav-item disabled-nav"
          type="button"
        >

          <span>
            ◔
          </span>

          Analytics

          <small>
            Soon
          </small>

        </button>


        <button
          className="nav-item disabled-nav"
          type="button"
        >

          <span>
            ⚙
          </span>

          Settings

          <small>
            Soon
          </small>

        </button>

      </nav>


      {/* SIDEBAR PROFILE */}

      <div className="sidebar-bottom">

        <div className="profile">

          <div className="avatar">

            {user?.username
              ?.charAt(0)
              .toUpperCase() || "U"}

          </div>


          <div>

            <strong>
              {user?.username}
            </strong>

            <small>
              {user?.email}
            </small>

          </div>

        </div>


        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          🚪 Logout
        </button>

      </div>

    </aside>
  );

  // =====================================================
  // ADD EXPENSE MODAL
  // =====================================================

  const modal = showForm ? (

    <div
      className="modal-overlay"
      onClick={() => {
        setShowSuggestions(false);
      }}
    >

      <div
        className="modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <div className="modal-header">

          <div>

            <p className="modal-kicker">
              NEW TRANSACTION
            </p>

            <h2>
              Add Expense
            </h2>

            <p>
              Track where your money goes.
            </p>

          </div>


          <button
            className="close-button"
            type="button"
            onClick={() => {
              setShowForm(false);
              setShowSuggestions(false);
            }}
          >
            ×
          </button>

        </div>


        <form
          onSubmit={handleAddExpense}
        >

          {/* EXPENSE NAME */}

          <label>
            Expense Name
          </label>


          <div className="suggestion-wrapper">

            <input
              type="text"
              placeholder="e.g. Snacks, Sunscreen, Recharge"
              value={title}
              onChange={(e) => {
                setTitle(
                  e.target.value
                );

                setShowSuggestions(
                  true
                );
              }}
              onFocus={() => {
                if (title.trim()) {
                  setShowSuggestions(
                    true
                  );
                }
              }}
              autoComplete="off"
            />


            {showSuggestions &&
              filteredSuggestions.length >
                0 && (

                <div className="suggestions">

                  {filteredSuggestions.map(
                    (
                      suggestion,
                      index
                    ) => (

                      <button
                        type="button"
                        key={`${suggestion.name}-${index}`}
                        onClick={() =>
                          handleSelectSuggestion(
                            suggestion
                          )
                        }
                      >

                        <span>
                          {getExpenseIcon(
                            suggestion.category
                          )}
                        </span>

                        <span>
                          {suggestion.name}
                        </span>

                      </button>

                    )
                  )}

                </div>

              )}

          </div>


          {/* AMOUNT */}

          <label>
            Amount
          </label>


          <div className="amount-input-wrapper">

            <span>
              ₹
            </span>

            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              min="1"
              onChange={(e) =>
                setAmount(
                  e.target.value
                )
              }
            />

          </div>


          {/* CATEGORY */}

          <label>
            Category
          </label>


          <select
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value
              )
            }
          >

            <option value="Food">
              Food
            </option>

            <option value="Shopping">
              Shopping
            </option>

            <option value="Transport">
              Transport
            </option>

            <option value="Recharge">
              Recharge
            </option>

            <option value="Bills">
              Bills
            </option>

            <option value="Other">
              Other
            </option>

          </select>


          {/* DATE */}

          <label>
            Date
          </label>


          <input
            type="date"
            value={date}
            onChange={(e) =>
              setDate(
                e.target.value
              )
            }
          />


          {/* SAVE */}

          <button
            type="submit"
            className="save-button"
          >
            Save Expense
          </button>

        </form>

      </div>

    </div>

  ) : null;

  // =====================================================
  // NOT LOGGED IN
  // =====================================================

  if (!token || !user) {
    return (
      <Authentication
        onLogin={handleLogin}
      />
    );
  }

  // =====================================================
  // FINAL RENDER
  // =====================================================

  return (

    <div className="app">

      {sidebar}


      <main className="main">

        {currentPage === "dashboard"
          ? Dashboard
          : expensesPageContent}

      </main>


      {modal}

    </div>

  );
}

export default App;