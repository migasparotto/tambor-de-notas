//! The app's own log file, so that a crash leaves clues of what the app was doing.
//!
//! It lives in Rust, not in the interface, because it has to work exactly when the interface
//! does not: when the WebView fails to start, hangs or crashes. Every line goes through
//! `sanitize`, so no note text, title, subject, path or file name ever reaches the file.
//!
//! The decisions are pure rules (`sanitize`, `previous_session`, `suspension`), tested below.
//! The rest is the thin shell: plugin setup, the heartbeat thread and the Windows calls.

use std::time::Duration;

/// Name of the log file, inside the app's log folder (`%LOCALAPPDATA%\<identifier>\logs`).
const FILE_NAME: &str = "tambor";
/// Largest size of one log file, in bytes, before it is rotated.
const MAX_FILE_SIZE: u128 = 1_000_000;
/// Rotated files kept besides the active one: 4 + 1 = the last 5 files.
const KEEP_ROTATED: usize = 4;
/// How often the heartbeat is written.
pub const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(5 * 60);

/// First line of each session, also used to tell how the previous one ended.
const SESSION_START: &str = "Sessão iniciada";
/// Last line of a session that ended through the normal way out.
const SESSION_END: &str = "Encerrado normalmente";

/// How the previous session ended, read from the log before the new session writes to it.
#[derive(Debug, PartialEq)]
pub enum PreviousSession {
    /// No session start in the log (first run, or it rotated away).
    Unknown,
    /// The last session wrote its normal end mark.
    EndedNormally,
    /// The last session started but never wrote the end mark: it crashed or was killed.
    EndedAbruptly,
}

/// Tells how the previous session ended from the current log file's text.
pub fn previous_session(log: &str) -> PreviousSession {
    match log.rfind(SESSION_START) {
        None => PreviousSession::Unknown,
        Some(start) if log[start..].contains(SESSION_END) => PreviousSession::EndedNormally,
        Some(_) => PreviousSession::EndedAbruptly,
    }
}

/// When the time between two heartbeats is well past the interval, the computer was asleep
/// (or the app was frozen): returns how long the gap lasted beyond the interval.
pub fn suspension(elapsed: Duration, interval: Duration) -> Option<Duration> {
    (elapsed > interval + interval / 2).then(|| elapsed - interval)
}

/// Removes from a log message anything that could hold a note's content: quoted text, paths
/// and note file names (`AAAA-MM cor - título.md`, whose name contains the title).
pub fn sanitize(message: &str) -> String {
    let mut out = String::with_capacity(message.len());
    let chars: Vec<char> = message.chars().collect();
    let mut i = 0;
    while i < chars.len() {
        let c = chars[i];
        if let Some(close) = closing_quote(c) {
            match chars[i + 1..].iter().position(|&x| x == close) {
                Some(len) => {
                    out.push_str("<texto>");
                    i += len + 2;
                    continue;
                }
                None => {
                    out.push_str("<texto>");
                    break;
                }
            }
        }
        if starts_path(&chars, i) {
            out.push_str("<caminho>");
            // A ':' inside a path only follows a drive letter or `file`, so `: ` ends it.
            let colon_ends =
                |k: usize| chars[k] == ':' && chars.get(k + 1).is_none_or(|c| c.is_whitespace());
            while i < chars.len() && !(ends_path(chars[i]) || colon_ends(i)) {
                i += 1;
            }
            continue;
        }
        out.push(c);
        i += 1;
    }
    remove_note_file_names(&out)
}

fn closing_quote(c: char) -> Option<char> {
    match c {
        '"' => Some('"'),
        '\'' => Some('\''),
        '`' => Some('`'),
        '“' => Some('”'),
        '‘' => Some('’'),
        '«' => Some('»'),
        _ => None,
    }
}

