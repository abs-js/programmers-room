// api.js - Wrapper for the Supabase KV Edge Function
// IMPORTANT: User must adjust the function name in API_URL if needed

const SUPABASE_URL = "https://mfwqqkzlqlklnrgabvvx.supabase.co"; // adjust
const SUPABASE_KEY = "sb_publishable_QI81OZKskWRgjBz5ZoYABQ_Py3m3Zb2"; // adjust
const API_URL = `${SUPABASE_URL}/functions/v1/kv`; // CHANGE the function name 'kv' to your actual Edge Function name

async function apiCall(payload) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('API Error:', err);
    return { success: false, error: err.message };
  }
}

async function createTable(table) {
  return apiCall({ action: 'createTable', table });
}

async function setData(table, key, value) {
  const fullKey = key.startsWith('-ProRom_') ? key : `-ProRom_${key}`;
  return apiCall({ action: 'set', table, key: fullKey, value });
}

async function getData(table, key) {
  const fullKey = key.startsWith('-ProRom_') ? key : `-ProRom_${key}`;
  const res = await apiCall({ action: 'get', table, key: fullKey });
  return res.success ? res.value : null;
}

async function deleteData(table, key) {
  const fullKey = key.startsWith('-ProRom_') ? key : `-ProRom_${key}`;
  return apiCall({ action: 'delete', table, key: fullKey });
}

async function listData(table) {
  const res = await apiCall({ action: 'list', table });
  if (!res.success) return [];
  // Filter only our prefixed keys and strip prefix for convenience if needed
  return (res.data || []).map(item => ({
    key: item.key,
    value: item.value
  }));
}

async function clearTable(table) {
  return apiCall({ action: 'clear', table });
}

// Helper to ensure tables exist
async function initTables() {
  const tables = ['users', 'projects', 'pending_users', 'contributions', 'reports'];
  for (const t of tables) {
    await createTable(t);
  }
}

// Export for other scripts (global since no modules for simplicity on GH Pages)
window.API = {
  createTable, setData, getData, deleteData, listData, clearTable, initTables, apiCall
};
