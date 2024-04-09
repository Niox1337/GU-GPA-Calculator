const { invoke } = window.__TAURI__.tauri;

let greetInputEl;
let greetMsgEl;
let Courses = {};

async function greet() {
  // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
  greetMsgEl.textContent = await invoke("greet", { name: greetInputEl.value });
}

async function countGradeInput(){
  let gradeInputs = document.querySelectorAll('.grade-input');
  return gradeInputs.length;
}

async function showEditCourseForm(){
  const addCourse = document.querySelector("#add-course-form");
  addCourse.classList.remove("d-none")
  const editCourse = document.querySelector("#edit-course-button");
  editCourse.classList.add("d-none")
}

async function finishEditing(){
  const addCourse = document.querySelector("#add-course-form");
  addCourse.classList.add("d-none")
  const editCourse = document.querySelector("#edit-course-button");
  editCourse.classList.remove("d-none")
}

async function addCourse(){
  let inputColumn;
  const courseName = document.querySelector("#course-name");
  const credit = document.querySelector("#credit");

  const existingAlerts = document.querySelectorAll(".alert");
  existingAlerts.forEach(alert => alert.remove());

  if (!courseName.value.trim() || !credit.value.trim()) {
    if (!courseName.value.trim()) {
      const alert = document.createElement("div");
      alert.className = "alert";
      alert.textContent = "Course name cannot be empty";
      alert.style.color = "red";
      courseName.parentNode.appendChild(alert);
    }
    if (!credit.value.trim()) {
      const alert = document.createElement("div");
      alert.className = "alert";
      alert.textContent = "Credit cannot be empty";
      alert.style.color = "red";
      credit.parentNode.appendChild(alert);
    }
    return;
  }
  const inputCount = await countGradeInput();
  if (inputCount % 2 === 0){
    inputColumn = document.querySelector("#input-col1");
  } else {
    inputColumn = document.querySelector("#input-col2");
  }
  inputColumn.innerHTML += `
        <label class="input-column fade-in" id="input-label${inputCount+1}"> ${courseName.value}
          <input class="grade-input" id="grade-input${inputColumn+1}">
        </label>
  `
  const label = document.querySelector(`#input-label${inputCount+1}`);
  label.addEventListener('animationend', () => {
    label.classList.remove('fade-in');
  });

    Courses[courseName.value] = {
      grade: null,
      credit: credit.value,
    };
}

window.addEventListener("DOMContentLoaded", () => {
  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
  document.querySelector("#edit-course-button").addEventListener("click", (e) => {
    showEditCourseForm().then(r => console.log(r));
  });
  document.querySelector("#finish-editing").addEventListener("click", (e) => {
    finishEditing().then(r => console.log(r));
  });
  document.querySelector("#add-course").addEventListener("click", (e) => {
    addCourse().then(r => console.log(r));
  });
});