/// A path starts at `C:\`, `C:/`, `\\server` or `file:`.
fn starts_path(chars: &[char], i: usize) -> bool {
    let at = |k: usize| chars.get(i + k).copied();
    let drive = at(0).is_some_and(|c| c.is_ascii_alphabetic())
        && at(1) == Some(':')
        && matches!(at(2), Some('\\' | '/'))
        && (i == 0 || !chars[i - 1].is_ascii_alphanumeric());
    let unc = at(0) == Some('\\') && at(1) == Some('\\');
    let file_url = chars[i..]
        .iter()
        .take(5)
        .collect::<String>()
        .eq_ignore_ascii_case("file:");
    drive || unc || file_url
}

/// Paths may have spaces ("Tambor de Notas"), so they only end at a delimiter or line end.
fn ends_path(c: char) -> bool {
    matches!(c, ')' | ']' | '>' | ',' | ';' | '\n' | '\r')
}

/// Removes any `….md` name, from its `AAAA-MM ` start when there is one. Otherwise, as a note
/// name has spaces, from the start of that part of the message (after `:`, `|`, `(` or a line
/// break): removing too much is better than leaving part of a title.
fn remove_note_file_names(text: &str) -> String {
    // ASCII lowercase keeps every byte position, so `lower` and `out` stay aligned.
    let lower = text.to_ascii_lowercase();
    let mut out = text.to_string();
    let mut search_end = lower.len();
    while let Some(md) = lower[..search_end].rfind(".md") {
        let end = md + 3;
        let word_ends = lower[end..]
            .chars()
            .next()
            .is_none_or(|c| !c.is_alphanumeric());
        if !word_ends {
            search_end = md;
            continue;
        }
        let start = note_name_start(&lower[..md]).unwrap_or_else(|| {
            let segment = lower[..md]
                .rfind([':', '|', '(', '\n'])
                .map_or(0, |p| p + 1);
            segment + (lower[segment..md].len() - lower[segment..md].trim_start().len())
        });
        out.replace_range(start..end, "<arquivo>");
        search_end = start;
    }
    out
}

/// Start of the last `AAAA-MM ` (year and month) on the same line, if any.
fn note_name_start(before: &str) -> Option<usize> {
    let line_start = before.rfind('\n').map_or(0, |p| p + 1);
    let bytes = before.as_bytes();
    (line_start..bytes.len().saturating_sub(7))
        .rev()
        .find(|&p| {
            bytes[p..p + 4].iter().all(u8::is_ascii_digit)
                && bytes[p + 4] == b'-'
                && bytes[p + 5..p + 7].iter().all(u8::is_ascii_digit)
                && bytes[p + 7] == b' '
        })
}

/// Starts the log: reads how the previous session ended, attaches the log plugin, writes the
/// session start and starts the heartbeat. Any failure is only reported: the app opens anyway.
pub fn start(app: &tauri::AppHandle) {
    use tauri::Manager;
    use tauri_plugin_log::{RotationStrategy, Target, TargetKind, TimezoneStrategy};

    let previous = app
        .path()
        .app_log_dir()
        .ok()
        .and_then(|dir| std::fs::read_to_string(dir.join(format!("{FILE_NAME}.log"))).ok())
        .map_or(PreviousSession::Unknown, |log| previous_session(&log));

    let plugin = tauri_plugin_log::Builder::new()
        .clear_targets()
        .target(Target::new(TargetKind::LogDir {
            file_name: Some(FILE_NAME.into()),
        }))
        .max_file_size(MAX_FILE_SIZE)
        .rotation_strategy(RotationStrategy::KeepSome(KEEP_ROTATED))
        .timezone_strategy(TimezoneStrategy::UseLocal)
        .level(log::LevelFilter::Warn)
        .level_for("tambor_de_notas_lib", log::LevelFilter::Info)
        .level_for(tauri_plugin_log::WEBVIEW_TARGET, log::LevelFilter::Info)
        .format(|out, message, record| {
            out.finish(format_args!(
                "[{}][{}][{}] {}",
                TimezoneStrategy::UseLocal.get_now(),
                record.level(),
                record.target(),
                sanitize(&message.to_string())
            ))
        })
        .build();
    if let Err(error) = app.plugin(plugin) {
        eprintln!("Não consegui abrir o log do app: {error}");
        return;
    }

    std::panic::set_hook(Box::new(|info| log::error!("Pânico no Rust: {info}")));
    log::info!(
        "{SESSION_START}: versão {}, WebView2 {}, Windows {}",
        app.package_info().version,
        tauri::webview_version().unwrap_or_else(|_| "desconhecida".into()),
        windows_version()
    );
    match previous {
        PreviousSession::EndedAbruptly => {
            log::warn!(
                "A sessão anterior terminou sem a marca de encerramento normal (queda ou encerramento forçado)"
            )
        }
        PreviousSession::EndedNormally => log::info!("A sessão anterior terminou normalmente"),
        PreviousSession::Unknown => log::info!("Sem registro da sessão anterior"),
    }
    start_heartbeat();
}

