// ===============================
// PHYSICAL LIFE TRACKER
// Calendar + Monthly Goals
// + Daily Data + Daily Score
// ===============================


// ===============================
// DOM ELEMENTS
// ===============================
// ===============================
// TODAY TABS
// ===============================

const goalsTab =
    document.getElementById("goals-tab");

const dataTab =
    document.getElementById("data-tab");

const goalsView =
    document.getElementById("goals-view");

const dataView =
    document.getElementById("data-view");
const currentDateElement =
    document.getElementById("current-date");

const monthDisplay =
    document.getElementById("month-display");

const calendarMonthLabel =
    document.getElementById("calendar-month-label");

const todayLabel =
    document.getElementById("today-label");

const calendarGrid =
    document.getElementById("calendar-grid");

const previousMonthButton =
    document.getElementById("previous-month");

const nextMonthButton =
    document.getElementById("next-month");


// Goal modal
const addGoalButton =
    document.getElementById("add-goal-button");

const emptyAddGoalButton =
    document.getElementById("empty-add-goal");

const goalModal =
    document.getElementById("goal-modal");

const closeGoalModal =
    document.getElementById("close-goal-modal");

const cancelGoalButton =
    document.getElementById("cancel-goal");

const saveGoalButton =
    document.getElementById("save-goal");

const goalNameInput =
    document.getElementById("goal-name");

const goalTypeInput =
    document.getElementById("goal-type");

const goalUnitInput =
    document.getElementById("goal-unit");

const goalTargetInput =
    document.getElementById("goal-target");
const goalProgressMethodInput =
    document.getElementById(
        "goal-progress-method"
    );

// Goals
const goalsContainer =
    document.getElementById("goals-container");

const emptyGoals =
    document.getElementById("empty-goals");


// Daily Data
const metricsContainer =
    document.getElementById("metrics-container");


// Daily Score
const scoreValue =
    document.getElementById("score-value");

const scoreSubtext =
    document.getElementById("score-subtext");

const progressContainer =
    document.getElementById("progress-container");

// ===============================
// STATE
// ===============================

let currentMonth =
    new Date().getMonth();

let currentYear =
    new Date().getFullYear();


// The actual day currently being viewed
let selectedDate =
    new Date();


// Goals for the currently displayed month
let goals = [];


// All daily values
let dailyData = {};

let contextGoal = null;
let goalContextMenu = null;
let editingGoalId = null;
// ===============================
// MONTH NAMES
// ===============================

const monthNames = [

    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"

];


// ===============================
// MONTH KEY
// ===============================

function getMonthKey(
    year = currentYear,
    month = currentMonth
) {

    return `${year}-${String(
        month + 1
    ).padStart(2, "0")}`;
}


// ===============================
// DATE KEY
// ===============================

function getDateKey(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}







function loadGoalsForCurrentMonth() {

    const allGoals =
        loadAllGoals();

    const monthKey =
        getMonthKey();

    return allGoals[monthKey] || [];
}


function saveGoalsForCurrentMonth() {

    const allGoals =
        loadAllGoals();

    const monthKey =
        getMonthKey();

    allGoals[monthKey] =
        goals;

    localStorage.setItem(
        "physicalLifeGoals",
        JSON.stringify(allGoals)
    );
}


// ===============================
// DAILY DATA STORAGE
// ===============================

function loadDailyData() {

    try {

        const saved =
            localStorage.getItem(
                "physicalLifeDailyData"
            );

        if (!saved) {
            return {};
        }

        return JSON.parse(saved);

    } catch (error) {

        console.error(
            "Could not load daily data:",
            error
        );

        return {};
    }
}


// ===============================
// SUPABASE STORAGE
// ===============================

let currentUser = null;




// ===============================
// LOAD GOALS FROM SUPABASE
// ===============================

async function loadGoalsFromSupabase() {

    const { data, error } = await window.supabaseClient
        .from("physical_goals")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("month", getMonthKey())
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Could not load goals:", error);
        return [];
    }

    return data.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type,
        unit: row.unit || "",
        target:
            row.target === null
                ? null
                : Number(row.target),
        progress_method:
        row.progress_method || "none"
    }));
}


