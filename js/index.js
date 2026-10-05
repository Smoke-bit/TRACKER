/* =========================================================
   LIFE OS — HOME PAGE
   ========================================================= */


/* =========================
   ELEMENTS
========================= */

const timeElement = document.getElementById("current-time");
const dateElement = document.getElementById("current-date");
const quoteElement = document.getElementById("quote");


/* =========================
   QUOTES
========================= */

const quotes = [
    "Discipline is choosing between what you want now and what you want most.",
    "Small progress is still progress.",
    "You don't need motivation. You need consistency.",
    "Build the life you don't need to escape from.",
    "Your future self is watching what you do today.",
    "Do it tired. Do it imperfectly. Just keep moving.",
    "Consistency beats intensity.",
    "The work you avoid is usually the work that changes you.",
    "Don't count the days. Make the days count.",
    "Become someone your future self will thank."
];


/* =========================
   UPDATE TIME
========================= */

function updateTime() {

    const now = new Date();

    let hours = now.getHours();
    let minutes = now.getMinutes();

    hours = String(hours).padStart(2, "0");
    minutes = String(minutes).padStart(2, "0");

    timeElement.textContent = `${hours}:${minutes}`;
}


/* =========================
   UPDATE DATE
========================= */

function updateDate() {

    const now = new Date();

    const dateOptions = {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    };

    dateElement.textContent = now.toLocaleDateString(
        "en-IN",
        dateOptions
    );
}


/* =========================
   DAILY QUOTE
========================= */

function setDailyQuote() {

    const now = new Date();

    /*
        Create a number based on the current date.

        This means the quote changes once per day,
        but stays the same if you refresh the page.
    */

    const dayNumber =
        Math.floor(
            Date.UTC(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            ) / 86400000
        );

    const quoteIndex =
        Math.abs(dayNumber) % quotes.length;

    quoteElement.textContent = quotes[quoteIndex];
}


/* =========================
   INITIALIZE
========================= */

function initializeLifeOS() {

    updateTime();
    updateDate();
    setDailyQuote();

}


/* =========================
   START
========================= */

initializeLifeOS();


/* =========================
   UPDATE CLOCK EVERY SECOND
========================= */

setInterval(updateTime, 1000);


/* =========================
   UPDATE DATE / QUOTE
   EVERY MINUTE
========================= */

setInterval(() => {

    updateDate();
    setDailyQuote();

}, 60000);