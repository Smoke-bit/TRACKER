// ===============================
// PHYSICAL LIFE TRACKER
// Calendar + Monthly Goals
// + Daily Data + Daily Score
// ===============================


// ===============================
// DOM ELEMENTS
// ===============================

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


// ===============================
// GOAL STORAGE
// ===============================

function loadAllGoals() {

    try {

        const saved =
            localStorage.getItem(
                "physicalLifeGoals"
            );

        if (!saved) {
            return {};
        }

        const parsed =
            JSON.parse(saved);


        // OLD FORMAT MIGRATION
        //
        // If goals were previously stored
        // as a simple array, move them into
        // the currently displayed month.

        if (Array.isArray(parsed)) {

            const monthKey =
                getMonthKey();

            const migrated = {

                [monthKey]: parsed

            };

            localStorage.setItem(
                "physicalLifeGoals",
                JSON.stringify(migrated)
            );

            return migrated;
        }


        return parsed;

    } catch (error) {

        console.error(
            "Could not load goals:",
            error
        );

        return {};
    }
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


function saveDailyData() {

    localStorage.setItem(
        "physicalLifeDailyData",
        JSON.stringify(dailyData)
    );
}


// Load existing daily data
dailyData =
    loadDailyData();


// Load goals for October/current month
goals =
    loadGoalsForCurrentMonth();


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

function changeMonth(
    direction
) {

    currentMonth +=
        direction;


    if (currentMonth < 0) {

        currentMonth = 11;

        currentYear--;

    }


    if (currentMonth > 11) {

        currentMonth = 0;

        currentYear++;

    }


    // Load goals belonging
    // to this month
    goals =
        loadGoalsForCurrentMonth();


    updateMonthHeader();

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

function createGoal() {

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


    const goal = {

        id: Date.now(),

        name: name,

        type: type,

        unit: unit,

        target:
            targetValue === ""
                ? null
                : Number(targetValue)

    };


    // Add goal to the
    // CURRENT MONTH only

    goals.push(goal);

    saveGoalsForCurrentMonth();


    // Update UI

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


    // Goal information
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
        formatGoalType(
            goal.type
        );


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


    // ===========================
    // YES / NO
    // ===========================

    if (
        goal.type === "boolean"
    ) {

        const check =
            document.createElement(
                "button"
            );


        check.classList.add(
            "goal-check"
        );


        check.textContent =
            "✓";


        const dateKey =
            getDateKey(
                selectedDate
            );


        const existingValue =
            dailyData[
                dateKey
            ]?.[goal.id];


        if (
            existingValue === true
        ) {

            check.classList.add(
                "completed"
            );

        }


        check.addEventListener(
            "click",
            () => {

                setDailyValue(
                    goal,
                    !check.classList.contains(
                        "completed"
                    )
                );

            }
        );


        card.appendChild(
            check
        );

    }


    // ===========================
    // NUMBER / DISTANCE / DURATION
    // ===========================

    else {

        const input =
            document.createElement(
                "input"
            );


        input.type =
            "number";


        input.step =
            "any";


        input.classList.add(
            "goal-control"
        );


        const dateKey =
            getDateKey(
                selectedDate
            );


        const existingValue =
            dailyData[
                dateKey
            ]?.[goal.id];


        if (
            existingValue !== undefined &&
            existingValue !== null
        ) {

            input.value =
                existingValue;

        }


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


        card.appendChild(
            input
        );


        if (goal.unit) {

            const unit =
                document.createElement(
                    "span"
                );


            unit.classList.add(
                "goal-unit"
            );


            unit.textContent =
                goal.unit;


            card.appendChild(
                unit
            );

        }
    }


    return card;
}


// ===============================
// SET DAILY VALUE
// ===============================

function setDailyValue(
    goal,
    value
) {

    const dateKey =
        getDateKey(
            selectedDate
        );


    if (!dailyData[dateKey]) {

        dailyData[dateKey] = {};

    }


    dailyData[
        dateKey
    ][goal.id] =
        value;


    saveDailyData();


    renderGoals();

    renderDailyData();

    renderDailyScore();
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
// INITIALIZE
// ===============================

displayCurrentDate();

displaySelectedDate();

updateMonthHeader();

generateCalendar();

renderGoals();

renderDailyData();

renderDailyScore();