// ===============================
// LOAD DAILY DATA FROM SUPABASE
// ===============================

async function loadDailyDataFromSupabase() {

    const { data, error } = await window.supabaseClient
        .from("physical_daily_data")
        .select("*")
        .eq("user_id", currentUser.id);

    if (error) {
        console.error("Could not load daily data:", error);
        return {};
    }

    const formattedData = {};

    data.forEach(row => {

        const dateKey = row.date;

        if (!formattedData[dateKey]) {
            formattedData[dateKey] = {};
        }

        formattedData[dateKey][row.goal_id] = row.value;

    });

    return formattedData;
}




// ===============================
// SAVE DAILY VALUE TO SUPABASE
// ===============================

async function saveDailyValue(goal, value) {

    const dateKey = getDateKey(selectedDate);

    // Empty value = remove saved entry
    if (value === null || value === "") {

        const { error } = await window.supabaseClient
            .from("physical_daily_data")
            .delete()
            .eq("user_id", currentUser.id)
            .eq("goal_id", goal.id)
            .eq("date", dateKey);

        if (error) {
            console.error("Could not delete daily value:", error);
            return false;
        }

        return true;
    }


    const { error } = await window.supabaseClient
        .from("physical_daily_data")
        .upsert(
            {
                user_id: currentUser.id,
                goal_id: goal.id,
                date: dateKey,
                value: value,
                updated_at: new Date().toISOString()
            },
            {
                onConflict: "user_id,goal_id,date"
            }
        );

    if (error) {
        console.error("Could not save daily value:", error);
        return false;
    }

    return true;
}





// ===============================
// CURRENT DATE DISPLAY
// ===============================

function displayCurrentDate() {

    if (!currentDateElement) {
        return;
    }

    const today =
        new Date();

    const formattedDate =
        today.toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

    currentDateElement.textContent =
        formattedDate;
}


// ===============================
// SELECTED DATE DISPLAY
// ===============================

function displaySelectedDate() {

    if (!todayLabel) {
        return;
    }

    const formattedDate =
        selectedDate.toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

    todayLabel.textContent =
        formattedDate;
}


// ===============================
// MONTH HEADER
// ===============================

function updateMonthHeader() {

    const monthText =
        `${monthNames[currentMonth]} ${currentYear}`;


    if (monthDisplay) {

        monthDisplay.textContent =
            monthText;
    }


    if (calendarMonthLabel) {

        calendarMonthLabel.textContent =
            monthText;
    }
}


// ===============================
// CALENDAR HELPERS
// ===============================

function getDaysInMonth(
    year,
    month
) {

    return new Date(
        year,
        month + 1,
        0
    ).getDate();
}


function getFirstDayOfMonth(
    year,
    month
) {

    const day =
        new Date(
            year,
            month,
            1
        ).getDay();

    // Monday = 0
    // Sunday = 6

    return day === 0
        ? 6
        : day - 1;
}


function isToday(
    year,
    month,
    day
) {

    const today =
        new Date();

    return (

        today.getFullYear() === year &&

        today.getMonth() === month &&

        today.getDate() === day

    );
}


function isSelectedDate(
    year,
    month,
    day
) {

    return (

        selectedDate.getFullYear() === year &&

        selectedDate.getMonth() === month &&

        selectedDate.getDate() === day

    );
}


// ===============================
// CALENDAR
// ===============================

