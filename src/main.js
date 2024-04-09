const { createDir, BaseDirectory, readTextFile, writeTextFile, exists } = window.__TAURI__.fs;
const {invoke} = window.__TAURI__.tauri;
let Courses = [];
let currentCourses = [];
let result = document.querySelector("#result");


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

async function loadCurrentCourse() {
    let inputColumn1 = document.querySelector("#input-col1");
    let inputColumn2 = document.querySelector("#input-col2");

    inputColumn1.innerHTML = '';
    inputColumn2.innerHTML = '';
    currentCourses.forEach((course, index) => {
        let inputColumn = index % 2 === 0 ? document.querySelector("#input-col1") : document.querySelector("#input-col2");
        inputColumn.innerHTML += `
        <label class="input-column fade-in grade-input-column" id="input-label${index}"> ${course.course}
        <span class="dimmed-text" id="credit${index}">(${course.credit})</span>
        <div class="input-svg-container">
          <input class="grade-input" id="grade-input${index}">
          <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0 0 16 16" class="input-deletion">
</svg></div>
        </label>
  `
    });
    document.querySelectorAll(".input-deletion").forEach((deletion) => {
        deletion.addEventListener("click", (e) => {
            currentCourses.splice(currentCourses.indexOf(e.target.parentNode.parentNode.textContent), 1);
            e.target.parentNode.parentNode.remove();
            loadCurrentCourse().then(r => console.log(r));
        });
    });
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
    const inputDelete = document.querySelectorAll(".input-deletion");
    inputDelete.forEach((deletion) => {
        deletion.classList.remove("d-none");
    });
}

async function finishEditing() {
    const addCourse = document.querySelector("#add-course-form");
    addCourse.classList.add("d-none")
    const editCourse = document.querySelector("#edit-course-button");
    editCourse.classList.remove("d-none")
    const calculate = document.querySelector("#calculate");
    calculate.classList.remove("d-none");
    const inputDelete = document.querySelectorAll(".input-deletion");
    inputDelete.forEach((deletion) => {
        deletion.classList.add("d-none");
    });
}

async function alert(selector, valueName){
    const alert = document.createElement("div");
    alert.className = "alert";
    alert.textContent = valueName + " cannot be empty";
    alert.style.color = "red";
    selector.parentNode.appendChild(alert);

}

async function addCourse() {
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

    console.log(currentCourses);
    currentCourses.push({
        course: courseName.value,
        credit: credit.value,
        grade: "MV"
    });
    loadCurrentCourse().then(r => console.log(r));
    console.log(currentCourses);
}

async function save(saveName) {
    let calculator = Courses.push({[saveName]: await getCurrentCourseVec()});
    await writeTextFile('GPA_Calculator/saves.json', JSON.stringify(Courses), {dir: BaseDirectory.AppData});
    console.log("Saved");
}


async function getCurrentCourse() {
    let currentCourses = [];
    document.querySelectorAll('.grade-input-column').forEach((input, index) => {
        if (input.textContent){
            const courseName = input.textContent.split('(')[0].trim();
            const credit = input.textContent.split('(')[1].split(')')[0];
            let grade = document.querySelector(`#grade-input${index}`).value;
            if (!grade){
                grade = "MV";
            }
            currentCourses.push({
                course: courseName,
                credit: credit,
                grade: grade
            });
        }
    });
    return currentCourses;
}

async function calculateGPA() {
    let calculated = await invoke("get_calculation_detail", {courses: await getCurrentCourse()});
    result.innerHTML = calculated.replace(/\n/g, '<br />');
}

window.addEventListener("DOMContentLoaded", () => {
    initializeSaves().then(r => console.log(r));
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
    // document.querySelector("#save-course").addEventListener("click", async (e) => {
    //     await save("test");
    // });
    document.querySelector("#calculate").addEventListener("click", async (e) => {
        await calculateGPA();
    });
});