/// Writes the normal end mark. Called when the app exits through the normal way out.
pub fn end() {
    log::info!("{SESSION_END}");
}

fn start_heartbeat() {
    std::thread::spawn(|| {
        let mut last = std::time::SystemTime::now();
        loop {
            std::thread::sleep(HEARTBEAT_INTERVAL);
            let now = std::time::SystemTime::now();
            let elapsed = now.duration_since(last).unwrap_or_default();
            if let Some(gap) = suspension(elapsed, HEARTBEAT_INTERVAL) {
                log::warn!(
                    "Suspensão detectada: cerca de {} min sem batimento",
                    gap.as_secs() / 60
                );
            }
            log::info!("Batimento: {}", memory_usage());
            last = now;
        }
    });
}

#[cfg(windows)]
fn memory_usage() -> String {
    use windows_sys::Win32::System::ProcessStatus::{
        GetProcessMemoryInfo, PROCESS_MEMORY_COUNTERS, PROCESS_MEMORY_COUNTERS_EX,
    };
    use windows_sys::Win32::System::Threading::GetCurrentProcess;
    let mut counters: PROCESS_MEMORY_COUNTERS_EX = unsafe { std::mem::zeroed() };
    let size = std::mem::size_of::<PROCESS_MEMORY_COUNTERS_EX>() as u32;
    // SAFETY: `counters` is a valid, writable struct of the size given.
    let ok = unsafe {
        GetProcessMemoryInfo(
            GetCurrentProcess(),
            (&raw mut counters).cast::<PROCESS_MEMORY_COUNTERS>(),
            size,
        )
    };
    if ok == 0 {
        return "memória desconhecida".into();
    }
    format!(
        "memória em uso {} MB, reservada {} MB",
        counters.WorkingSetSize / 1_048_576,
        counters.PrivateUsage / 1_048_576
    )
}

#[cfg(not(windows))]
fn memory_usage() -> String {
    "memória desconhecida".into()
}

#[cfg(windows)]
fn windows_version() -> String {
    use windows_sys::Wdk::System::SystemServices::RtlGetVersion;
    use windows_sys::Win32::System::SystemInformation::OSVERSIONINFOW;
    let mut info: OSVERSIONINFOW = unsafe { std::mem::zeroed() };
    info.dwOSVersionInfoSize = std::mem::size_of::<OSVERSIONINFOW>() as u32;
    // SAFETY: `info` is a valid, writable struct with its size set, as the call requires.
    if unsafe { RtlGetVersion(&mut info) } != 0 {
        return "desconhecido".into();
    }
    format!(
        "{}.{}.{}",
        info.dwMajorVersion, info.dwMinorVersion, info.dwBuildNumber
    )
}

#[cfg(not(windows))]
fn windows_version() -> String {
    "desconhecido".into()
}

#[cfg(test)]
mod tests {
    use super::*;

    const NOTE_PATH: &str = r"C:\Dados\Alguém\OneDrive\Documentos\Tambor de Notas\notas\ativas\2026-11 vermelho - Aula de Cálculo.md";

    #[test]
    fn sanitize_removes_note_paths_and_file_names() {
        let line = format!("Falha ao salvar {NOTE_PATH}: arquivo em uso");
        let clean = sanitize(&line);
        assert_eq!(clean, "Falha ao salvar <caminho>: arquivo em uso");
        assert!(!clean.contains("Cálculo") && !clean.contains("Documentos"));
    }

