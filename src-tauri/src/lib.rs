use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, State, Emitter,
};
use tokio::process::Command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UsageData {
    pub today: DayData,
    pub session: Option<SessionData>,
    pub recent: Vec<DayData>,
    pub totals: TotalData,
    #[serde(rename = "lastUpdated")]
    pub last_updated: String,
    pub mode: String,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DayData {
    pub date: String,
    pub cost: f64,
    #[serde(rename = "inputTokens", default)]
    pub input_tokens: f64,
    #[serde(rename = "outputTokens", default)]
    pub output_tokens: f64,
    #[serde(rename = "cacheCreationTokens", default)]
    pub cache_creation_tokens: f64,
    #[serde(rename = "cacheReadTokens", default)]
    pub cache_read_tokens: f64,
    #[serde(rename = "totalTokens", default)]
    pub total_tokens: f64,
    #[serde(rename = "modelsUsed", default)]
    pub models_used: Vec<String>,
    #[serde(rename = "modelBreakdowns", default)]
    pub model_breakdowns: serde_json::Value,
    #[serde(default)]
    pub models: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SessionData {
    pub id: Option<String>,
    pub cost: f64,
    #[serde(default)]
    pub is_active: bool,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TotalData {
    #[serde(default)]
    pub cost: Option<f64>,
    pub weekly_cost: Option<f64>,
    pub monthly_cost: Option<f64>,
    #[serde(rename = "inputTokens", default)]
    pub input_tokens: f64,
    #[serde(rename = "outputTokens", default)]
    pub output_tokens: f64,
    #[serde(rename = "cacheCreationTokens", default)]
    pub cache_creation_tokens: f64,
    #[serde(rename = "cacheReadTokens", default)]
    pub cache_read_tokens: f64,
    #[serde(rename = "totalCost", default)]
    pub total_cost: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub polling_frequency: String,
    pub auto_start: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            polling_frequency: "5min".to_string(),
            auto_start: true,
        }
    }
}

pub struct AppState {
    pub usage_data: Arc<Mutex<Option<UsageData>>>,
    pub settings: Arc<Mutex<AppSettings>>,
    pub tray_icon: Arc<Mutex<Option<TrayIcon>>>,
}

#[tauri::command]
async fn get_usage_data(
    state: State<'_, AppState>,
) -> Result<UsageData, String> {
    match execute_ccusage_helper().await {
        Ok(data) => {
            *state.usage_data.lock().unwrap() = Some(data.clone());
            Ok(data)
        }
        Err(e) => Err(format!("Failed to get usage data: {}", e)),
    }
}

#[tauri::command]
async fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    Ok(state.settings.lock().unwrap().clone())
}

