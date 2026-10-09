let currentUser = null;
let editingExpenseId = null;
/* ===============================
   DATE STATE
   =============================== */

let selectedDate = new Date();
let calendarMonth = selectedDate.getMonth();
let calendarYear = selectedDate.getFullYear();

/* ===============================
   EXPENSE STATE
   =============================== */

let expenses = {};

/* ===============================
   DOM ELEMENTS
   =============================== */

const selectedDateButton = document.getElementById("selected-date");
const calendarDropdown = document.getElementById("calendar-dropdown");
const previousDayButton = document.getElementById("previous-day");
const nextDayButton = document.getElementById("next-day");
const expenseNameInput = document.getElementById("expense-name");
const expenseAmountInput = document.getElementById("expense-amount");
const addExpenseButton = document.getElementById("add-expense-button");
const expensesList = document.getElementById("expenses-list");

/* ===============================
   DATE HELPERS
   =============================== */

function formatFinanceDate(date) {
    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function updateSelectedDate() {
    const formattedDate = formatFinanceDate(selectedDate);

    selectedDateButton.innerHTML = `
        ${formattedDate}
        <span class="date-chevron">▾</span>
    `;

    const financeDate = document.getElementById("finance-date");

    if (financeDate) {
        financeDate.textContent = formattedDate;
    }
}

/* ===============================
   CALENDAR
   =============================== */

function renderCalendar() {
    calendarDropdown.innerHTML = "";

    const header = document.createElement("div");
    header.classList.add("calendar-header");

    const monthTitle = document.createElement("div");
    monthTitle.classList.add("calendar-month-title");

    monthTitle.textContent = new Date(
        calendarYear,
        calendarMonth,
        1
    ).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric"
    });

    const controls = document.createElement("div");
    controls.classList.add("calendar-month-controls");

    const previousMonth = document.createElement("button");
    previousMonth.type = "button";
    previousMonth.textContent = "‹";

    const nextMonth = document.createElement("button");
    nextMonth.type = "button";
    nextMonth.textContent = "›";

    previousMonth.addEventListener("click", () => {
        calendarMonth--;

        if (calendarMonth < 0) {
            calendarMonth = 11;
            calendarYear--;
        }

        renderCalendar();
    });

    nextMonth.addEventListener("click", () => {
        calendarMonth++;

        if (calendarMonth > 11) {
            calendarMonth = 0;
            calendarYear++;
        }

        renderCalendar();
    });

    controls.appendChild(previousMonth);
    controls.appendChild(nextMonth);

    header.appendChild(monthTitle);
    header.appendChild(controls);
    calendarDropdown.appendChild(header);

    const weekdays = document.createElement("div");
    weekdays.classList.add("calendar-weekdays");

    ["M", "T", "W", "T", "F", "S", "S"].forEach(day => {
        const element = document.createElement("div");
        element.textContent = day;
        weekdays.appendChild(element);
    });

    calendarDropdown.appendChild(weekdays);

    const daysGrid = document.createElement("div");
    daysGrid.classList.add("calendar-days");

    const firstDay = new Date(calendarYear, calendarMonth, 1);

    const daysInMonth = new Date(
        calendarYear,
        calendarMonth + 1,
        0
    ).getDate();

    let startingDay = firstDay.getDay();
    startingDay = startingDay === 0 ? 6 : startingDay - 1;

    for (let i = 0; i < startingDay; i++) {
        const empty = document.createElement("div");
        empty.classList.add("calendar-day", "empty");
        daysGrid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayButton = document.createElement("button");
        dayButton.type = "button";
        dayButton.classList.add("calendar-day");
        dayButton.textContent = day;

        const isSelected =
            day === selectedDate.getDate() &&
            calendarMonth === selectedDate.getMonth() &&
            calendarYear === selectedDate.getFullYear();

        if (isSelected) {
            dayButton.classList.add("selected");
        }

        dayButton.addEventListener("click", () => {
            selectedDate = new Date(
                calendarYear,
                calendarMonth,
                day
            );

            updateSelectedDate();
            renderCalendar();
            renderExpenses();

            calendarDropdown.classList.add("hidden");
        });

        daysGrid.appendChild(dayButton);
    }

    calendarDropdown.appendChild(daysGrid);
}

/* ===============================
   CALENDAR OPEN / CLOSE
   =============================== */

selectedDateButton.addEventListener("click", () => {
    calendarDropdown.classList.toggle("hidden");

    if (!calendarDropdown.classList.contains("hidden")) {
        calendarMonth = selectedDate.getMonth();
        calendarYear = selectedDate.getFullYear();
        renderCalendar();
    }
});