function generateCalendar() {

    if (!calendarGrid) {
        return;
    }

    calendarGrid.innerHTML = "";


    const daysInMonth =
        getDaysInMonth(
            currentYear,
            currentMonth
        );


    const firstDay =
        getFirstDayOfMonth(
            currentYear,
            currentMonth
        );


    // Empty cells
    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        const emptyCell =
            document.createElement("div");

        emptyCell.classList.add(
            "calendar-day",
            "empty"
        );

        calendarGrid.appendChild(
            emptyCell
        );
    }


    // Days
    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const dayElement =
            document.createElement("div");

        dayElement.classList.add(
            "calendar-day"
        );


        // Today
        if (
            isToday(
                currentYear,
                currentMonth,
                day
            )
        ) {

            dayElement.classList.add(
                "today"
            );
        }


        // Selected day
        if (
            isSelectedDate(
                currentYear,
                currentMonth,
                day
            )
        ) {

            dayElement.classList.add(
                "selected"
            );
        }


        dayElement.innerHTML = `

            <span class="day-number">
                ${day}
            </span>

        `;


        dayElement.addEventListener(
            "click",
            () => {

                selectDay(
                    currentYear,
                    currentMonth,
                    day
                );

            }
        );


        calendarGrid.appendChild(
            dayElement
        );
    }
}


// ===============================
// SELECT DAY
// ===============================

function selectDay(
    year,
    month,
    day
) {

    selectedDate =
        new Date(
            year,
            month,
            day
        );


    console.log(
        "Selected date:",
        getDateKey(selectedDate)
    );


    displaySelectedDate();

    generateCalendar();

    renderGoals();

    renderDailyData();

    renderDailyScore();
}


// ===============================
// CHANGE MONTH
// ===============================

async function changeMonth(
    direction
) {

    currentMonth += direction;


    if (currentMonth < 0) {

        currentMonth = 11;
        currentYear--;

    }


    if (currentMonth > 11) {

        currentMonth = 0;
        currentYear++;

    }


    // Load goals for the new month
    goals =
        await loadGoalsFromSupabase();


    // Keep selected date inside
    // the currently displayed month
    const daysInMonth =
        getDaysInMonth(
            currentYear,
            currentMonth
        );

    const selectedDay =
        Math.min(
            selectedDate.getDate(),
            daysInMonth
        );

    selectedDate =
        new Date(
            currentYear,
            currentMonth,
            selectedDay
        );


    updateMonthHeader();
    displaySelectedDate();

    generateCalendar();
    renderGoals();
    renderDailyData();
    renderDailyScore();
}


function goToPreviousMonth() {

    changeMonth(-1);
}


function goToNextMonth() {

    changeMonth(1);
}


// ===============================
// GOAL MODAL
// ===============================

function openGoalModal() {

    if (!goalModal) {
        return;
    }

    goalModal.classList.remove("hidden");

    if (goalNameInput) {
        goalNameInput.focus();
    }
}


function closeGoalModalWindow() {

    if (!goalModal) {
        return;
    }

    goalModal.classList.add("hidden");

    clearGoalForm();
}


function clearGoalForm() {

    if (goalNameInput) {
        goalNameInput.value = "";
    }

    if (goalTypeInput) {
        goalTypeInput.value =
            "boolean";
    }

    if (goalUnitInput) {
        goalUnitInput.value = "";
    }

    if (goalTargetInput) {
        goalTargetInput.value = "";
    }
    
}


// ===============================
// CREATE GOAL
// ===============================

// ===============================
// CREATE GOAL
// ===============================

