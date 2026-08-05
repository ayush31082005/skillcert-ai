const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function apiRequest(path, options = {}) {
  const {
    returnErrorResponse = false,
    ...fetchOptions
  } = options;
  const isFormData =
    fetchOptions.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    cache: "no-store",
    ...fetchOptions,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(fetchOptions.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    /*
     * Missing/expired session application error nahi hai. Client-side request
     * ko reject karke Next.js dev overlay dikhane ki jagah user ko login par
     * bhejo. `next` se successful login ke baad same page restore ho sakega.
     */
    if (
      response.status === 401 &&
      typeof window !== "undefined"
    ) {
      const currentPath =
        window.location.pathname +
        window.location.search;

      if (
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/register")
      ) {
        window.location.replace(
          `/login?next=${encodeURIComponent(currentPath)}`
        );
      }

      return {
        ...data,
        ok: false,
        status: response.status,
        data: null,
      };
    }

    if (returnErrorResponse) {
      return {
        ...data,
        ok: false,
        status: response.status,
      };
    }

    const error = new Error(data.message || "API request failed");
    error.status = response.status;
    error.details = data.details;
    throw error;
  }
  return {
    ...data,
    ok: true,
    status: response.status,
  };
}

export function unwrap(response, key) {
  return key ? response?.data?.[key] : response?.data;
}

export const formatDate = (value) =>
  value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)) : "—";

export const formatDuration = (seconds = 0) => {
  const total = Math.round(Number(seconds) || 0);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

export const statusTone = (status) => {
  if (["completed", "submitted", "valid", "published"].includes(status)) return "success";
  if (["failed", "revoked"].includes(status)) return "danger";
  if (["processing", "pending", "review_required", "started"].includes(status)) return "warning";
  return "neutral";
};
