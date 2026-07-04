/** BMI = kg / m² (SPEC §5.2), rounded to 1 decimal. Shown as "reference only". */
export function bmi(weightKg: number, heightCm: number): number {
  if (weightKg <= 0 || heightCm <= 0) return 0;
  const meters = heightCm / 100;
  return Math.round((weightKg / (meters * meters)) * 10) / 10;
}