async function createGoal() {

    const name =
        goalNameInput.value.trim();

    const type =
        goalTypeInput.value;

    const unit =
        goalUnitInput.value.trim();

    const targetValue =
        goalTargetInput.value.trim();


    if (!name) {

        alert(
            "Please enter a goal name."
        );

        return;

    }


    const target =
        targetValue === ""
            ? null
            : Number(targetValue);


    // ===============================
    // EDIT EXISTING GOAL
    // ===============================

    if (editingGoalId) {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("physical_goals")
                .update({
                    name: name,
                    type: type,
                    unit: unit || null,
                    target: target,
                    progress_method:
        goalProgressMethodInput.value
                })
                .eq(
                    "id",
                    editingGoalId
                )
                .select()
                .single();


        if (error) {

            console.error(
                "Could not update goal:",
                error
            );

            alert(
                "Could not update goal. Check the console."
            );

            return;

        }


        // Update local goal
        const goalIndex =
            goals.findIndex(
                goal =>
                    goal.id ===
                    editingGoalId
            );


        if (goalIndex !== -1) {

            goals[goalIndex] = {

                id: data.id,

                name: data.name,

                type: data.type,

                unit:
                    data.unit || "",

                target:
                    data.target === null
                        ? null
                        : Number(data.target)

            };

        }


        // Reset edit mode
        editingGoalId = null;


        renderGoals();

        renderDailyData();

        renderDailyScore();


        closeGoalModalWindow();

        return;

    }


    // ===============================
    // CREATE NEW GOAL
    // ===============================

    const {
        data,
        error
    } =
        await window.supabaseClient
            .from("physical_goals")
            .insert({

                user_id:
                    currentUser.id,

                month:
                    getMonthKey(),

                name:
                    name,

                type:
                    type,

                unit:
                    unit || null,

                target:
                    target,

                progress_method:
                    goalProgressMethodInput.value

            })
            .select()
            .single();


    if (error) {

        console.error(
            "Could not create goal:",
            error
        );

        alert(
            "Could not save goal. Check the console."
        );

        return;

    }


    // Add newly created goal
    goals.push({

        id:
            data.id,

        name:
            data.name,

        type:
            data.type,

        unit:
            data.unit || "",

        target:
            data.target === null
                ? null
                : Number(data.target),
        
        progress_method:
    data.progress_method

    });


    renderGoals();

    renderDailyData();

    renderDailyScore();


    closeGoalModalWindow();

}

// ===============================
// FORMAT GOAL TYPE
// ===============================

function formatGoalType(type) {

    const types = {

        boolean: "Yes / No",

        number: "Number",

        distance: "Distance",

        duration: "Duration"

    };


    return (
        types[type] ||
        type
    );
}
// ===============================
// RENDER GOALS
// ===============================

function renderGoals() {

    if (!goalsContainer) {
        return;
    }


    // Remove old goal cards
    const oldGoalCards =
        goalsContainer.querySelectorAll(
            ".goal-card"
        );


    oldGoalCards.forEach(
        card => card.remove()
    );


    // No goals
    if (goals.length === 0) {

        if (emptyGoals) {
            emptyGoals.style.display =
                "block";
        }

        return;
    }


    // Goals exist
    if (emptyGoals) {
        emptyGoals.style.display =
            "none";
    }


    goals.forEach(
        goal => {

            const card =
                createGoalCard(goal);

            goalsContainer.appendChild(
                card
            );

        }
    );
}



// ===============================
// CREATE GOAL CARD
// ===============================

function createGoalCard(goal) {

    const card =
        document.createElement("div");

    card.classList.add(
        "goal-card"
    );
    card.addEventListener(
    "contextmenu",
    event => {

        showGoalContextMenu(
            event,
            goal
        );

    }
);


    // ===========================
    // GOAL INFORMATION
    // ===========================

    const info =
        document.createElement("div");

    info.classList.add(
        "goal-info"
    );


    const name =
        document.createElement("div");

    name.classList.add(
        "goal-name"
    );

    name.textContent =
        goal.name;


    const target =
        document.createElement("div");

    target.classList.add(
        "goal-target"
    );


    let targetText =
        formatGoalType(goal.type);


    if (
        goal.target !== null &&
        goal.target !== undefined
    ) {

        targetText +=
            ` · Target: ${goal.target}`;

        if (goal.unit) {

            targetText +=
                ` ${goal.unit}`;

        }

    }


    target.textContent =
        targetText;


    info.appendChild(name);
    info.appendChild(target);

    card.appendChild(info);


    return card;
}
    // ===============================
// GOAL CONTEXT MENU
// ===============================

