mod commands;

use commands::{read_file, open_file_dialog, open_folder_dialog, scan_directory, search_files};
use std::sync::Mutex;
use tauri::{Manager, Emitter, Listener};
use tauri_plugin_deep_link::DeepLinkExt;
use percent_encoding::percent_decode_str;

struct PendingFile(Mutex<Option<String>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .manage(PendingFile(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            read_file,
            open_file_dialog,
            open_folder_dialog,
            scan_directory,
            search_files,
            get_pending_file
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                }
            }

            let app_handle = app.handle().clone();

            // 处理命令行参数
            let args: Vec<String> = std::env::args().collect();
            for arg in args.iter().skip(1) {
                if let Some(path) = parse_and_validate_file(arg) {
                    set_pending_file(&app_handle, &path);
                    break;
                }
            }

            // 监听 deep-link 事件
            app.listen("deep-link://new-url", move |event: tauri::Event| {
                if let Ok(urls) = serde_json::from_str::<Vec<String>>(event.payload()) {
                    for url_str in urls {
                        if let Some(path) = parse_and_validate_file(&url_str) {
                            set_pending_file(&app_handle, &path);
                            break;
                        }
                    }
                }
            });

            // 检查 deep-link 当前值
            if let Ok(Some(urls)) = app.deep_link().get_current() {
                for url in urls {
                    if let Some(path) = parse_and_validate_file(&url.to_string()) {
                        set_pending_file(app.handle(), &path);
                        break;
                    }
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// 解析 URL/路径并验证是否为有效的文件
fn parse_and_validate_file(input: &str) -> Option<String> {
    let path = if input.starts_with("file://") {
        let decoded = percent_decode_str(input.trim_start_matches("file://"))
            .decode_utf8_lossy()
            .to_string();
        decoded
    } else {
        input.to_string()
    };

    // 接受任何存在的文件
    if std::path::Path::new(&path).exists() {
        Some(path)
    } else {
        None
    }
}

/// 设置待打开文件并通知前端
fn set_pending_file(app: &tauri::AppHandle, path: &str) {
    let pending = app.state::<PendingFile>();
    if let Ok(mut guard) = pending.0.lock() {
        *guard = Some(path.to_string());
    }

    if let Err(e) = app.emit("file-open-request", path.to_string()) {
        eprintln!("Failed to emit file-open-request: {}", e);
    }
}

#[tauri::command]
fn get_pending_file(pending: tauri::State<PendingFile>) -> Option<String> {
    pending.0.lock().ok()?.take()
}