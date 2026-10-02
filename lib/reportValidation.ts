export function validateFieldValue(
  value: string,
  field: { name: string; type: string; isRequired: boolean },
) {
  const trimmedValue = value.trim()

  if (field.isRequired && !trimmedValue) {
    throw new Error(`${field.name} is required`)
  }

  if (!trimmedValue) return

  if (field.type === "NUMBER" || field.type === "PERCENTAGE") {
    const parsedValue = Number(trimmedValue)
    if (Number.isNaN(parsedValue)) {
      throw new Error(`${field.name} must be a valid number`)
    }

    if (field.type === "PERCENTAGE" && (parsedValue < 0 || parsedValue > 100)) {
      throw new Error(`${field.name} must be between 0 and 100`)
    }
  }
}
