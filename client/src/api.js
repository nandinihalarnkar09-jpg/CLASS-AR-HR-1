import { demoRequest, demoActive, enableDemo } from "./demoStore";

const SESSION_KEY = "meridian-ats-session";

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getUserId() {
  const s = getSession();
  if (s?.type === "staff") return s.user.id;
  return Number(localStorage.getItem("meridian-ats-user-id") || 2);
}

export function setUserId(id) {
  localStorage.setItem("meridian-ats-user-id", String(id));
}

export function isDemoMode() {
  return demoActive;
}

async function request(path, options = {}) {
  const session = getSession();
  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    "x-user-id": String(getUserId()),
    ...options.headers,
  };
  if (session?.type === "staff") headers["x-auth-role"] = "staff";
  if (session?.type === "candidate") {
    headers["x-auth-role"] = "candidate";
    headers["x-candidate-id"] = String(session.candidate.id);
  }

  if (demoActive) {
    return demoRequest(path, options, getUserId(), session);
  }

  try {
    const res = await fetch(path, { ...options, headers });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (res.status === 404 || (res.ok && typeof data === "string" && data.includes("<!doctype"))) {
      enableDemo();
      return demoRequest(path, options, getUserId(), session);
    }
    if (!res.ok) {
      const apiJson = data && typeof data === "object";
      if (!apiJson) {
        enableDemo();
        return demoRequest(path, options, getUserId(), session);
      }
      const err = new Error(data?.error || res.statusText);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  } catch (e) {
    if (e.status && e.status !== 404) throw e;
    enableDemo();
    return demoRequest(path, options, getUserId(), session);
  }
}

export const api = {
  demoAccounts: () => request("/api/auth/demo-accounts"),
  login: (body) => request("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  portalMe: () => request("/api/portal/me"),
  portalJobs: () => request("/api/portal/jobs"),
  portalApply: (job_id) => request("/api/portal/apply", { method: "POST", body: JSON.stringify({ job_id }) }),
  meta: () => request("/api/meta"),
  dashboard: () => request("/api/dashboard"),
  jobs: () => request("/api/jobs"),
  createJob: (body) => request("/api/jobs", { method: "POST", body: JSON.stringify(body) }),
  updateJob: (id, body) => request(`/api/jobs/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  candidates: (params = {}) => {
    const q = new URLSearchParams(params);
    return request(`/api/candidates?${q}`);
  },
  checkPhone: (phone, excludeId) =>
    request(`/api/candidates/check-phone?phone=${encodeURIComponent(phone)}&excludeId=${excludeId || ""}`),
  candidate: (id) => request(`/api/candidates/${id}`),
  createCandidate: (body) => request("/api/candidates", { method: "POST", body: JSON.stringify(body) }),
  updateCandidate: (id, body) => request(`/api/candidates/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  uploadResume: (id, file) => {
    const fd = new FormData();
    fd.append("resume", file);
    return request(`/api/candidates/${id}/resume`, { method: "POST", body: fd });
  },
  addNote: (id, body) => request(`/api/candidates/${id}/notes`, { method: "POST", body: JSON.stringify({ body }) }),
  pipeline: (jobId) => request(`/api/pipeline${jobId ? `?jobId=${jobId}` : ""}`),
  linkApplication: (candidate_id, job_id) =>
    request("/api/applications", { method: "POST", body: JSON.stringify({ candidate_id, job_id }) }),
  move: (id, body) => request(`/api/applications/${id}/move`, { method: "POST", body: JSON.stringify(body) }),
  scheduleInterview: (id, body) =>
    request(`/api/applications/${id}/interview`, { method: "POST", body: JSON.stringify(body) }),
  saveOffer: (id, body) => request(`/api/applications/${id}/offer`, { method: "POST", body: JSON.stringify(body) }),
  audit: () => request("/api/audit"),
};
