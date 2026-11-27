const VALIDATION_MARK = 48;   // total of 48 or above = course validated
const MAX_CA = 30;
const MAX_EXAM = 70;
const SCALE = [
    { min: 80, letter: "A", points: 4.0 },
    { min: 70, letter: "B+", points: 3.5 },
    { min: 60, letter: "B", points: 3.0 },
    { min: 55, letter: "C+", points: 2.5 },
    { min: 50, letter: "C", points: 2.0 },
    { min: 45, letter: "D+", points: 1.5 },
    { min: 40, letter: "D", points: 1.0 },
    { min: 0, letter: "F", points: 0.0 }
];


function gradeFor(total) {
    return SCALE.find(g => total >= g.min);
}

// Returns null if the row is incomplete or has invalid numbers.
function evaluateCourse(c) {
    const credits = parseFloat(c.credits);
    const ca = parseFloat(c.ca);
    const exam = parseFloat(c.exam);
    if (![credits, ca, exam].every(Number.isFinite)) return null;
    if (credits <= 0 || ca < 0 || ca > MAX_CA || exam < 0 || exam > MAX_EXAM) return null;

    const total = ca + exam;
    const grade = gradeFor(total);
    return {
        total,
        credits,
        letter: grade.letter,
        points: grade.points,
        validated: total >= VALIDATION_MARK
    };
}

// GPA = sum(points x credits) / sum(credits)

function calculateGPA(courses) {
    let weighted = 0, attempted = 0, validatedCredits = 0, validatedCount = 0;
    courses.forEach(c => {
        const r = evaluateCourse(c);
        if (!r) return;
        weighted += r.points * r.credits;
        attempted += r.credits;
        if (r.validated) { validatedCredits += r.credits; validatedCount++; }
    });
    return {
        gpa: attempted ? weighted / attempted : null,
        attempted,
        validatedCredits,
        validatedCount
    };
}

function calculateCGPA(semesters) {
    return calculateGPA(semesters.flatMap(s => s.courses));
}

const newCourse = () => ({ name: "", credits: "", ca: "", exam: "" });
const newSemester = () => ({ name: "", courses: [newCourse()] });

const STORAGE_KEY = "gpa-calculator-data";

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
        console.warn("Could not save:", err);
    }
}

function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!saved || !Array.isArray(saved.semesters) || !saved.semesters.length) return null;
        // every field is rebuild as a clean string so bad or old data can't break the page.
        return {
            semesters: saved.semesters.map(s => ({
                name: String(s.name ?? ""),
                courses: (Array.isArray(s.courses) && s.courses.length ? s.courses : [{}]).map(c => ({
                    name: String(c.name ?? ""),
                    credits: String(c.credits ?? ""),
                    ca: String(c.ca ?? ""),
                    exam: String(c.exam ?? "")
                }))
            }))
        };
    } catch (err) {
        return null;
    }
}

const state = loadState() || { semesters: [newSemester()] };

const PROFILE_KEY = "gpa-calculator-profile";

function loadProfile() {
    try {
        const p = JSON.parse(localStorage.getItem(PROFILE_KEY));
        return p && p.name ? p : null;
    } catch (err) {
        return null;
    }
}

function saveProfile() {
    try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (err) {
        console.warn("Could not save profile:", err);
    }
}

let profile = loadProfile();

/* Rendering */
const $sems = document.getElementById("semesters");
const RING_LENGTH = 326.73; // circumference of the SVG ring (r = 52)

const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
const fmt = n => (n === null ? "–" : n.toFixed(2));

function render() {
    $sems.innerHTML = state.semesters.map((s, si) => `
    <section class="card">
      <div class="sem-head">
        <input class="sem-name" data-s="${si}" data-f="name" placeholder="Semester ${si + 1}" value="${esc(s.name)}" aria-label="Semester name">
        ${state.semesters.length > 1 ? `<button class="ghost" data-act="delSem" data-s="${si}">Remove</button>` : ""}
      </div>

      ${s.courses.map((c, ci) => `
        <div class="course" data-state="empty" data-row="${si}-${ci}">
          <label class="f-name">Course
            <input data-s="${si}" data-c="${ci}" data-f="name" placeholder="e.g. MAT 202" value="${esc(c.name)}">
          </label>
          <label class="f-cr">Credits
            <input type="number" inputmode="decimal" min="1" data-s="${si}" data-c="${ci}" data-f="credits" value="${esc(c.credits)}">
          </label>
          <label class="f-ca">CA /${MAX_CA}
            <input type="number" inputmode="decimal" min="0" max="${MAX_CA}" data-s="${si}" data-c="${ci}" data-f="ca" value="${esc(c.ca)}">
          </label>
          <label class="f-ex">Exam /${MAX_EXAM}
            <input type="number" inputmode="decimal" min="0" max="${MAX_EXAM}" data-s="${si}" data-c="${ci}" data-f="exam" value="${esc(c.exam)}">
          </label>
          <div class="res"></div>
          <button class="ghost del" data-act="delCourse" data-s="${si}" data-c="${ci}" aria-label="Remove course">✕</button>
        </div>`).join("")}

      <div class="sem-foot">
        <button class="ghost" data-act="addCourse" data-s="${si}">Add course</button>
        <div class="sem-stats">
          <span>GPA<strong data-gpa="${si}">–</strong></span>
          <span>Credits validated<strong data-vcr="${si}">0</strong></span>
        </div>
      </div>
    </section>`).join("");
    updateResults();
}