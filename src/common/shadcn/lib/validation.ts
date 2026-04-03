// TODO: Maybe this file shouldn't be in common/shadcn/

import parsePhoneNumberFromString from "libphonenumber-js"

/* eslint-disable quotes */
const VALID_NAME_REGEXP = new RegExp("^[A-Za-z 0-9'-]{1,30}$", 'i')

type ValidationFunc = (value: any) => string | undefined

export function applyAll(...validators: Array<ValidationFunc>) {
  return (value: any) => {
    // for now we will just return the first error
    for (const validator of validators) {
      const err = validator(value)

      if (err) return err;
    }
  }
}

export function validateNameLength(input: string) {
  if (!input) return
  if (input.length < 2) return "Name is too short"
  if (input.length > 25) return "Name is too long"
}

export function validateDateOfBirth(input: string) {
  const inputDob = new Date(input)

  const today = new Date()

  let age = today.getFullYear() - inputDob.getFullYear()

  const monthDifference = today.getMonth() - inputDob.getMonth()
  const dayDifference = today.getDate() - inputDob.getDate()

  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
    age--;
  }

  if (age < 16) {
    return "You must be 16 or over to use our platform."
  }
}

export const isEmpty = (
  value: string | null | undefined | number | boolean,
): boolean => {
  if (typeof value === 'boolean') {
    if (!value) {
      return true
    }
    return false
  }

  if (value || value === 0) {
    if (String(value) === 'null' || String(value).length === 0) {
      return true
    }
  } else {
    return true
  }
  return false
}

export const empty = (value: string | null | undefined | boolean) => {
  if (isEmpty(value)) {
    return 'This field is required'
  }
  return undefined
}

export const notValidPassword = (
  value: string | null | undefined,
): string | undefined => {
  if (!value || value.length < 8)
    return 'Password must be at least 8 characters long'
}

export const notValidConfirmPassword = (
  value: string | null | undefined,
  password: string | null | undefined,
): string | undefined => {
  if (value !== password) return 'Passwords do not match'
}

export const notValidName = (
  value: string | null | undefined,
): string | undefined => {
  if (!VALID_NAME_REGEXP.test(String(value))) {
    return "Maximum 30 characters and following special characters allowed: ' -"
  }
  return
}

export const notValidUkMobileNumber = (
  value: string | undefined,
): string | undefined => {
  if (!value || !value.replace(/\D/g, '').match(/^(?:44|0)7\d{9}$/))
    return 'Please enter a valid UK mobile number'
}

export function notValidPhoneNumber(input?: string) {
  if (!input) return

  let phoneNumber = parsePhoneNumberFromString('+' + input);

  if (phoneNumber && !phoneNumber.isValid() || input.length < 3) {
    console.log("invalid: ", phoneNumber)
    return "Invalid phone number/could not format";
  }
}

function getAge(dateString: string) {
  if (!dateString) return 0
  const today = new Date()
  const dateStringArr = dateString.split('-')
  const birthDate = new Date(
    parseInt(dateStringArr[0]),
    parseInt(dateStringArr[1]) - 1,
    parseInt(dateStringArr[2]),
  )
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

export const notAged18OrOver = (
  value: string | undefined,
): string | undefined => {
  if (!value || getAge(value) < 18) return 'Age is under 18'
}

export const notValidEmail = (
  value: string | undefined,
): string | undefined => {
  if (
    !value ||
    !value.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/gm)
  )
    return 'Please enter a valid email'
}

export const negativeNumber = (value: string | null | undefined) => {
  if (Number(value) < 0) {
    return 'Negative number not allowed'
  }

  return
}

export const nonPositiveNumber = (value: string | null | undefined) => {
  if (Number(value) <= 0) {
    return 'Must be greater than zero'
  }

  return
}

export const notANumber = (value: string | null | undefined) => {
  if (value && !/^-?\d+\.?\d*$/.test(String(value))) {
    return 'Please enter a valid number'
  }
}

export const notFutureDate = (value: string | null | undefined) => {
  if (!value) return
  const today = new Date()
  const dateStringArr = value.split('-')
  const valueDate = new Date(
    parseInt(dateStringArr[0]),
    parseInt(dateStringArr[1]) - 1,
    parseInt(dateStringArr[2]),
  )
  if (valueDate < today) return 'Date must be in the future'
}

const daysDiff = (date1: Date, date2: Date) => {
  const difference = date2.getTime() - date1.getTime()
  const days = Math.ceil(difference / (1000 * 3600 * 24))
  return days
}

export const moreThanTwoMonths = (value: string | null | undefined) => {
  if (!value) return
  const today = new Date()
  const dateStringArr = value.split('-')
  const valueDate = new Date(
    parseInt(dateStringArr[0]),
    parseInt(dateStringArr[1]) - 1,
    parseInt(dateStringArr[2]),
  )

  if (daysDiff(today, valueDate) > 59)
    return 'Date must be no more than 2 months in the future'
}