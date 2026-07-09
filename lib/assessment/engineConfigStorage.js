// Session-scoped storage for the admin-editable engine policy overrides
// (see app/portal/settings). Values are stored in the same shape the
// engine's assess(input, configOverride) expects.

const STORAGE_KEY = "adha_engine_config";

export function loadEngineConfigOverride() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveEngineConfigOverride(configOverride) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configOverride));
}

export function clearEngineConfigOverride() {
  localStorage.removeItem(STORAGE_KEY);
}
