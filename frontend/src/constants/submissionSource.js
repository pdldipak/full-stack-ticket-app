/** Matches backend `submission_source` on tickets. */
export function labelSubmissionSource(source) {
  if (source === 'public') return 'Web order';
  return 'Seller';
}
