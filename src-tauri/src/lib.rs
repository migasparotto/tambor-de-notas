mod focus;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|_app| {
            focus::start_watching();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![focus::return_focus])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
