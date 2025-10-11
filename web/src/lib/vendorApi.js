// web/src/lib/vendorApi.js
async function parseJSONSafe(res) {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); }
  catch (e) { console.error("Server returned non-JSON:", text); throw new Error("Invalid server response"); }
}

// 將後端回傳標準化為 { ok, vendor }（不論是純物件或包一層）
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

// ★ 新增：上傳單張圖片，回傳 URL（/uploads/xxx）
export async function vUPLOAD(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/vendor/uploads', {
    method: 'POST',
    credentials: 'include',
    body: fd,
  });
  const data = await parseJSONSafe(res);
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return data && data.url; // e.g. "/uploads/1697050100000_img.jpg"
}
