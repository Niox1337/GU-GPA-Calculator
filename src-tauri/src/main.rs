// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

struct CourseDetail{
    credit: String,
    grade: String
}

struct Course{
    name: String,
    details: CourseDetail
}

enum Grade {
    A = 18, B = 15, C = 12, D = 9, E = 6, F = 3, G = 1, H = 0
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

fn get_credit_sum(courses: Vec<Course>) -> i16 {
    courses.iter()
        .filter(|course| &course.details.grade != "MV")
        .map(|course| course.details.credit.parse::<i16>().unwrap())
        .sum()
}

#[tauri::command]
fn calculate_gpa(courses: Vec<Course>) -> f32 {
    let total_credit = get_credit_sum(courses.clone());
    let mut total_grade:f32 = 0.0;
    for course in courses.iter() {
        if &course.details.grade != "MV" {
            let credit = &course.details.credit.parse::<f32>().unwrap();
            let percentage = total_credit as f32 / credit;
            let mut grade = get_number_from_grade(&course.details.grade).unwrap();
            if grade > 0 {
                grade -= get_second_char_as_number(&course.details.grade).unwrap();
            }
            total_grade += grade as f32 * percentage;
        }
    }
    total_grade
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, calculate_gpa])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
