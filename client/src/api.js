import { demoRequest, demoActive, enableDemo } from "./demoStore";

const USER_KEY = "meridian-ats-user-id";

export function getUserId() {
  return Number(localStorage.getItem(USER_KEY) || 2);
}

export function setUserId(id) {
  localStorage.setItem(USER_KEY, String(id));
}

export function isDemoMode() {
  return demoActive;
}

async function request(path, options = {}) {
  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    "x-user-id": String(getUserId()),
    ...options.headers,
  };

  if (demoActive) {
    return demoRequest(path, options, getUserId());
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
      return demoRequest(path, options, getUserId());
    }
    if (!res.ok) {
      const apiJson = data && typeof data === "object";
      if (!apiJson) {
        enableDemo();
        return demoRequest(path, options, getUserId());
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
    return demoRequest(path, options, getUserId());
  }
}

export const api = {
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
