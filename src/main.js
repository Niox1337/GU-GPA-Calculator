const {createDir, BaseDirectory, readTextFile, writeTextFile, exists} = window.__TAURI__.fs;
const {invoke} = window.__TAURI__.tauri;
let Courses = {};
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
    console.log(Courses);
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
          <path fill="#f78f8f" d="M8 9.704L4.057 13.646 2.354 11.943 6.296 8 2.354 4.057 4.057 2.354 8 6.296 11.943 2.354 13.646 4.057 9.704 8 13.646 11.943 11.943 13.646z"></path><path fill="#c74343" d="M11.943,2.707l1.35,1.35L9.704,7.646L9.35,8l0.354,0.354l3.589,3.589l-1.35,1.35L8.354,9.704L8,9.35 L7.646,9.704l-3.589,3.589l-1.35-1.35l3.589-3.589L6.65,8L6.296,7.646L2.707,4.057l1.35-1.35l3.589,3.589L8,6.65l0.354-0.354 L11.943,2.707 M11.943,2L8,5.943L4.057,2L2,4.057L5.943,8L2,11.943L4.057,14L8,10.057L11.943,14L14,11.943L10.057,8L14,4.057 L11.943,2L11.943,2z"></path>
</svg></div>
        </label>
  `
    });
    document.querySelectorAll(".input-deletion").forEach((deletion) => {
        deletion.addEventListener("click", (e) => {
            let courseName = e.target.parentNode.parentNode.childNodes[0].nodeValue.trim();
            let courseIndex = currentCourses.findIndex(course => course.course === courseName);
            if (courseIndex !== -1) {
                currentCourses.splice(courseIndex, 1);
                e.target.parentNode.parentNode.remove();
                loadCurrentCourse().then(r => console.log(r));
            }
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

async function alert(selector, valueName) {
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

    currentCourses.push({
        course: courseName.value,
        credit: credit.value,
        grade: "MV"
    });
    loadCurrentCourse().then(r => console.log(r));
    courseName.value = '';
}

async function save(saveName) {
    Courses[saveName] = await getCurrentCourse();
    await writeTextFile('GPA_Calculator/saves.json', JSON.stringify(Courses), {dir: BaseDirectory.AppData});
    updateNavbar().then(r => console.log(r));
}

async function updateNavbar() {
    const navbarList = document.querySelector("#setup-nav");
    while (navbarList.firstChild) {
        navbarList.firstChild.remove();
    }

    Object.keys(Courses).forEach(key => {
        navbarList.innerHTML += `<li class="nav-item"> ${key} </li>`;
    });
}


async function getCurrentCourse() {
    let currentCourses = [];
    document.querySelectorAll('.grade-input-column').forEach((input, index) => {
        if (input.textContent) {
            const courseName = input.textContent.split('(')[0].trim();
            const credit = input.textContent.split('(')[1].split(')')[0];
            let grade = document.querySelector(`#grade-input${index}`).value;
            if (!grade) {
                grade = "MV";
            }
            currentCourses.push({
                course: courseName,
                credit: credit,
                grade: grade.toUpperCase()
            });
        }
    });
    return currentCourses;
}

async function calculateGPA() {
    let calculated = await invoke("get_calculation_detail", {courses: await getCurrentCourse()});
    result.innerHTML = calculated.replace(/\n/g, '<br />');
}

window.addEventListener("DOMContentLoaded", async () => {
    await initializeSaves().then(r => console.log(r));
    console.log(Courses);
    await updateNavbar();
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
    document.querySelector("#save-confirm").addEventListener("click", async (e) => {
        await save(document.querySelector("#save-name").value);
    });
    document.querySelector("#calculate").addEventListener("click", async (e) => {
        await calculateGPA();
    });
});