function showGoalContextMenu(event, goal) {

    event.preventDefault();

    contextGoal = goal;

    // Remove existing menu
    if (goalContextMenu) {
        goalContextMenu.remove();
    }

    // Create menu
    goalContextMenu =
        document.createElement("div");

    goalContextMenu.classList.add(
        "goal-context-menu"
    );

    // Edit button
    const editButton =
        document.createElement("button");

    editButton.textContent =
        "Edit Goal";

editButton.addEventListener(
    "click",
    () => {

        if (!contextGoal) {
            return;
        }

        editingGoalId =
            contextGoal.id;


        // Fill modal with existing goal data

        goalNameInput.value =
            contextGoal.name || "";

        goalTypeInput.value =
            contextGoal.type || "boolean";

        goalUnitInput.value =
            contextGoal.unit || "";

        goalTargetInput.value =
            contextGoal.target ?? "";
        
        goalProgressMethodInput.value =
    contextGoal.progress_method || "none";


        hideGoalContextMenu();


        // Open existing goal modal

        goalModal.classList.remove(
            "hidden"
        );

        goalNameInput.focus();

    }
);


    // Delete button
    const deleteButton =
        document.createElement("button");

    deleteButton.textContent =
        "Delete Goal";

    deleteButton.classList.add(
        "delete-goal-option"
    );

deleteButton.addEventListener(
    "click",
    async () => {

        if (!contextGoal) {
            return;
        }


        const goalToDelete =
            contextGoal;


        const confirmed =
            confirm(
                `Delete "${goalToDelete.name}"?`
            );


        if (!confirmed) {
            hideGoalContextMenu();
            return;
        }


        try {

            const {
                error
            } =
                await window.supabaseClient
                    .from("physical_goals")
                    .delete()
                    .eq("id", goalToDelete.id);


            if (error) {
                throw error;
            }


            // Remove from local goals array
            goals =
                goals.filter(
                    goal =>
                        goal.id !==
                        goalToDelete.id
                );


            // Remove any locally loaded daily data
            Object.keys(dailyData)
                .forEach(dateKey => {

                    if (
                        dailyData[dateKey]
                        &&
                        dailyData[dateKey][goalToDelete.id]
                        !== undefined
                    ) {

                        delete dailyData[dateKey][goalToDelete.id];

                    }

                });


            hideGoalContextMenu();

            renderGoals();

            renderDailyData();


        } catch (error) {

            console.error(
                "Error deleting goal:",
                error
            );

            alert(
                "Failed to delete goal. Please try again."
            );

        }

    }
);


    goalContextMenu.appendChild(
        editButton
    );

    goalContextMenu.appendChild(
        deleteButton
    );

    document.body.appendChild(
        goalContextMenu
    );


    // Position menu
    const menuWidth =
        goalContextMenu.offsetWidth;

    const menuHeight =
        goalContextMenu.offsetHeight;

    let x = event.clientX;
    let y = event.clientY;


    if (
        x + menuWidth >
        window.innerWidth
    ) {

        x =
            window.innerWidth -
            menuWidth -
            8;

    }


    if (
        y + menuHeight >
        window.innerHeight
    ) {

        y =
            window.innerHeight -
            menuHeight -
            8;

    }


    goalContextMenu.style.left =
        `${x}px`;

    goalContextMenu.style.top =
        `${y}px`;
}


// ===============================
// HIDE CONTEXT MENU
// ===============================

function hideGoalContextMenu() {

    if (goalContextMenu) {

        goalContextMenu.remove();

        goalContextMenu =
            null;

    }

    contextGoal = null;
}



async function setDailyValue(goal, value) {

    const dateKey = getDateKey(selectedDate);

    if (!dailyData[dateKey]) {
        dailyData[dateKey] = {};
    }

    if (value === null || value === "") {
        delete dailyData[dateKey][goal.id];
    } else {
        dailyData[dateKey][goal.id] = value;
    }

    const saved = await saveDailyValue(goal, value);

    if (!saved) {
        alert("Could not save your data.");
        return;
    }

    renderGoals();
    renderDailyData();
    renderDailyScore();
    renderProgress();
}
  










// ===============================
// DAILY DATA
// ===============================

function renderDailyData() {

    if (!metricsContainer) {
        return;
    }


    metricsContainer.innerHTML =
        "";


    if (goals.length === 0) {
        return;
    }


    const dateKey =
        getDateKey(
            selectedDate
        );


    goals.forEach(
        goal => {

            const card =
                createMetricCard(
                    goal,
                    dateKey
                );


            metricsContainer.appendChild(
                card
            );

        }
    );
}