#[tauri::command]
async fn update_settings(
    new_settings: AppSettings,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<(), String> {
    match state.settings.lock() {
        Ok(mut settings) => {
            *settings = new_settings.clone();
        }
        Err(e) => {
            let error_msg = format!("Failed to lock settings mutex: {}", e);
            eprintln!("{}", error_msg);
            return Err(error_msg);
        }
    }

    // Restart the monitoring timer with new settings
    restart_monitoring_timer(app, new_settings).await;

    Ok(())
}

#[tauri::command]
async fn show_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn hide_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn quit_app(app: AppHandle) -> Result<(), String> {
    app.exit(0);
    Ok(())
}

async fn execute_ccusage_helper() -> Result<UsageData, Box<dyn std::error::Error + Send + Sync>> {
    let script = r#"
        import { exec } from 'child_process';
        import { promisify } from 'util';

        const execAsync = promisify(exec);

        async function getUsageData() {
            try {
                const now = new Date();
                const today = now.toISOString().split('T')[0];

                // Use ccusage CLI directly to get fresh data
                const { stdout: ccusageOutput } = await execAsync('bunx ccusage --json');

                if (!ccusageOutput || ccusageOutput.trim() === '') {
                    throw new Error('ccusage returned empty output');
                }

                const ccusageData = JSON.parse(ccusageOutput);


                // Handle both old format (array) and new format (object with daily property)
                let dailyData;
                if (Array.isArray(ccusageData)) {
                    // Old format: direct array
                    dailyData = ccusageData;
                } else if (ccusageData && ccusageData.daily && Array.isArray(ccusageData.daily)) {
                    // New format: object with daily property
                    dailyData = ccusageData.daily;
                } else {
                    throw new Error('ccusage returned invalid data structure: ' + JSON.stringify(ccusageData).substring(0, 200));
                }


                // Transform ccusage data format to match our Rust struct expectations
                dailyData = dailyData.map(day => ({
                    ...day,
                    cost: day.totalCost || day.cost || 0  // Transform totalCost to cost
                }));

                const todayData = dailyData.find(d => d.date === today) || {
                    date: today,
                    cost: 0,
                    inputTokens: 0,
                    outputTokens: 0,
                    cacheCreationTokens: 0,
                    cacheReadTokens: 0,
                    totalTokens: 0,
                    modelsUsed: [],
                    modelBreakdowns: [],
                    models: {}
                };
                const recentData = dailyData.slice(-7);

                // Calculate totals manually since we're not using ccusage helper functions
                const totals = {
                    inputTokens: dailyData.reduce((sum, day) => sum + (day.inputTokens || 0), 0),
                    outputTokens: dailyData.reduce((sum, day) => sum + (day.outputTokens || 0), 0),
                    cacheCreationTokens: dailyData.reduce((sum, day) => sum + (day.cacheCreationTokens || 0), 0),
                    cacheReadTokens: dailyData.reduce((sum, day) => sum + (day.cacheReadTokens || 0), 0),
                    totalCost: dailyData.reduce((sum, day) => sum + (day.cost || 0), 0)  // Use transformed cost field
                };

                // Calculate weekly total (last 7 days)
                const weeklyTotal = recentData.reduce((sum, day) => sum + (day.cost || 0), 0);

                // Calculate monthly total (current month)
                const currentMonth = today.substring(0, 7); // YYYY-MM format
                const monthlyData = dailyData.filter(d => d.date.startsWith(currentMonth));
                const monthlyTotal = monthlyData.reduce((sum, day) => sum + (day.cost || 0), 0);

                // Add weekly and monthly to totals
                totals.weekly_cost = weeklyTotal;
                totals.monthly_cost = monthlyTotal;

                // Add compatibility field for frontend (it expects 'cost' field)
                totals.cost = totals.totalCost;

                // Session data is not available when using direct CLI approach
                let sessionData = null;

                // Add compatibility layer for frontend components
                if (todayData && todayData.modelsUsed) {
                    todayData.models = todayData.modelsUsed.reduce((acc, model) => {
                        acc[model] = true;
                        return acc;
                    }, {});
                }

                recentData.forEach(day => {
                    if (day && day.modelsUsed) {
                        day.models = day.modelsUsed.reduce((acc, model) => {
                            acc[model] = true;
                            return acc;
                        }, {});
                    }
                });

                const data = {
                    today: todayData,
                    session: sessionData,
                    recent: recentData,
                    totals,
                    lastUpdated: now.toISOString(),
                    mode: 'daily'
                };

                console.log(JSON.stringify(data));

            } catch (error) {
                const errorData = {
                    today: {
                        date: new Date().toISOString().split('T')[0],
                        cost: 0,
                        inputTokens: 0,
                        outputTokens: 0,
                        cacheCreationTokens: 0,
                        cacheReadTokens: 0,
                        totalTokens: 0,
                        modelsUsed: [],
                        modelBreakdowns: [],
                        models: {}
                    },
                    session: null,
                    recent: [],
                    totals: {
                        cost: 0,
                        totalCost: 0,
                        weekly_cost: 0,
                        monthly_cost: 0,
                        inputTokens: 0,
                        outputTokens: 0,
                        cacheCreationTokens: 0,
                        cacheReadTokens: 0
                    },
                    lastUpdated: new Date().toISOString(),
                    mode: 'daily',
                    error: error.message
                };

                console.log(JSON.stringify(errorData, null, 0));
                process.exit(1);
            }
        }

        getUsageData();
    "#;

    let output = Command::new("node")
        .args(&["--input-type=module", "-e", &script])
        .output()
        .await?;

    if !output.status.success() {
        let stderr_str = String::from_utf8_lossy(&output.stderr);
        // Only treat it as an error if there's actual stderr content indicating a real error
        // ccusage often outputs warnings to stderr that we should ignore
        if !stderr_str.trim().is_empty() && !stderr_str.contains("WARN") {
            return Err(format!(
                "Helper script failed: {}",
                stderr_str
            ).into());
        }
    }

    let stdout = String::from_utf8(output.stdout)?;

    // Find the JSON by looking for the last line that starts with '{'
    let lines: Vec<&str> = stdout.lines().collect();
    let json_line = lines
        .iter()
        .rev()
        .find(|line| line.trim().starts_with('{'))
        .ok_or("No JSON found in output")?;

    let usage_data: UsageData = serde_json::from_str(json_line.trim())
        .map_err(|e| format!("JSON parsing error: {} - JSON: {}", e, json_line.trim().chars().take(500).collect::<String>()))?;

    Ok(usage_data)
}

async fn update_tray_icon(app: AppHandle, usage_data: &UsageData) {
    let cost_text = format!("${:.2}", usage_data.today.cost);

    let state = app.state::<AppState>();
    if let Ok(mut tray_guard) = state.tray_icon.try_lock() {
        if let Some(tray) = tray_guard.as_mut() {
            let _ = tray.set_title(Some(&cost_text));

            // Update tooltip with more info
            let tooltip = if let Some(ref session) = usage_data.session {
                if session.is_active {
                    format!("Today: {} | Session: ${:.2} (Active)", cost_text, session.cost)
                } else {
                    format!("Today: {} | Session: ${:.2}", cost_text, session.cost)
                }
            } else {
                format!("Today: {} | Mode: {}", cost_text, usage_data.mode)
            };

            let _ = tray.set_tooltip(Some(&tooltip));
        }
    };
}

async fn start_monitoring_loop(app: AppHandle) {
    let app_clone = app.clone();

    tokio::spawn(async move {
        loop {
            let state = app_clone.state::<AppState>();
            let settings = state.settings.lock().unwrap().clone();
            let interval_secs = match settings.polling_frequency.as_str() {
                "1min" => 60,
                "5min" => 300,
                "10min" => 600,
                _ => 300, // default to 5 minutes
            };

            drop(settings); // Release the lock

            let result = execute_ccusage_helper().await;
            match result {
                Ok(data) => {
                    *state.usage_data.lock().unwrap() = Some(data.clone());
                    update_tray_icon(app_clone.clone(), &data).await;

                    // Emit event to frontend if window is open
                    let _ = app_clone.emit("usage-updated", &data);
                }
                Err(e) => {
                    eprintln!("Failed to fetch usage data: {}", e);
                }
            }

            tokio::time::sleep(Duration::from_secs(interval_secs)).await;
        }
    });
}

async fn restart_monitoring_timer(_app: AppHandle, _settings: AppSettings) {
    // The monitoring loop checks settings on each iteration, so no need to restart
    // Just update the settings, which is already done in update_settings
}

fn setup_tray(app: &AppHandle) -> Result<TrayIcon, Box<dyn std::error::Error + Send + Sync>> {
    // Create tray menu
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let show_item = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

    let tray = TrayIconBuilder::new()
        .title("$0.00")
        .tooltip("Claude Usage Monitor")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => {
                app.exit(0);
            }
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| match event {
            TrayIconEvent::Click { button, button_state, .. } => {
                if button == MouseButton::Left && button_state == MouseButtonState::Up {
                    let app = tray.app_handle();
                    if let Some(window) = app.get_webview_window("main") {
                        if window.is_visible().unwrap_or(false) {
                            let _ = window.hide();
                        } else {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                }
            }
            _ => {}
        })
        .build(app)?;

    Ok(tray)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let tray = setup_tray(app.handle()).map_err(|e| e.to_string())?;

            let state = AppState {
                usage_data: Arc::new(Mutex::new(None)),
                settings: Arc::new(Mutex::new(AppSettings::default())),
                tray_icon: Arc::new(Mutex::new(Some(tray))),
            };

            app.manage(state);

            // Handle window close events to prevent app exit
            if let Some(window) = app.get_webview_window("main") {
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        // Prevent the window from closing and hide it instead
                        api.prevent_close();
                        let _ = window_clone.hide();
                    }
                });
            }

            // Start the monitoring loop
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                start_monitoring_loop(app_handle).await;
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_usage_data,
            get_settings,
            update_settings,
            show_window,
            hide_window,
            quit_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
