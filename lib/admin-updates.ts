/**
 * Safe update utilities for Admin Portal
 * 
 * These utilities ensure that:
 * 1. Only intended fields are updated (no accidental overwrites)
 * 2. Related records are preserved
 * 3. Updates are validated before execution
 * 4. Errors are properly caught and reported
 */

export type UpdateValidation = {
  isValid: boolean
  errors: string[]
}

/**
 * Validates that update input doesn't contain unexpected null values
 * that would accidentally clear existing data
 */
export function validatePartialUpdate<T extends Record<string, any>>(
  existing: T,
  updates: Partial<T>,
  requiredFields: (keyof T)[],
): UpdateValidation {
  const errors: string[] = []

  // Check that required fields are either present in existing data or being updated
  for (const field of requiredFields) {
    const existingValue = existing[field]
    const updateValue = updates[field]

    // If the existing value is null and we're not providing a new value, that's an error
    if (existingValue == null && updateValue == null) {
      errors.push(`Cannot update: required field "${String(field)}" is missing`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Safely merges existing data with updates, preserving fields that aren't being changed
 * This prevents accidentally overwriting related data when updating a subset of fields
 */
export function safePartialUpdate<T extends Record<string, any>>(existing: T, updates: Partial<T>): T {
  const result = { ...existing }

  for (const [key, value] of Object.entries(updates)) {
    // Only update if the new value is explicitly provided (not undefined)
    if (value !== undefined) {
      result[key] = value
    }
  }

  return result
}

/**
 * Validates numeric IDs to prevent accidental cross-record updates
 */
export function validateId(id: any, fieldName: string = "ID"): { valid: boolean; error?: string } {
  if (typeof id !== "number" || id <= 0 || !Number.isInteger(id)) {
    return {
      valid: false,
      error: `Invalid ${fieldName}: must be a positive integer`,
    }
  }
  return { valid: true }
}

/**
 * Validates that related IDs exist before updating
 */
export async function validateRelatedRecord<T extends { id: number }>(
  repository: T[],
  id: number,
  recordType: string,
): Promise<{ valid: boolean; error?: string }> {
  const exists = repository.some((r) => r.id === id)
  if (!exists) {
    return {
      valid: false,
      error: `${recordType} with ID ${id} not found`,
    }
  }
  return { valid: true }
}