// ===============================
// PROGRESS CARD
// ===============================

function createProgressCard(
    goal,
    progressValue = 0,
    progressPercent = 0
) {

    const card =
        document.createElement("div");

    card.classList.add(
        "progress-card"
    );


    // ===============================
    // HEADER
    // ===============================

    const header =
        document.createElement("div");

    header.classList.add(
        "progress-card-header"
    );


    const name =
        document.createElement("div");

    name.classList.add(
        "progress-goal-name"
    );

    name.textContent =
        goal.name;


    const method =
        document.createElement("div");

    method.classList.add(
        "progress-method"
    );

    method.textContent =
        formatProgressMethod(
            goal.progress_method
        );


    header.appendChild(name);
    header.appendChild(method);


    // ===============================
    // VALUE
    // ===============================

    const value =
        document.createElement("div");

    value.classList.add(
        "progress-value"
    );

    value.textContent =
        formatProgressValue(
            goal,
            progressValue
        );


    // ===============================
    // PROGRESS BAR
    // ===============================

    const bar =
        document.createElement("div");

    bar.classList.add(
        "progress-bar"
    );


    const fill =
        document.createElement("div");

    fill.classList.add(
        "progress-bar-fill"
    );

    fill.style.width =
        `${Math.min(
            Math.max(progressPercent, 0),
            100
        )}%`;


    bar.appendChild(fill);


    card.appendChild(header);

    card.appendChild(value);

    card.appendChild(bar);


    return card;
}
// ===============================
// RENDER PROGRESS
// ===============================
function calculateCountProgress(goal) {

    let completedDays = 0;

    Object.keys(dailyData).forEach(dateKey => {

        const dayData =
            dailyData[dateKey];

        if (!dayData) {
            return;
        }

        const value =
            dayData[goal.id];

        if (value === true) {
            completedDays++;
        }

    });

    return completedDays;
}
function calculateSumProgress(goal) {
    let total = 0;

    const monthKey = getMonthKey();

    Object.keys(dailyData).forEach(dateKey => {

        // Only use dates from the current month
        if (!dateKey.startsWith(monthKey)) {
            return;
        }

        const dayData = dailyData[dateKey];

        if (!dayData) {
            return;
        }

        const value = dayData[goal.id];

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {
            const number = Number(value);

            if (!isNaN(number)) {
                total += number;
            }
        }
    });

    return total;
}
function calculateAverageProgress(goal) {

    let total = 0;
    let count = 0;

    const monthKey = getMonthKey();

    Object.keys(dailyData).forEach(dateKey => {

        // Only use dates from current month
        if (!dateKey.startsWith(monthKey)) return;

        const dayData = dailyData[dateKey];

        if (!dayData) return;

        const value = dayData[goal.id];

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {

            const number = Number(value);

            if (!isNaN(number)) {

                total += number;
                count++;

            }
        }
    });

    if (count === 0) {
        return 0;
    }

    return total / count;
}

function calculateTargetProgress(goal) {

    if (
        goal.target === null ||
        goal.target === undefined ||
        goal.target === 0
    ) {
        return 0;
    }

    let total = 0;
    let monthKey = getMonthKey();

    Object.keys(dailyData).forEach(dateKey => {

        if (!dateKey.startsWith(monthKey)) return;

        const dayData = dailyData[dateKey];

        if (!dayData) return;

        const value = dayData[goal.id];

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {

            const number = Number(value);

            if (!isNaN(number)) {
                total += number;
            }
        }
    });

    return Math.min(
        100,
        (total / goal.target) * 100
    );
}
function renderProgress() {

    if (!progressContainer) {
        return;
    }


    progressContainer.innerHTML = "";


    // No goals
    if (goals.length === 0) {

        const empty =
            document.createElement("div");

        empty.classList.add(
            "progress-empty"
        );

        empty.textContent =
            "Add goals to start tracking progress.";

        progressContainer.appendChild(
            empty
        );

        return;
    }


    goals.forEach(goal => {

    if (
        goal.progress_method === "none"
    ) {
        return;
    }


    let progressValue = 0;


    // Count completed days
// Count completed days
if (
    goal.progress_method === "count"
) {

    progressValue =
        calculateCountProgress(
            goal
        );

}


// Sum all daily values
if (
    goal.progress_method === "sum"
) {

    progressValue =
        calculateSumProgress(
            goal
        );

}

// Average daily values
if (
    goal.progress_method === "average"
) {

    progressValue =
        calculateAverageProgress(
            goal
        );

}
// Target achievement
if (
    goal.progress_method === "target"
) {

    progressValue =
        calculateTargetProgress(
            goal
        );

}

    const card =
        createProgressCard(
            goal,
            progressValue,
            0
        );


    progressContainer.appendChild(
        card
    );

});

}