    #[test]
    fn sanitize_removes_a_bare_note_file_name_with_its_title() {
        let clean = sanitize("não achei 2026-11 vermelho - Aula de Cálculo.md na lista");
        assert_eq!(clean, "não achei <arquivo> na lista");
    }

    #[test]
    fn sanitize_removes_a_note_file_name_without_the_date_to_the_start_of_its_part() {
        // Seen in the real app: a mangled path lost the "2026-11 " of the name.
        let clean =
            sanitize("Falha ao salvar: notasativas6-11 vermelho - Segredo de Teste.md: em uso");
        assert_eq!(clean, "Falha ao salvar: <arquivo>: em uso");
        assert!(!clean.contains("Segredo"));
    }

    #[test]
    fn sanitize_keeps_positions_with_letters_that_change_size_in_lowercase() {
        let clean = sanitize("İstanbul ok, 2026-11 verde - Aula.md fim");
        assert_eq!(clean, "İstanbul ok, <arquivo> fim");
    }

    #[test]
    fn sanitize_removes_quoted_text_titles_and_subjects() {
        let clean = sanitize(
            "Erro ao renomear \"Aula de Cálculo\" (assunto 'Integrais', texto “derivada de x²”)",
        );
        assert!(
            !clean.contains("Cálculo")
                && !clean.contains("Integrais")
                && !clean.contains("derivada")
        );
        assert_eq!(
            clean,
            "Erro ao renomear <texto> (assunto <texto>, texto <texto>)"
        );
    }

    #[test]
    fn sanitize_removes_an_unclosed_quote_to_the_end() {
        assert_eq!(sanitize("Erro em \"Aula de Cál"), "Erro em <texto>");
    }

    #[test]
    fn sanitize_removes_forward_slash_unc_and_file_url_paths() {
        assert_eq!(
            sanitize("em C:/Dados/x/notas/a.md, de novo"),
            "em <caminho>, de novo"
        );
        assert_eq!(sanitize(r"rede \\servidor\notas\a.md"), "rede <caminho>");
        assert_eq!(sanitize("url file:///C:/notas/a.md"), "url <caminho>");
    }

    #[test]
    fn sanitize_keeps_ordinary_messages_and_web_addresses() {
        let line = "TypeError: x is undefined at http://tauri.localhost/assets/index.js:12:3";
        assert_eq!(sanitize(line), line);
        assert_eq!(
            sanitize("Batimento: memória em uso 40 MB"),
            "Batimento: memória em uso 40 MB"
        );
        assert_eq!(sanitize("lendo README.mdx"), "lendo README.mdx");
    }

    #[test]
    fn previous_session_is_unknown_without_a_start() {
        assert_eq!(previous_session(""), PreviousSession::Unknown);
        assert_eq!(
            previous_session("[x][WARN] algo\n"),
            PreviousSession::Unknown
        );
    }

    #[test]
    fn previous_session_ended_normally_when_the_last_start_has_an_end() {
        let log = format!(
            "{SESSION_START}: v1\n{SESSION_END}\n{SESSION_START}: v2\nBatimento\n{SESSION_END}\n"
        );
        assert_eq!(previous_session(&log), PreviousSession::EndedNormally);
    }

    #[test]
    fn previous_session_ended_abruptly_when_the_last_start_has_no_end() {
        let log = format!("{SESSION_START}: v1\n{SESSION_END}\n{SESSION_START}: v2\nBatimento\n");
        assert_eq!(previous_session(&log), PreviousSession::EndedAbruptly);
    }

    #[test]
    fn suspension_only_when_the_gap_is_well_past_the_interval() {
        let interval = HEARTBEAT_INTERVAL;
        assert_eq!(suspension(interval, interval), None);
        assert_eq!(suspension(interval + interval / 2, interval), None);
        assert_eq!(suspension(interval * 7, interval), Some(interval * 6));
    }
}
