#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{collections::HashMap, os::unix::fs::PermissionsExt, sync::Arc};

use tokio::{fs, sync::Mutex, process::Command};
use serde::{Serialize, Deserialize};

use tauri::{
  AppHandle, CustomMenuItem, Icon, Manager, State, SystemTray, SystemTrayEvent,
  SystemTrayMenu, SystemTrayMenuItem,
};

const WG_SCRIPT: &str = include_str!("../scripts/wg.sh");

const WG_ZENITY_SCRIPT: &str = include_str!("../scripts/zenity.sh");

const APP_TITLE: &str = "Wireguard GUI";

const TRAY_CONNECTED_ICON: &[u8] =
  include_bytes!("../icons/tray_connected.png");
const TRAY_DISCONNECTED_ICON: &[u8] = include_bytes!("../icons/tray.png");

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct IpPayload {
  pub origin: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfilePartial {
  pub name: String,
  pub content: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, Eq, PartialEq)]
enum ConnSt {
  Connected,
  Disconnected,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct AppStInner {
  pub conn_st: ConnSt,
  pub conf_dir: String,
  pub current: Option<String>,
  pub pub_ip: Option<String>,
  pub profiles: Vec<Profile>,
}

impl Default for AppStInner {
  fn default() -> Self {
    let home = std::env::var("HOME").unwrap();
    Self {
      conn_st: ConnSt::Disconnected,
      conf_dir: format!("{home}/.config/wireguard-gui"),
      current: None,
      pub_ip: None,
      profiles: vec![]
    }
  }
}

unsafe impl Send for AppStInner {}

#[derive(Clone, Debug)]
struct AppSt(Arc<Mutex<AppStInner>>);

unsafe impl Send for AppSt {}


#[derive(Debug, Clone, Serialize, Deserialize)]
struct AppError {
  message: String,
}

unsafe impl Send for AppError {}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Profile {
  pub name: String,
  pub content: String,
}

/// We create 2 scripts one to open a popup to allow root
/// And the other to execute wg-quick as root with the provided config
async fn create_scripts(conf_dir: &str) {
  std::fs::create_dir_all(
    format!("{conf_dir}/profiles"),
  )
  .unwrap();
  let wg_path = format!("{conf_dir}/wg.sh");
  std::fs::write(&wg_path, WG_SCRIPT).unwrap();
  std::fs::set_permissions(&wg_path, std::fs::Permissions::from_mode(0o700))
    .unwrap();
  let zenity_path = format!("{conf_dir}/zenity.sh");
  fs::write(&zenity_path, WG_ZENITY_SCRIPT).await.unwrap();
  fs::set_permissions(&zenity_path, std::fs::Permissions::from_mode(0o700)).await
    .unwrap();
}

async fn get_con_st(current: &str) -> ConnSt {
  let output = Command::new("ip")
    .args(["-br", "link", "show", "dev", &current])
    .output().await
    .expect("ip command failed");
  // check status code
  if output.status.success() {
    return ConnSt::Connected;
  }
  ConnSt::Disconnected
}

async fn init_app_st() -> AppSt {
  let default_state = AppStInner::default();
  let conf_dir = default_state.conf_dir.clone();
  let current = fs::read_to_string(format!("{conf_dir}/current")).await;
  let app_state = AppSt(Arc::new(Mutex::new(default_state)));
  create_scripts(&conf_dir).await;
  let mut s = app_state.0.lock().await;
  println!("current: {:?}", current);
  s.pub_ip = match get_pub_ip().await {
    Ok(pub_ip) => Some(pub_ip),
    Err(_) => None,
  };
  if let Ok(current) = current {
    s.conn_st = get_con_st(&current).await;
    s.current = Some(current);
    if s.conn_st == ConnSt::Disconnected {
      s.current = None;
      let _ = fs::remove_file(format!("{}/current", s.conf_dir)).await;
    }
    println!("state: {:?}", s);
  }
  println!("app inited");
  println!("app state: {:?}", app_state);
  app_state.clone()
}

async fn create_tray_menu(app_state: &AppSt) -> SystemTray {
  let wgui = CustomMenuItem::new("wgui".to_string(), APP_TITLE).disabled();
  let open = CustomMenuItem::new("open".to_string(), "Open");
  let quit = CustomMenuItem::new("quit".to_string(), "Quit");
  let mut system_tray = SystemTray::new();
  let mut tray_menu = SystemTrayMenu::new()
    .add_item(wgui)
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(open);
  let s = app_state.0.lock().await;
  if s.conn_st == ConnSt::Connected {
    tray_menu = tray_menu.add_item(CustomMenuItem::new(
      "conn_info".to_string(),
      format!("Selected {}", s.current.clone().unwrap()),
    ).disabled());
    system_tray =
      system_tray.with_icon(Icon::Raw(TRAY_CONNECTED_ICON.to_vec()));
  } else {
    tray_menu = tray_menu.add_item(
      CustomMenuItem::new("conn_info".to_string(), "Not connected").disabled(),
    );
    system_tray =
      system_tray.with_icon(Icon::Raw(TRAY_DISCONNECTED_ICON.to_vec()));
  }
  tray_menu = tray_menu
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(quit);
  system_tray.with_menu(tray_menu).with_tooltip(APP_TITLE)
}

async fn exec_wg(app_state: &AppSt, profile: &str) {
  let conf_dir = app_state.0.lock().await.conf_dir.clone();
  let mut envs = HashMap::new();
  envs.insert("PROFILE".to_owned(), profile);
  Command::new("bash")
    .args([format!("{conf_dir}/wg.sh")])
    .envs(envs)
    .output().await
    .expect("failed to execute process");
}

async fn get_pub_ip() -> Result<String, AppError> {
  let payload = reqwest::get("https://httpbin.org/ip")
  .await.unwrap()
  .json::<IpPayload>()
  .await.unwrap();
  println!("payload: {:?}", payload);
  Ok(payload.origin)
}

#[tauri::command]
async fn get_state(app_state: State<'_, AppSt>) -> Result<AppStInner, AppError> {
  Ok(app_state.0.lock().await.clone())
}

#[tauri::command]
async fn create_profile(app_state: State<'_, AppSt>, new_profile: ProfilePartial) -> Result<(), AppError> {
  let s = app_state.0.lock().await.clone();
  // allow only alphanumerac
  let name = new_profile.name;
  if !name.chars().all(|c| c.is_alphanumeric()) {
    return Err(AppError {
      message: "Name must only containt alphanumeric values".into(),
    });
  }
  let path = format!("{}/profiles/{name}.conf", s.conf_dir);
  if fs::try_exists(&path).await.unwrap() {
    return Err(AppError {
      message: "Profile already exist".into(),
    })
  }
  fs::write(path, new_profile.content).await.unwrap();
  Ok(())
}

#[tauri::command]
async fn delete_profile(app: AppHandle, app_state: State<'_, AppSt>, profile_name: String) -> Result<(), AppError> {
  let s = app_state.0.lock().await.clone();
  if let Some(current) = s.current {
    if current == profile_name {
      exec_wg(&app_state, &current).await;
        // Sleep for 1seconds to let time for network to stabilize
        tokio::time::sleep(std::time::Duration::from_secs(5)).await;
        let mut s = app_state.0.lock().await;
        s.current = None;
        s.conn_st = ConnSt::Disconnected;
        app
          .tray_handle()
          .set_icon(Icon::Raw(TRAY_DISCONNECTED_ICON.to_vec()))
          .unwrap();
        app.tray_handle().get_item("conn_info").set_title("Not connected").unwrap();
        app.tray_handle().get_item("conn_info").set_enabled(false).unwrap();
        s.pub_ip = match get_pub_ip().await {
          Ok(pub_ip) => Some(pub_ip),
          Err(_) => None,
        };
    };
  };
  let path = format!("{}/profiles/{profile_name}.conf", s.conf_dir);
  let _ = fs::remove_file(path).await;
  Ok(())
}

#[tauri::command]
async fn connect_profile(app: AppHandle, app_state: State<'_, AppSt>, profile: String) -> Result<(), AppError>{
  let s = app_state.0.lock().await.clone();
  let conf_dir = s.conf_dir.clone();
  let current = s.current;
  if let Some(current) = current {
    exec_wg(&app_state, &current).await;
  }
  exec_wg(&app_state, &profile).await;
  tokio::fs::write(format!("{conf_dir}/current"), &profile.trim()).await.unwrap();
  // Sleep for 1seconds to let time for network to stabilize
  tokio::time::sleep(std::time::Duration::from_secs(5)).await;
  app
    .tray_handle()
    .set_icon(Icon::Raw(TRAY_CONNECTED_ICON.to_vec()))
    .unwrap();
  app
    .tray_handle()
    .get_item("conn_info")
    .set_title(format!("Selected {profile}"))
    .unwrap();
  app
    .tray_handle()
    .get_item("conn_info")
    .set_enabled(false)
    .unwrap();
  let mut s = app_state.0.lock().await;
  s.current = Some(profile);
  s.conn_st = ConnSt::Connected;
  s.pub_ip = match get_pub_ip().await {
    Ok(pub_ip) => Some(pub_ip),
    Err(_) => None,
  };
  Ok(())
}

#[tauri::command]
async fn disconnect(app: AppHandle, app_state: State<'_, AppSt>) -> Result<(), AppError>{
  let s = app_state.0.lock().await.clone();
  let Some(current) = s.current else {
    return Ok(());
  };
  exec_wg(&app_state, &current).await;
  let _ = fs::remove_file(format!("{}/current", s.conf_dir)).await;
  // Sleep for 1seconds to let time for network to stabilize
  tokio::time::sleep(std::time::Duration::from_secs(5)).await;
  let mut s = app_state.0.lock().await;
  s.current = None;
  s.conn_st = ConnSt::Disconnected;
  app
    .tray_handle()
    .set_icon(Icon::Raw(TRAY_DISCONNECTED_ICON.to_vec()))
    .unwrap();
  app.tray_handle().get_item("conn_info").set_title("Not connected").unwrap();
  app.tray_handle().get_item("conn_info").set_enabled(false).unwrap();
  s.pub_ip = match get_pub_ip().await {
    Ok(pub_ip) => Some(pub_ip),
    Err(_) => None,
  };
  Ok(())
}

#[tauri::command]
async fn update_profile(app_state: State<'_, AppSt>, profile_name: String, profile: ProfilePartial) -> Result<(), AppError> {
  let s = app_state.0.lock().await.clone();
  let path = format!("{}/profiles/{profile_name}.conf", s.conf_dir);
  if !fs::try_exists(&path).await.unwrap() {
    return Err(AppError {
      message: "Profile does not exists".into(),
    });
  }
  let mut is_current = false;
  if let Some(current) = s.current {
    if profile_name == current {
      exec_wg(&app_state, &profile_name).await;
      is_current = true;
    }
  }
  fs::write(path, profile.content).await.unwrap();
  if !is_current {
    return Ok(())
  }
  exec_wg(&app_state, &profile_name).await;
  tokio::time::sleep(std::time::Duration::from_secs(5)).await;
  let mut s = app_state.0.lock().await;
  s.pub_ip = match get_pub_ip().await {
    Ok(pub_ip) => Some(pub_ip),
    Err(_) => None,
  };
  Ok(())
}

#[tauri::command]
async fn list_profile(app_state: State<'_, AppSt>) -> Result<Vec<Profile>, AppError> {
  let conf_dir = app_state.0.lock().await.conf_dir.clone();
  let path = format!("{conf_dir}/profiles");
  let mut dirs = fs::read_dir(path).await.unwrap();
  let mut profiles = Vec::new();
  while let Ok(Some(dir)) = dirs.next_entry().await {
    let path = dir.path();
    let file_name = path.file_name().unwrap().to_str().unwrap();
    if file_name.ends_with(".conf") {
      let content = match fs::read_to_string(&path).await {
        Err(_) => String::default(),
        Ok(s) => s,
      };
      let profile = Profile {
        name: file_name.replace(".conf", "").to_string(),
        content,
      };
      profiles.push(profile);
    }
  }
  Ok(profiles)
}

#[tokio::main]
async fn main() {
  let app_state = init_app_st().await;
  let system_tray = create_tray_menu(&app_state).await;
  tauri::Builder::default()
    .system_tray(system_tray)
    .on_system_tray_event(move |app, event| {
      if let SystemTrayEvent::MenuItemClick { id, .. } = event {
        match id.as_str() {
          "quit" => {
            app.exit(0);
          }
          "open" => {
            let window = match app.get_window("main") {
              Some(window) => window,
              None => {
                #[allow(unused_mut, unused_assignments)]
                let mut url = "index.html".to_owned();
                #[cfg(feature = "dev")]
                {
                  url = app.config().build.dev_path.to_string();
                }
                tauri::WindowBuilder::new(
                  app,
                  "main",
                  tauri::WindowUrl::App(url.into()),
                )
                .title(APP_TITLE)
                .visible(false)
                .resizable(false)
                .build()
                .unwrap()
              }
            };
            window.show().unwrap();
            window.set_focus().unwrap();
          }
          _ => {}
        }
      }
    })
    .manage(app_state)
    .invoke_handler(tauri::generate_handler![
      get_state,
      list_profile,
      connect_profile,
      disconnect,
      create_profile,
      delete_profile,
      update_profile,
    ])
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .build(tauri::generate_context!())
    .expect("error while building tauri application")
    .run(|_app_handle, event| {
      if let tauri::RunEvent::ExitRequested { api, .. } = event {
        api.prevent_exit();
      }
    });
}
