async function parseJSONSafe(res) {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); }
  catch (e) { console.error("Server returned non-JSON:", text); throw new Error("Invalid server response"); }
}

function normalizeVendorResponse(data) {
  if (!data) return { ok: true, vendor: null };
  if (data.vendor) return { ok: data.ok !== false, vendor: data.vendor };
  if (data.id && data.email) return { ok: true, vendor: { id: data.id, email: data.email, name: data.name } };
  return { ok: data.ok !== false, vendor: null };
}

export async function vPOST(path, body) {
  const res = await fetch(`/api/vendor${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await parseJSONSafe(res);
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return normalizeVendorResponse(data);
}

export async function vGET(path) {
  const res = await fetch(`/api/vendor${path}`, { credentials: "include" });
  const data = await parseJSONSafe(res);
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return normalizeVendorResponse(data);
}

// ★ 單張圖片上傳：正確路徑 /api/vendor/upload，欄位名 file
export async function vUPLOAD(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/vendor/upload', {
    method: 'POST',
    credentials: 'include',
    body: fd,
  });
  const data = await parseJSONSafe(res);
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  if (!data || !data.url) throw new Error('UPLOAD_NO_URL');
  return data.url; // e.g. "/uploads/vendor/20241020_xxx.jpg"
}
