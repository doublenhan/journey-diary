/**
 * Password Validation Utility
 * Validates password strength requirements
 */

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export const passwordRequirements = {
  minLength: 8,
  hasUpperCase: /[A-Z]/,
  hasLowerCase: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSpecialChar: /[^A-Za-z0-9]/,
};

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  // Check minimum length
  if (password.length < passwordRequirements.minLength) {
    errors.push(`Mật khẩu phải có ít nhất ${passwordRequirements.minLength} ký tự`);
  }

  // Check uppercase
  if (!passwordRequirements.hasUpperCase.test(password)) {
    errors.push('Mật khẩu phải chứa ít nhất 1 chữ in hoa (A-Z)');
  }

  // Check lowercase
  if (!passwordRequirements.hasLowerCase.test(password)) {
    errors.push('Mật khẩu phải chứa ít nhất 1 chữ thường (a-z)');
  }

  // Check number
  if (!passwordRequirements.hasNumber.test(password)) {
    errors.push('Mật khẩu phải chứa ít nhất 1 số (0-9)');
  }

  // Check special character
  if (!passwordRequirements.hasSpecialChar.test(password)) {
    errors.push('Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*)');
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (errors.length === 0) {
    strength = 'strong';
  } else if (errors.length <= 2) {
    strength = 'medium';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Check if new password matches confirmation
 */
export function passwordsMatch(newPassword: string, confirmPassword: string): boolean {
  return newPassword === confirmPassword && newPassword.length > 0;
}
