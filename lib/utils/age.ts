/**
 * Calculates a person's current age from a date-of-birth string (YYYY-MM-DD).
 * Accounts for whether the birthday has occurred yet this year.
 */
export function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birth = new Date(dateOfBirth)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}