// ===============================
// PROGRESS METHOD LABEL
// ===============================

function formatProgressMethod(
    method
) {

    switch (method) {

        case "count":
            return "Count";

        case "sum":
            return "Sum";

        case "average":
            return "Average";

        case "target":
            return "Target Achievement";

        default:
            return "Count";

    }

}


// ===============================
// PROGRESS VALUE LABEL
// ===============================

function formatProgressValue(
    goal,
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "0";

    }

    // Target Achievement
    if (
        goal.progress_method === "target"
    ) {

        return `${Math.round(value)}%`;

    }

    // Average
    if (
        goal.progress_method === "average"
    ) {

        return `${Number(value).toFixed(1)} ${goal.unit || ""}`.trim();

    }

    // Count
    if (
        goal.progress_method === "count"
    ) {

        return `${value} days`;

    }

    // Sum
    if (goal.unit) {

        return `${Number(value).toLocaleString()} ${goal.unit}`;

    }

    return `${value}`;

}
// ===============================
// CREATE DAILY DATA CARD
// ===============================

function createMetricCard(
    goal,
    dateKey
) {

    const card =
        document.createElement(
            "div"
        );


    card.classList.add(
        "metric-card"
    );


    const title =
        document.createElement(
            "h3"
        );


    title.textContent =
        goal.name;


    const type =
        document.createElement(
            "span"
        );


    type.textContent =
        formatGoalType(
            goal.type
        );


    card.appendChild(title);

    card.appendChild(type);


    const value =
        dailyData[
            dateKey
        ]?.[goal.id];


    // ===========================
    // YES / NO
    // ===========================

    if (
        goal.type === "boolean"
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.classList.add(
            "goal-check"
        );


        button.textContent =
            value === true
                ? "✓"
                : "Mark Complete";


        if (
            value === true
        ) {

            button.classList.add(
                "completed"
            );

        }


        button.addEventListener(
            "click",
            () => {

                setDailyValue(
                    goal,
                    value !== true
                );

            }
        );


        card.appendChild(
            button
        );

    }


    // ===========================
    // NUMBER / DISTANCE / DURATION
    // ===========================

    else {

        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.classList.add(
            "input-with-unit"
        );


        const input =
            document.createElement(
                "input"
            );


        input.type =
            "number";


        input.step =
            "any";


        input.value =
            value ?? "";


        input.addEventListener(
            "change",
            () => {

                setDailyValue(
                    goal,
                    input.value === ""
                        ? null
                        : Number(
                            input.value
                        )
                );

            }
        );


        wrapper.appendChild(
            input
        );


        if (goal.unit) {

            const unit =
                document.createElement(
                    "span"
                );


            unit.textContent =
                goal.unit;


            wrapper.appendChild(
                unit
            );

        }


        card.appendChild(
            wrapper
        );
    }


    return card;
}


// ===============================
// DAILY SCORE
// ===============================

function calculateGoalScore(
    goal,
    dateKey
) {

    const value =
        dailyData[
            dateKey
        ]?.[goal.id];


    // Nothing entered
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        return 0;
    }


    // Yes / No
    if (
        goal.type === "boolean"
    ) {

        return value === true
            ? 100
            : 0;
    }


    // Number / Distance / Duration
    if (
        goal.type === "number" ||
        goal.type === "distance" ||
        goal.type === "duration"
    ) {

        if (
            goal.target === null ||
            goal.target === undefined ||
            goal.target <= 0
        ) {

            return 0;
        }


        const percentage =
            (
                Number(value) /
                goal.target
            ) * 100;


        return Math.min(
            Math.max(
                percentage,
                0
            ),
            100
        );
    }


    return 0;
}


