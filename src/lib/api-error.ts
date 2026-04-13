/**
 * Pesan error untuk ditampilkan ke pengguna.
 * AxiosError.message biasanya teknis ("Request failed with status code 409"), sementara
 * backend mengembalikan teks ramah di response.data.message.
 */
export function getApiErrorMessage(error: unknown, fallback = "Terjadi kesalahan"): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const res = error as { response?: { data?: unknown } };
    const data = res.response?.data;
    if (data && typeof data === "object") {
      const d = data as { message?: unknown; error?: unknown };
      if (typeof d.message === "string" && d.message.trim()) return d.message.trim();
      if (typeof d.error === "string" && d.error.trim()) return d.error.trim();
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
