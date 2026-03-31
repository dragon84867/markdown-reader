use std::fs;
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileNode>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub loaded: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub path: String,
    pub name: String,
    pub snippet: String,
    pub line: u32,
}

/// Read file content
#[command]
pub async fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

/// Open file dialog and return selected path
#[command]
pub async fn open_file_dialog(app: tauri::AppHandle) -> Result<String, String> {
    use tauri_plugin_dialog::DialogExt;

    let file_path = app.dialog()
        .file()
        .add_filter("Markdown", &["md"])
        .blocking_pick_file();

    match file_path {
        Some(path) => Ok(path.to_string()),
        None => Err("No file selected".to_string()),
    }
}

/// Open folder dialog and return selected path
#[command]
pub async fn open_folder_dialog(app: tauri::AppHandle) -> Result<String, String> {
    use tauri_plugin_dialog::DialogExt;

    // Use file dialog with directories enabled
    let folder_path = app.dialog()
        .file()
        .blocking_pick_file();

    match folder_path {
        Some(path) => {
            let path_str = path.to_string();
            // Verify it's a directory
            if fs::metadata(&path_str).map(|m| m.is_dir()).unwrap_or(false) {
                Ok(path_str)
            } else {
                Err("Selected path is not a directory".to_string())
            }
        }
        None => Err("No folder selected".to_string()),
    }
}

/// Scan directory for all files (non-recursive, single level)
#[command]
pub async fn scan_directory(path: String) -> Result<Vec<FileNode>, String> {
    scan_single_directory(&path).map_err(|e| e.to_string())
}

/// Scan a single directory level - shows all folders and files
fn scan_single_directory(path: &str) -> Result<Vec<FileNode>, std::io::Error> {
    let dir = fs::read_dir(path)?;
    let mut nodes: Vec<FileNode> = vec![];

    for entry in dir {
        let entry = entry?;
        let entry_path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        // Skip hidden files and directories
        if name.starts_with('.') {
            continue;
        }

        let is_dir = entry_path.is_dir();
        let path_str = entry_path.to_string_lossy().to_string();

        if is_dir {
            // 显示所有子目录（用户可点击展开）
            nodes.push(FileNode {
                name,
                path: path_str,
                is_dir: true,
                children: Some(vec![]), // 空数组表示未加载
                loaded: Some(false),
            });
        } else {
            // 显示所有文件
            nodes.push(FileNode {
                name,
                path: path_str,
                is_dir: false,
                children: None,
                loaded: None,
            });
        }
    }

    // Sort: directories first, then files, alphabetically
    nodes.sort_by(|a, b| {
        if a.is_dir != b.is_dir {
            b.is_dir.cmp(&a.is_dir)
        } else {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        }
    });

    Ok(nodes)
}

/// Check if file is a text file (can be displayed as plain text)
fn is_text_file(name: &str) -> bool {
    let lower = name.to_lowercase();
    // Common text file extensions
    lower.ends_with(".md")
        || lower.ends_with(".markdown")
        || lower.ends_with(".txt")
        || lower.ends_with(".json")
        || lower.ends_with(".yaml")
        || lower.ends_with(".yml")
        || lower.ends_with(".xml")
        || lower.ends_with(".html")
        || lower.ends_with(".css")
        || lower.ends_with(".js")
        || lower.ends_with(".ts")
        || lower.ends_with(".vue")
        || lower.ends_with(".py")
        || lower.ends_with(".rs")
        || lower.ends_with(".go")
        || lower.ends_with(".java")
        || lower.ends_with(".c")
        || lower.ends_with(".cpp")
        || lower.ends_with(".h")
        || lower.ends_with(".sh")
        || lower.ends_with(".bash")
        || lower.ends_with(".zsh")
        || lower.ends_with(".conf")
        || lower.ends_with(".cfg")
        || lower.ends_with(".ini")
        || lower.ends_with(".log")
        || lower.ends_with(".csv")
        || lower.ends_with(".toml")
        || lower.ends_with(".sql")
        || lower.ends_with(".env")
        || lower.ends_with(".gitignore")
        || lower.ends_with(".dockerignore")
}

/// Search files for content
#[command]
pub async fn search_files(query: String, directory: Option<String>) -> Result<Vec<SearchResult>, String> {
    let search_dir = directory.unwrap_or_else(|| ".".to_string());
    let mut results: Vec<SearchResult> = vec![];

    if query.is_empty() {
        return Ok(results);
    }

    search_recursive(&search_dir, &query, &mut results, 50).map_err(|e| e.to_string())?;

    Ok(results)
}

fn search_recursive(
    dir: &str,
    query: &str,
    results: &mut Vec<SearchResult>,
    max_results: usize,
) -> Result<(), std::io::Error> {
    if results.len() >= max_results {
        return Ok(());
    }

    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        if name.starts_with('.') {
            continue;
        }

        if path.is_dir() {
            search_recursive(&path.to_string_lossy(), query, results, max_results)?;
        } else if is_text_file(&name) {
            if let Ok(content) = fs::read_to_string(&path) {
                for (line_num, line) in content.lines().enumerate() {
                    if line.to_lowercase().contains(&query.to_lowercase()) {
                        let snippet = if line.len() > 100 {
                            format!("{}...", &line[..100])
                        } else {
                            line.to_string()
                        };

                        results.push(SearchResult {
                            path: path.to_string_lossy().to_string(),
                            name: name.clone(),
                            snippet,
                            line: line_num as u32 + 1,
                        });

                        if results.len() >= max_results {
                            return Ok(());
                        }
                    }
                }
            }
        }
    }

    Ok(())
}