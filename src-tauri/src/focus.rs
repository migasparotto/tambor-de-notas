//! Gives the keyboard back to the window that had it before the drum (usually the video).
//!
//! A Windows "observer" (event hook) is told every time the front window changes and keeps
//! the last one that is not this app. Windows lets the front app hand the keyboard to another
//! window, so `return_focus`, called on Esc while the drum has the keyboard, works reliably.
//! On other systems these functions do nothing.
//!
//! The decision is a pure rule (`can_return_to`), tested below. `windows_impl` is the thin
//! shell: it translates what Windows answers into a `WindowState` and does what the rule says.

/// The window saved to give the keyboard back to.
#[cfg(any(windows, test))]
enum WindowState {
    NotSaved,
    Closed,
    Hidden,
    Minimized,
    Normal,
}

/// Only a normal window gets the keyboard back: otherwise the user clicks the video instead.
#[cfg(any(windows, test))]
fn can_return_to(state: WindowState) -> bool {
    matches!(state, WindowState::Normal)
}

#[cfg(windows)]
mod windows_impl {
    use super::{WindowState, can_return_to};
    use std::sync::atomic::{AtomicIsize, Ordering};
    use windows_sys::Win32::Foundation::HWND;
    use windows_sys::Win32::System::Threading::GetCurrentProcessId;
    use windows_sys::Win32::UI::Accessibility::{HWINEVENTHOOK, SetWinEventHook};
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        EVENT_SYSTEM_FOREGROUND, GA_ROOT, GetAncestor, GetWindowThreadProcessId, IsIconic,
        IsWindow, IsWindowVisible, SetForegroundWindow, WINEVENT_OUTOFCONTEXT,
    };

    /// The last front window that is not ours (0 = none yet).
    static PREVIOUS: AtomicIsize = AtomicIsize::new(0);

    unsafe extern "system" fn on_foreground(
        _hook: HWINEVENTHOOK,
        _event: u32,
        hwnd: HWND,
        _object: i32,
        _child: i32,
        _thread: u32,
        _time: u32,
    ) {
        unsafe {
            let root = GetAncestor(hwnd, GA_ROOT);
            if root.is_null() {
                return;
            }
            let mut pid = 0;
            GetWindowThreadProcessId(root, &mut pid);
            if pid != GetCurrentProcessId() {
                PREVIOUS.store(root as isize, Ordering::Relaxed);
            }
        }
    }

    pub fn start_watching() {
        // Must run on a thread with a message loop (the app main thread, in `setup`).
        unsafe {
            SetWinEventHook(
                EVENT_SYSTEM_FOREGROUND,
                EVENT_SYSTEM_FOREGROUND,
                std::ptr::null_mut(),
                Some(on_foreground),
                0,
                0,
                WINEVENT_OUTOFCONTEXT,
            );
        }
    }

    fn state_of(window: HWND) -> WindowState {
        unsafe {
            if window.is_null() {
                WindowState::NotSaved
            } else if IsWindow(window) == 0 {
                WindowState::Closed
            } else if IsWindowVisible(window) == 0 {
                WindowState::Hidden
            } else if IsIconic(window) != 0 {
                WindowState::Minimized
            } else {
                WindowState::Normal
            }
        }
    }

    pub fn return_focus() -> bool {
        let previous = PREVIOUS.load(Ordering::Relaxed) as HWND;
        can_return_to(state_of(previous)) && unsafe { SetForegroundWindow(previous) != 0 }
    }
}

/// Starts watching which window is in front, to know where to give the keyboard back.
pub fn start_watching() {
    #[cfg(windows)]
    windows_impl::start_watching();
}

/// Gives the keyboard back to the window that had it before the drum.
/// Returns false when there is none (or it was closed or minimized).
#[tauri::command]
pub fn return_focus() -> bool {
    #[cfg(windows)]
    return windows_impl::return_focus();
    #[cfg(not(windows))]
    false
}

#[cfg(test)]
mod tests {
    use super::{WindowState, can_return_to};

    #[test]
    fn does_not_return_when_no_window_was_saved() {
        assert!(!can_return_to(WindowState::NotSaved));
    }

    #[test]
    fn does_not_return_to_a_closed_window() {
        assert!(!can_return_to(WindowState::Closed));
    }

    #[test]
    fn does_not_return_to_a_hidden_window() {
        assert!(!can_return_to(WindowState::Hidden));
    }

    #[test]
    fn does_not_return_to_a_minimized_window() {
        assert!(!can_return_to(WindowState::Minimized));
    }

    #[test]
    fn returns_to_a_normal_window() {
        assert!(can_return_to(WindowState::Normal));
    }
}
