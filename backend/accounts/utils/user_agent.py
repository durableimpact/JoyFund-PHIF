def parse_user_agent(user_agent: str) -> dict:
    if not user_agent:
        return {"browser": "", "os": "", "device_type": "", "device_name": ""}

    ua = user_agent.lower()

    browser = _detect_browser(ua, user_agent)
    os = _detect_os(ua)
    device_type = _detect_device_type(ua)
    device_name = f"{browser} on {os}" if browser and os else browser or os or "Unknown"

    return {
        "browser": browser,
        "os": os,
        "device_type": device_type,
        "device_name": device_name,
    }


def _detect_browser(ua: str, raw: str) -> str:
    if "edg/" in ua or "edge/" in ua:
        return _extract_version(raw, "Edg/") or _extract_version(raw, "Edge/") or "Edge"
    if "opr/" in ua or "opera" in ua:
        return _extract_version(raw, "OPR/") or "Opera"
    if "chrome/" in ua and "chromium" not in ua:
        return _extract_version(raw, "Chrome/") or "Chrome"
    if "firefox/" in ua:
        return _extract_version(raw, "Firefox/") or "Firefox"
    if "safari/" in ua:
        return _extract_version(raw, "Version/") + " Safari" or "Safari"
    return "Unknown"


def _detect_os(ua: str) -> str:
    if "windows nt 10" in ua:
        return "Windows 10"
    if "windows nt 11" in ua:
        return "Windows 11"
    if "windows nt 6.3" in ua:
        return "Windows 8.1"
    if "windows nt 6.2" in ua:
        return "Windows 8"
    if "windows nt 6.1" in ua:
        return "Windows 7"
    if "windows" in ua:
        return "Windows"
    if "mac os x" in ua or "macintosh" in ua:
        return "macOS"
    if "android" in ua:
        return "Android"
    if "ios" in ua or "iphone os" in ua or "ipad" in ua:
        return "iOS"
    if "linux" in ua:
        return "Linux"
    return "Unknown"


def _detect_device_type(ua: str) -> str:
    if "mobile" in ua or "iphone" in ua or "android" in ua and "tablet" not in ua:
        return "Mobile"
    if "tablet" in ua or "ipad" in ua or "playbook" in ua:
        return "Tablet"
    return "Desktop"


def is_unknown_device(device_info: dict) -> bool:
    return device_info.get("browser") == "Unknown" and device_info.get("os") == "Unknown"


def _extract_version(ua: str, prefix: str) -> str:
    idx = ua.find(prefix)
    if idx == -1:
        return prefix.rstrip("/")
    start = idx + len(prefix)
    end = ua.find(" ", start)
    version = ua[start:end] if end != -1 else ua[start:]
    return f"{prefix.rstrip('/')} {version.split('.')[0]}"
