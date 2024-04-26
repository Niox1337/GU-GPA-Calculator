// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


use serde::Deserialize;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

#[derive(Clone, Deserialize)]
struct CourseDetail {
    course: String,
    credit: String,
    grade: String,
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

fn get_grade_from_number(grade: i16) -> String {
    let letter = match grade {
        18..=22 => "A",
        15..=17 => "B",
        12..=14 => "C",
        9..=11 => "D",
        6..=8 => "E",
        3..=5 => "F",
        1..=2 => "G",
        _ => "H",
    };
    let number = (get_number_from_grade(letter).unwrap() - grade).to_string();
    format!("{}{}", letter, number)
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
    let mut gpa: f32 = 0.0;
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
            let final_grade = (grade as f32 * percentage * 100.0).round() / 100.0;
            gpa += grade as f32 * percentage;
            result = format!("{}{} contributes {} * ({} / {})  = {}\n", result, course.course, grade, credit, total_credit, final_grade)
        } else {
            result = format!("{}{} doesn't count\n", result, course.course)
        }
    }
    let rounded_gpa = gpa.round() as i16;
    let gpa_2dp = (gpa * 100.0).round() / 100.0;
    let letter_grade = get_grade_from_number(rounded_gpa);
    result = format!("{}GPA: {} {}", result, letter_grade, gpa_2dp);
    result
}

//function to calculate honours
#[tauri::command]
fn calculate_honours(year3: Vec<CourseDetail>, year4:Vec<CourseDetail>){
    let y3_detail = get_calculation_detail(year3);
    let y4_detail = get_calculation_detail(year4);
    let y3_gpa = y3_detail.split_whitespace().last().unwrap().parse::<f32>().unwrap();
    let y4_gpa = y4_detail.split_whitespace().last().unwrap().parse::<f32>().unwrap();
    let result = format!("Junior Honours:\n{}\nSenior Honours:\n {}" , y3_detail, y4_detail);
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_credit_sum, get_calculation_detail, calculate_honours])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
