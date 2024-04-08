const { invoke } = window.__TAURI__.tauri;

let greetInputEl;
let greetMsgEl;

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

window.addEventListener("DOMContentLoaded", () => {
  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
  document.querySelector("#edit-course-button").addEventListener("click", (e) => {
    showEditCourseForm().then(r => console.log(r));
  });
});
