// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
use std::fs::OpenOptions;
use std::io::{Read, Write};
use serde::{Serialize, Deserialize};
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(Serialize, Deserialize)]
struct Course{
    course_name: String,
    credit: String,
    grade: String
}

fn save(save_name: String, courses: Vec<Course>){
    let mut saves: HashMap<String, Vec<Course>>;
    let mut file = OpenOptions::new()
        .write(true)
        .create(true)
        .open("saves.json")
        .unwrap();

    let mut content = String::new();
    file.read_to_string(&mut content).unwrap();

    if !content.is_empty(){
        saves = serde_json::from_str(&content).unwrap();
    } else {
        saves = HashMap::new();
    }
    saves.insert(save_name, courses);
    let json = serde_json::to_string_pretty(&saves).unwrap();
    file.set_len(0).unwrap();
    file.write_all(json.as_bytes()).unwrap();
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
