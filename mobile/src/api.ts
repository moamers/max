import type {
  InsightsResponse,
  PeriodsResponse,
  TagsResponse,
  UploadErrorResponse,
  UploadResponse,
} from "@max/shared";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("EXPO_PUBLIC_API_URL is not set");
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    throw new Error(`Request to ${path} failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchPeriods(): Promise<PeriodsResponse> {
  return getJson<PeriodsResponse>("/api/periods");
}

export function fetchInsights(): Promise<InsightsResponse> {
  return getJson<InsightsResponse>("/api/insights");
}

export function fetchTagBreakdown(periodId: number): Promise<TagsResponse> {
  return getJson<TagsResponse>(`/api/periods/${periodId}/tags`);
}

export async function uploadWorkbook(file: {
  uri: string;
  name: string;
  mimeType?: string | null;
}): Promise<UploadResponse> {
  const formData = new FormData();
  // React Native's FormData accepts this shape for file uploads (uri/name/type),
  // distinct from the web File API used by the Next.js upload page.
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType ?? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  } as unknown as Blob);

  const res = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    body: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new ApiError((data as UploadErrorResponse).error ?? "Upload failed", data as UploadErrorResponse);
  }
  return data as UploadResponse;
}

export class ApiError extends Error {
  details: UploadErrorResponse;
  constructor(message: string, details: UploadErrorResponse) {
    super(message);
    this.details = details;
  }
}