// ===============================
// CALCULATE DAILY SCORE
// ===============================

function calculateDailyScore() {

    if (goals.length === 0) {
        return 0;
    }


    const dateKey =
        getDateKey(
            selectedDate
        );


    let totalScore = 0;


    goals.forEach(
        goal => {

            totalScore +=
                calculateGoalScore(
                    goal,
                    dateKey
                );

        }
    );


    return Math.round(
        totalScore /
        goals.length
    );
}


// ===============================
// RENDER DAILY SCORE
// ===============================

function renderDailyScore() {

    if (
        !scoreValue ||
        !scoreSubtext
    ) {

        return;
    }


    if (goals.length === 0) {

        scoreValue.textContent =
            "0%";

        scoreSubtext.textContent =
            "0 / 0 goals completed";

        return;
    }


    const dateKey =
        getDateKey(
            selectedDate
        );


    const score =
        calculateDailyScore();


    let completedGoals =
        0;


    goals.forEach(
        goal => {

            const goalScore =
                calculateGoalScore(
                    goal,
                    dateKey
                );


            if (
                goalScore >= 100
            ) {

                completedGoals++;

            }

        }
    );


    scoreValue.textContent =
        `${score}%`;


    scoreSubtext.textContent =
        `${completedGoals} / ${goals.length} goals completed`;
}


// ===============================
// EVENT LISTENERS
// ===============================

if (
    previousMonthButton
) {

    previousMonthButton.addEventListener(
        "click",
        goToPreviousMonth
    );
}


if (
    nextMonthButton
) {

    nextMonthButton.addEventListener(
        "click",
        goToNextMonth
    );
}


if (
    addGoalButton
) {

    addGoalButton.addEventListener(
        "click",
        openGoalModal
    );
}


if (
    emptyAddGoalButton
) {

    emptyAddGoalButton.addEventListener(
        "click",
        openGoalModal
    );
}


if (
    closeGoalModal
) {

    closeGoalModal.addEventListener(
        "click",
        closeGoalModalWindow
    );
}


if (
    cancelGoalButton
) {

    cancelGoalButton.addEventListener(
        "click",
        closeGoalModalWindow
    );
}


if (
    saveGoalButton
) {

    saveGoalButton.addEventListener(
        "click",
        createGoal
    );
}


// Close modal by clicking overlay
if (
    goalModal
) {

    goalModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                goalModal
            ) {

                closeGoalModalWindow();

            }

        }
    );
}


// ===============================
// INITIALIZE PHYSICAL TRACKER
// ===============================

async function initializePhysicalTracker() {

    const {
        data: { user },
        error
    } = await window.supabaseClient.auth.getUser();


    // User is not logged in
    if (error || !user) {

        window.location.href = "login.html";

        return;
    }


    // Store logged-in user
    currentUser = user;


    // Load data from Supabase
    dailyData = await loadDailyDataFromSupabase();

    goals = await loadGoalsFromSupabase();


    // Render everything
    displayCurrentDate();
    displaySelectedDate();
    updateMonthHeader();

    generateCalendar();

    renderGoals();
    renderDailyData();
    renderDailyScore();
    renderProgress();
}
// ===============================
// TODAY TABS
// ===============================

if (goalsTab && dataTab) {

    goalsTab.addEventListener(
        "click",
        () => {

            goalsTab.classList.add("active");
            dataTab.classList.remove("active");

            goalsView.classList.add("active");
            dataView.classList.remove("active");

        }
    );


    dataTab.addEventListener(
        "click",
        () => {

            dataTab.classList.add("active");
            goalsTab.classList.remove("active");

            dataView.classList.add("active");
            goalsView.classList.remove("active");

            renderDailyData();

        }
    );

}

// Start tracker
initializePhysicalTracker();