/* ===============================
   DAY NAVIGATION
   =============================== */

previousDayButton.addEventListener("click", () => {
    selectedDate.setDate(selectedDate.getDate() - 1);
    updateSelectedDate();
    renderExpenses();
});

nextDayButton.addEventListener("click", () => {
    selectedDate.setDate(selectedDate.getDate() + 1);
    updateSelectedDate();
    renderExpenses();
});

/* ===============================
   ADD EXPENSE
   =============================== */

addExpenseButton.addEventListener("click", async () => {
    const name = expenseNameInput.value.trim();
    const amount = Number(expenseAmountInput.value);

    if (!name) {
        expenseNameInput.focus();
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        expenseAmountInput.focus();
        return;
    }

    if (!currentUser) {
        alert("Please log in again.");
        return;
    }

    addExpenseButton.disabled = true;

    try {
        const dateKey = getDateKey(selectedDate);
        let data;
        let error;

        if (editingExpenseId) {
            // UPDATE the existing database row
            ({ data, error } = await window.supabaseClient
                .from("finance_expenses")
                .update({
                    name,
                    amount,
                    date: dateKey
                })
                .eq("id", editingExpenseId)
                .eq("user_id", currentUser.id)
                .select()
                .single());
        } else {
            // INSERT a new expense
            ({ data, error } = await window.supabaseClient
                .from("finance_expenses")
                .insert({
                    user_id: currentUser.id,
                    date: dateKey,
                    name,
                    amount
                })
                .select()
                .single());
        }

        if (error) {
            console.error("Error saving expense:", error);
            alert(`Could not save expense: ${error.message}`);
            return;
        }

        // Reload the database so dates and edits stay consistent
        expenses = await loadExpensesFromSupabase();

        editingExpenseId = null;
        expenseNameInput.value = "";
        expenseAmountInput.value = "";
        addExpenseButton.textContent = "Add Expense";

        renderExpenses();
    } catch (error) {
        console.error("Unexpected expense error:", error);
        alert("Something went wrong while saving.");
    } finally {
        addExpenseButton.disabled = false;
    }
});

/* ===============================
   RENDER EXPENSES
   =============================== */

function renderExpenses() {
    expensesList.innerHTML = "";

    const dateKey = getDateKey(selectedDate);
    const dayExpenses = expenses[dateKey] || [];

    if (dayExpenses.length === 0) {
        expensesList.innerHTML = `
            <div class="empty-expenses">
                No expenses recorded for this day.
            </div>
        `;

        updateDailyTotal(0);
        updateFinanceSummaries();
        renderMonthlySpendingChart();
        return;
    }

    let total = 0;

    dayExpenses.forEach((expense, index) => {
        total += expense.amount;

        const item = document.createElement("div");
        item.classList.add("expense-item");

        const nameElement = document.createElement("div");
        nameElement.classList.add("expense-item-name");
        nameElement.textContent = expense.name;

        const amountElement = document.createElement("div");
        amountElement.classList.add("expense-item-amount");
        amountElement.textContent =
            `₹${expense.amount.toLocaleString("en-IN")}`;

        const rightSection = document.createElement("div");
rightSection.classList.add("expense-item-right");

const menuButton = document.createElement("button");
menuButton.type = "button";
menuButton.classList.add("expense-menu-button");
menuButton.textContent = "⋯";
menuButton.setAttribute("aria-label", "Expense options");

rightSection.appendChild(amountElement);
rightSection.appendChild(menuButton);

item.appendChild(nameElement);
item.appendChild(rightSection);

menuButton.addEventListener("click", event => {
    event.stopPropagation();

    const rect = menuButton.getBoundingClientRect();

    showExpenseContextMenu(
        {
            preventDefault() {},
            clientX: rect.right,
            clientY: rect.bottom
        },
        index
    );
});

        item.addEventListener("contextmenu", event => {
            event.preventDefault();
            showExpenseContextMenu(event, index);
        });

        expensesList.appendChild(item);
    });

    updateDailyTotal(total);
    updateFinanceSummaries();
}

/* ===============================
   DAILY TOTAL
   =============================== */

function updateDailyTotal(total) {
    const totalElement = document.querySelector(".today-total");

    if (!totalElement) return;

    totalElement.textContent =
        `₹${total.toLocaleString("en-IN")}`;
}

/* ===============================
   EXPENSE CONTEXT MENU
   =============================== */

