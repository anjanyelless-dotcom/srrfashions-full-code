const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateMobileNumber = (mobile) => {
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile);
};

const validatePassword = (password) => {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
  return true;
};

const validateFullName = (name) => {
  return name && name.trim().length >= 2 && name.trim().length <= 100;
};

const validateRegistrationData = (data) => {
  const errors = [];

  if (!validateFullName(data.full_name)) {
    errors.push('Full name must be between 2 and 100 characters');
  }

  if (!validateEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (!validateMobileNumber(data.mobile_number)) {
    errors.push('Invalid mobile number format. Must be 10 digits starting with 6-9');
  }

  if (!validatePassword(data.password)) {
    errors.push('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
  }

  if (data.referral_code && data.referral_code.trim().length === 0) {
    errors.push('Referral code cannot be empty');
  }

  return errors;
};

const validateLoginData = (data) => {
  const errors = [];

  if (!data.identifier || data.identifier.trim().length === 0) {
    errors.push('Email or mobile number is required');
  }

  if (!data.password || data.password.trim().length === 0) {
    errors.push('Password is required');
  }

  return errors;
};

const validateProfileUpdate = (data) => {
  const errors = [];

  if (data.full_name !== undefined && !validateFullName(data.full_name)) {
    errors.push('Full name must be between 2 and 100 characters');
  }

  if (data.email !== undefined && !validateEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (data.mobile_number !== undefined && !validateMobileNumber(data.mobile_number)) {
    errors.push('Invalid mobile number format. Must be 10 digits starting with 6-9');
  }

  if (data.date_of_birth !== undefined && data.date_of_birth !== null) {
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobRegex.test(data.date_of_birth)) {
      errors.push('Invalid date of birth format. Use YYYY-MM-DD');
    } else {
      const dob = new Date(data.date_of_birth);
      if (isNaN(dob.getTime())) {
        errors.push('Invalid date of birth');
      } else if (dob.getTime() > Date.now() + 14 * 60 * 60 * 1000) {
        // +14h buffer: a YYYY-MM-DD dob is parsed as UTC midnight, so "today"
        // in timezones ahead of UTC (e.g. IST +5:30) must not be rejected.
        errors.push('Date of birth cannot be in the future');
      }
    }
  }

  return errors;
};

const validateChangePassword = (data) => {
  const errors = [];

  if (!data.current_password || data.current_password.trim().length === 0) {
    errors.push('Current password is required');
  }

  if (!data.new_password || data.new_password.trim().length === 0) {
    errors.push('New password is required');
  }

  if (data.new_password && !validatePassword(data.new_password)) {
    errors.push('New password must be at least 8 characters with uppercase, lowercase, number, and special character');
  }

  if (data.new_password && data.new_password === data.current_password) {
    errors.push('New password must be different from current password');
  }

  return errors;
};

module.exports = {
  validateEmail,
  validateMobileNumber,
  validatePassword,
  validateRegistrationData,
  validateLoginData,
  validateProfileUpdate,
  validateChangePassword
};