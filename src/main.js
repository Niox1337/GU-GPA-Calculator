const { createDir, BaseDirectory, readTextFile, writeTextFile, exists } = window.__TAURI__.fs;
const {invoke} = window.__TAURI__.tauri;
let Courses = {};
let currentCourses = {};
let result;


async function initializeSaves() {
    const exist = await exists('GPA_Calculator', {dir: BaseDirectory.AppData});
    if (!exist) {
        await createDir('GPA_Calculator', {dir: BaseDirectory.AppData, recursive: true});
    }
    const saveExists = await exists('GPA_Calculator/saves.json', {dir: BaseDirectory.AppData});
    if (!saveExists) {
        await writeTextFile('GPA_Calculator/saves.json', JSON.stringify({}), {dir: BaseDirectory.AppData});
    }
    Courses = JSON.parse(await readTextFile('GPA_Calculator/saves.json', {dir: BaseDirectory.AppData}));
}

async function countGradeInput() {
    let gradeInputs = document.querySelectorAll('.grade-input');
    return gradeInputs.length;
}

async function showEditCourseForm() {
    const addCourse = document.querySelector("#add-course-form");
    addCourse.classList.remove("d-none")
    const editCourse = document.querySelector("#edit-course-button");
    editCourse.classList.add("d-none")
    const calculate = document.querySelector("#calculate");
    calculate.classList.add("d-none");
}

async function finishEditing() {
    const addCourse = document.querySelector("#add-course-form");
    addCourse.classList.add("d-none")
    const editCourse = document.querySelector("#edit-course-button");
    editCourse.classList.remove("d-none")
    const calculate = document.querySelector("#calculate");
    calculate.classList.remove("d-none");
}

async function alert(selector, valueName){
    const alert = document.createElement("div");
    alert.className = "alert";
    alert.textContent = valueName + " cannot be empty";
    alert.style.color = "red";
    selector.parentNode.appendChild(alert);

}

async function addCourse() {
    let inputColumn;
    const courseName = document.querySelector("#course-name");
    const credit = document.querySelector("#credit");

    const existingAlerts = document.querySelectorAll(".alert");
    existingAlerts.forEach(alert => alert.remove());

    if (!courseName.value.trim() || !credit.value.trim()) {
        if (!courseName.value.trim()) {
            await alert(courseName, "Course Name");
        }
        if (!credit.value.trim()) {
            await alert(credit, "Credit")
        }
        return;
    }
    const inputCount = await countGradeInput();
    if (inputCount % 2 === 0) {
        inputColumn = document.querySelector("#input-col1");
    } else {
        inputColumn = document.querySelector("#input-col2");
    }
    inputColumn.innerHTML += `
        <label class="input-column fade-in grade-input-column" id="input-label${inputCount + 1}"> ${courseName.value}
        <span class="dimmed-text" id="credit${inputCount + 1}">(${credit.value})</span>
          <input class="grade-input" id="grade-input${inputCount + 1}">
        </label>
  `
    const label = document.querySelector(`#input-label${inputCount + 1}`);
    label.addEventListener('animationend', () => {
        label.classList.remove('fade-in');
    });

    currentCourses[courseName.value] = {
        credit: credit.value,
        grades: "MV"
    }
}

async function save(saveName) {
    Courses[saveName] = currentCourses;
    await writeTextFile('GPA_Calculator/saves.json', JSON.stringify(Courses), {dir: BaseDirectory.AppData});
    console.log("Saved");
}

async function getCurrentCourses() {
    let currentCourses = {};
    document.querySelectorAll('.grade-input-column').forEach((input, index) => {
        if (input.textContent){
                const courseName = input.textContent.split('(')[0].trim();
                const credit = input.textContent.split('(')[1].split(')')[0];
                const grade = document.querySelector(`#grade-input${index + 1}`).value;
                console.log(courseName, credit, grade);
                currentCourses[courseName] = {
                    credit: credit,
                    grades: grade
            }
            console.log(currentCourses);
        }
    });
    return currentCourses;
}

async function calculateGPA() {
    result.textContent = await invoke("calculate_gpa", {courses: getCurrentCourses()}).then(r => console.log(r));
}

window.addEventListener("DOMContentLoaded", () => {
    initializeSaves();
    result = document.querySelector("#result");
    document.querySelector("#edit-course-button").addEventListener("click", (e) => {
        showEditCourseForm().then(r => console.log(r));
    });
    document.querySelector("#finish-editing").addEventListener("click", (e) => {
        finishEditing().then(r => console.log(r));
    });
    document.querySelector("#add-course").addEventListener("click", (e) => {
        addCourse().then(r => console.log(r));
    });
    document.querySelector("#save-course").addEventListener("click", async (e) => {
        await save("test");
    });
    document.querySelector("#calculate").addEventListener("click", async (e) => {
        await calculateGPA();
    });
});