function showExpenseContextMenu(event, index) {
    const oldMenu = document.querySelector(".expense-context-menu");

    if (oldMenu) {
        oldMenu.remove();
    }

    const menu = document.createElement("div");
    menu.classList.add("expense-context-menu");

    menu.innerHTML = `
        <button type="button" class="edit-expense-option">
            Edit Expense
        </button>

        <button type="button" class="delete-expense-option">
            Delete Expense
        </button>
    `;

    menu.style.left = `${event.clientX}px`;
    menu.style.top = `${event.clientY}px`;

    document.body.appendChild(menu);

    menu.querySelector(".edit-expense-option").addEventListener("click", () => {
        editExpense(index);
        menu.remove();
    });

    menu.querySelector(".delete-expense-option").addEventListener("click", () => {
        deleteExpense(index);
        menu.remove();
    });
}

/* ===============================
   EDIT EXPENSE
   =============================== */

function editExpense(index) {
    const dateKey = getDateKey(selectedDate);
    const dayExpenses = expenses[dateKey];

    if (!dayExpenses || !dayExpenses[index]) return;

    const expense = dayExpenses[index];

    editingExpenseId = expense.id;
    expenseNameInput.value = expense.name;
    expenseAmountInput.value = expense.amount;
    addExpenseButton.textContent = "Save Changes";

    expenseNameInput.focus();
}   
/* ===============================
   DELETE EXPENSE
   =============================== */

async function deleteExpense(index) {
    const dateKey = getDateKey(selectedDate);
    const dayExpenses = expenses[dateKey];

    if (!dayExpenses || !dayExpenses[index]) return;

    const expense = dayExpenses[index];

    if (!confirm("Delete this expense?")) return;

    try {
        const { error } = await window.supabaseClient
            .from("finance_expenses")
            .delete()
            .eq("id", expense.id)
            .eq("user_id", currentUser.id);

        if (error) {
            console.error("Error deleting expense:", error);
            alert(`Could not delete the expense: ${error.message}`);
            return;
        }

        dayExpenses.splice(index, 1);

        if (dayExpenses.length === 0) {
            delete expenses[dateKey];
        }

        renderExpenses();
    } catch (error) {
        console.error("Unexpected error deleting expense:", error);
        alert("Something went wrong while deleting the expense.");
    }
}

/* ===============================
   LOAD EXPENSES FROM SUPABASE
   =============================== */

async function loadExpensesFromSupabase() {
    const { data, error } = await window.supabaseClient
        .from("finance_expenses")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("date", { ascending: true });

    if (error) {
        console.error("Error loading finance expenses:", error);
        alert(`Could not load expenses: ${error.message}`);
        return {};
    }

    const formattedExpenses = {};

    data.forEach(row => {
        if (!formattedExpenses[row.date]) {
            formattedExpenses[row.date] = [];
        }

        formattedExpenses[row.date].push({
            id: row.id,
            name: row.name,
            amount: Number(row.amount)
        });
    });

    return formattedExpenses;
}

/* ===============================
   INITIALIZE FINANCE
   =============================== */

async function initializeFinance() {
    if (!window.supabaseClient) {
        console.error("Supabase client is not initialized.");
        alert("Finance could not connect to Supabase.");
        return;
    }

    try {
        const { data, error } =
            await window.supabaseClient.auth.getUser();

        if (error) {
            console.error("Could not verify the logged-in user:", error);
            alert("Could not verify your login. Please log in again.");
            return;
        }

        currentUser = data.user;

        if (!currentUser) {
            alert("Please log in before using Finance.");
            window.location.href = "index.html";
            return;
        }

        expenses = await loadExpensesFromSupabase();

        updateSelectedDate();
        renderCalendar();
        renderExpenses();
    } catch (error) {
        console.error("Finance initialization failed:", error);
        alert("Finance could not load. Check the browser Console.");
    }
}
/* ===============================
   FINANCE SUMMARIES
   =============================== */

