export function getApiErrorMessage(err, fallback = 'Something went wrong') {
  const data = err?.response?.data;
  if (data?.errors?.[0]?.msg) return data.errors[0].msg;
  if (data?.error) return data.error;
  if (err?.message) return err.message;
  return fallback;
}
