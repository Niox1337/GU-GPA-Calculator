// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


use serde::Deserialize;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

#[derive(Clone, Deserialize)]
struct CourseDetail{
    course: String,
    credit: String,
    grade: String
}


fn get_number_from_grade(grade: &str) -> Option<i16> {
    match grade.chars().next() {
        Some('A') => Some(23),
        Some('B') => Some(18),
        Some('C') => Some(15),
        Some('D') => Some(12),
        Some('E') => Some(9),
        Some('F') => Some(6),
        Some('G') => Some(3),
        _ => Some(0),
    }
}

fn get_second_char_as_number(grade: &str) -> Option<i16> {
    grade.chars().nth(1).and_then(|c| c.to_digit(10).map(|n| n as i16))
}

#[tauri::command]
fn get_credit_sum(courses: Vec<CourseDetail>) -> i16 {
    let mut total_credit = 0;
    for course in courses.iter() {
        if course.grade != "MV" {
            total_credit += course.credit.parse::<i16>().unwrap();
        }
    }
    total_credit
}

#[tauri::command]
fn get_calculation_detail(courses: Vec<CourseDetail>) -> String {
    let total_credit = get_credit_sum(courses.clone());
    let mut gpa:f32 = 0.0;
    let mut result: String = String::new();
    result = format!("{}Total Credit: {}\n", result, total_credit);

    for course in courses.iter() {
        if &course.grade != "MV" {
            let credit = &course.credit.parse::<f32>().unwrap();
            let percentage = credit / total_credit as f32;
            let mut grade = get_number_from_grade(&course.grade).unwrap();
            if grade > 0 {
                grade -= get_second_char_as_number(&course.grade).unwrap();
            }
            let final_grade = grade as f32 * percentage;
            gpa += grade as f32 * percentage;
            result = format!("{}{} contributes {} * ({} / {})  = {}\n", result, course.course, grade, credit, total_credit, final_grade)
        } else {
            result = format!("{}{} doesn't count\n", result, course.course)
        }
    }
    result = format!("{}Total Grade: {}", result, gpa);
    result
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_credit_sum, get_calculation_detail])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