function updateFinanceSummaries() {
    const today = new Date();
    const todayKey = getDateKey(today);

    // Start of the current week: Monday
    const weekStart = new Date(today);
    const day = weekStart.getDay();

    weekStart.setDate(
        weekStart.getDate() - (day === 0 ? 6 : day - 1)
    );
    weekStart.setHours(0, 0, 0, 0);

    // Start of the current month
    const monthStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
    );

    let todayTotal = 0;
    let weekTotal = 0;
    let monthTotal = 0;

    for (const [dateKey, dayExpenses] of Object.entries(expenses)) {
        const expenseDate = new Date(`${dateKey}T00:00:00`);

        for (const expense of dayExpenses) {
            const amount = Number(expense.amount) || 0;

            if (dateKey === todayKey) {
                todayTotal += amount;
            }

            if (expenseDate >= weekStart && expenseDate <= today) {
                weekTotal += amount;
            }

            if (expenseDate >= monthStart && expenseDate <= today) {
                monthTotal += amount;
            }
        }
    }

    document.getElementById("summary-today").textContent =
        `₹${todayTotal.toLocaleString("en-IN")}`;

    document.getElementById("summary-week").textContent =
        `₹${weekTotal.toLocaleString("en-IN")}`;

    document.getElementById("summary-month").textContent =
        `₹${monthTotal.toLocaleString("en-IN")}`;
}

function renderMonthlySpendingChart() {
    const chart = document.getElementById("monthly-spending-chart");
    const totalElement = document.getElementById("monthly-chart-total");

    if (!chart || !totalElement) return;

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = getDateKey(selectedDate);

    const dailyTotals = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateKey = getDateKey(date);

        const dayExpenses = expenses[dateKey] || [];
        const total = dayExpenses.reduce(
            (sum, expense) => sum + Number(expense.amount || 0),
            0
        );

        dailyTotals.push(total);
    }

    const monthTotal = dailyTotals.reduce((sum, amount) => sum + amount, 0);

    totalElement.textContent = `₹${monthTotal.toLocaleString("en-IN")}`;

    const width = 700;
    const height = 250;
    const padding = { top: 20, right: 20, bottom: 35, left: 55 };

    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    const maxValue = Math.max(...dailyTotals, 1000);
    const roundedMax = Math.ceil(maxValue / 100) * 100 || 100;

    const points = dailyTotals.map((amount, index) => {
        const x = padding.left +
            (index / Math.max(daysInMonth - 1, 1)) * graphWidth;

        const y = padding.top +
            graphHeight - (amount / roundedMax) * graphHeight;

        return { x, y, amount, day: index + 1 };
    });

    
const linePath = points.reduce((path, point, index) => {
    if (index === 0) {
        return `M ${point.x} ${point.y}`;
    }

    const previous = points[index - 1];
    const midX = (previous.x + point.x) / 2;

    return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
}, "");


    const areaPath = `
        ${linePath}
        L ${points[points.length - 1].x} ${padding.top + graphHeight}
        L ${points[0].x} ${padding.top + graphHeight}
        Z
    `;

    let svg = "";

    // Horizontal grid lines and amount labels
    for (let i = 0; i <= 4; i++) {
        const value = roundedMax - (roundedMax / 4) * i;
        const y = padding.top + (graphHeight / 4) * i;

        svg += `
            <line
                x1="${padding.left}" y1="${y}"
                x2="${width - padding.right}" y2="${y}"
                stroke="#30364a" stroke-width="1"
                stroke-dasharray="4 5"
            />
            <text
                x="${padding.left - 10}" y="${y + 4}"
                fill="#929bb0" font-size="11"
                text-anchor="end"
            >${value >= 1000 ? (value / 1000) + "k" : Math.round(value)}</text>
        `;
    }

    // X-axis date labels
    const labelDays = [...new Set([
        1,
        5,
        10,
        15,
        20,
        25,
        daysInMonth
    ])].filter(day => day <= daysInMonth);

    labelDays.forEach(day => {
        const point = points[day - 1];

        svg += `
            <text
                x="${point.x}" y="${height - 8}"
                fill="#929bb0" font-size="11"
                text-anchor="middle"
            >${day}</text>
        `;
    });

    // Shaded area under the line
    
svg += `
    <defs>
        <linearGradient id="spending-area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#818cf8" stop-opacity="0.32" />
            <stop offset="100%" stop-color="#818cf8" stop-opacity="0.01" />
        </linearGradient>

        <filter id="spending-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
    </defs>

    <path
        d="${areaPath}"
        fill="url(#spending-area-gradient)"
    />

    <path
        d="${linePath}"
        class="spending-line"
        fill="none"
        stroke="#818cf8"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        filter="url(#spending-glow)"
    />
`;


    // Dots for days with spending
    points.forEach(point => {
        
svg += `
    <circle
        class="spending-node"
        cx="${point.x}"
        cy="${point.y}"
        r="2.5"
        fill="#a5b4fc"
        stroke="#141824"
        stroke-width="1"
    >
        <title>Day ${point.day}: ₹${point.amount.toLocaleString("en-IN")}</title>
    </circle>
`;
    });
    

    chart.innerHTML = svg;
}

initializeFinance();