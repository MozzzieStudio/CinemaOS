// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Initialize Sentry for error tracking
    let _sentry_guard = cinema_os_core_lib::observability::init_sentry();

    cinema_os_core_lib::run();
}
