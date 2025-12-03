export const validateEmail = (email) => {
  const re = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
  return re.test(String(email).toLowerCase());
};

export const validatePhone = (phone) => {
  const re = /^\+?[0-9]{7,15}$/;
  return re.test(String(phone));
};

export const validateName = (name) => {
  if (!name || name.trim().length < 2) {
    return 'Name must be at least 2 characters long';
  }
  return null;
};

export const validateRequired = (value, fieldName) => {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`;
  }
  return null;
};

export const memberValidationSchema = {
  name: (value) => validateName(value),
  email: (value) => {
    const requiredError = validateRequired(value, 'Email');
    if (requiredError) return requiredError;
    if (!validateEmail(value)) return 'Invalid email format';
    return null;
  },
  phone: (value) => {
    const requiredError = validateRequired(value, 'Phone');
    if (requiredError) return requiredError;
    if (!validatePhone(value)) return 'Invalid phone number format';
    return null;
  },
  unit: (value) => validateRequired(value, 'Unit'),
  role: (value) => validateRequired(value, 'Role'),
  status: (value) => validateRequired(value, 'Status')
};

export const visitorValidationSchema = {
  name: (value) => validateName(value),
  purpose: (value) => validateRequired(value, 'Purpose'),
  flatNumber: (value) => validateRequired(value, 'Flat Number'),
  status: (value) => validateRequired(value, 'Status')
};

export const guardValidationSchema = {
  name: (value) => validateName(value),
  contact: (value) => {
    const requiredError = validateRequired(value, 'Contact');
    if (requiredError) return requiredError;
    if (!validatePhone(value)) return 'Invalid phone number format';
    return null;
  },
  shift: (value) => validateRequired(value, 'Shift'),
  status: (value) => validateRequired(value, 'Status')
};

export const deliveryValidationSchema = {
  recipientName: (value) => validateName(value),
  flatNumber: (value) => validateRequired(value, 'Flat number'),
  itemDescription: (value) => validateRequired(value, 'Item description'),
  deliveryPerson: (value) => validateRequired(value, 'Delivery person'),
  contactNumber: (value) => {
    const requiredError = validateRequired(value, 'Contact number');
    if (requiredError) return requiredError;
    if (!validatePhone(value)) return 'Invalid phone number format';
    return null;
  }
};

export const alertValidationSchema = {
  message: (value) => validateRequired(value, 'Alert message'),
  priority: (value) => validateRequired(value, 'Priority'),
  type: (value) => validateRequired(value, 'Alert type')
};
