// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


use serde::de::Unexpected::Map;
use serde::Deserialize;
use serde_json::Value::Null;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

#[derive(Clone, Deserialize)]
struct CourseDetail {
    course: String,
    credit: String,
    grade: String,
}


fn is_numeric(s: &str) -> bool {
    match s.parse::<f64>() {
        Ok(_) => true,
        Err(_) => false,
    }
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

fn calculate_year_gpa(courses: Vec<CourseDetail>) -> f32 {
    let total_credit = get_credit_sum(courses.clone());
    let mut gpa: f32 = 0.0;
    for course in courses.iter() {
        if &course.grade != "MV" {
            let credit = &course.credit.parse::<f32>().unwrap();
            let percentage = credit / total_credit as f32;
            let mut grade;
            if is_numeric(&course.grade) {
                grade = course.grade.parse::<i16>().unwrap();
            } else {
                grade = get_number_from_grade(&course.grade).unwrap();
            }
            if grade > 0 {
                grade -= get_second_char_as_number(&course.grade).unwrap();
            }
            gpa += grade as f32 * percentage;
        }
    }
    gpa
}

#[tauri::command]
fn get_calculation_detail(courses: Vec<CourseDetail>) -> String {
    let total_credit = get_credit_sum(courses.clone());
    let mut result: String = String::new();
    result = format!("{}Total Credit: {}\n", result, total_credit);

    let gpa = calculate_year_gpa(courses.clone());
    let rounded_gpa = gpa.round() as i16;
    let gpa_2dp = (gpa * 100.0).round() / 100.0;
    let letter_grade = get_grade_from_number(rounded_gpa);
    result = format!("{}GPA: {} {}", result, letter_grade, gpa_2dp);
    result
}

fn calculate_course_weight_and_distribution(course: &CourseDetail, total_credit: i16, distribution: &mut std::collections::HashMap<String, f32>, weight: f32) {
    let course_weigh = (course.credit.parse::<i16>().unwrap() / total_credit) as f32 * weight;
    if course.grade.starts_with("A") {
        *distribution.entry("A".to_string()).or_insert(0.0) += course_weigh;
    } else if course.grade.starts_with("B") {
        *distribution.entry("B".to_string()).or_insert(0.0) += course_weigh;
    } else if course.grade.starts_with("C") {
        *distribution.entry("C".to_string()).or_insert(0.0) += course_weigh;
    } else if course.grade.starts_with("D") {
        *distribution.entry("D".to_string()).or_insert(0.0) += course_weigh;
    } else {
        *distribution.entry("Fail".to_string()).or_insert(0.0) += course_weigh;
    }
}

fn get_indirect_honours_class(year3: Vec<CourseDetail>, year4:Vec<CourseDetail>, gpa:f32) -> String {
    let mut distribution = std::collections::HashMap::new();
    let total_credit = get_credit_sum(year3.clone()) + get_credit_sum(year4.clone());
    for course in year3.iter() {
        calculate_course_weight_and_distribution(course, total_credit, &mut distribution, 0.4);
    }
    for course in year4.iter() {
        calculate_course_weight_and_distribution(course, total_credit, &mut distribution, 0.6);
    }
    Null.to_string()
}

fn get_direct_honours_class(gpa: f32) -> String {
    if gpa >= 17.5 && gpa <= 22.0{
        "First Class Honours".to_string()
    } else if gpa >= 14.5 && gpa <= 17.0{
        "Second Class Honours (Upper Division)".to_string()
    } else if gpa >= 11.5 && gpa <= 14.0{
        "Second Class Honours (Lower Division)".to_string()
    } else if gpa >= 8.5 && gpa <= 11.0{
        "Third Class Honours".to_string()
    } else if gpa <= 8.0{
        "Fail".to_string()
    } else {
        Null.to_string()
    }
}

//function to calculate honours
#[tauri::command]
fn calculate_honours(year3: Vec<CourseDetail>, year4:Vec<CourseDetail>){
    let y3_detail = get_calculation_detail(year3.clone());
    let y4_detail = get_calculation_detail(year4.clone());
    let y3_gpa = calculate_year_gpa(year3.clone());
    let y4_gpa = calculate_year_gpa(year4.clone());
    let mut result = format!("Junior Honours:\n{}\nSenior Honours:\n {}\n" , y3_detail, y4_detail);
    let final_gpa = ((y3_gpa * 0.4 + y4_gpa * 0.6)*10.0).round() / 10.0;
    result = format!("{}Final GPA: {} * 0.4 + {} * 0.6 = {} (1 d.p.)", result, y3_gpa, y4_gpa,final_gpa);
    let mut honours_class = get_direct_honours_class(final_gpa);
    if honours_class == Null.to_string(){
        honours_class = get_indirect_honours_class(year3, year4, final_gpa);
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_credit_sum, get_calculation_detail, calculate_honours])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
