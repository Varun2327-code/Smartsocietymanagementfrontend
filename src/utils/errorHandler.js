// Centralized error handling utilities
import { toast } from 'react-hot-toast';

// Error types
export const ERROR_TYPES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  FIRESTORE: 'firestore',
  AUTH: 'authentication',
  PERMISSION: 'permission',
  UNKNOWN: 'unknown'
};

// Error categories for user-friendly messages
export const ERROR_CATEGORIES = {
  [ERROR_TYPES.NETWORK]: {
    title: 'Connection Error',
    message: 'Unable to connect to the server. Please check your internet connection and try again.'
  },
  [ERROR_TYPES.VALIDATION]: {
    title: 'Validation Error',
    message: 'Please check your input and try again.'
  },
  [ERROR_TYPES.FIRESTORE]: {
    title: 'Database Error',
    message: 'There was an issue with the database. Please try again.'
  },
  [ERROR_TYPES.AUTH]: {
    title: 'Authentication Error',
    message: 'Please sign in again to continue.'
  },
  [ERROR_TYPES.PERMISSION]: {
    title: 'Permission Denied',
    message: 'You don\'t have permission to perform this action.'
  },
  [ERROR_TYPES.UNKNOWN]: {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.'
  }
};

// Detect error type from Firebase/Firestore errors
export const detectErrorType = (error) => {
  if (!error) return ERROR_TYPES.UNKNOWN;
  
  const errorCode = error.code || '';
  const errorMessage = error.message || '';
  
  // Firebase Auth errors
  if (errorCode.startsWith('auth/')) {
    return ERROR_TYPES.AUTH;
  }
  
  // Firestore permission errors
  if (errorCode === 'permission-denied' || errorMessage.includes('permission')) {
    return ERROR_TYPES.PERMISSION;
  }
  
  // Network errors
  if (errorCode === 'unavailable' || errorMessage.includes('network') || errorMessage.includes('offline')) {
    return ERROR_TYPES.NETWORK;
  }
  
  // Firestore errors
  if (errorCode.startsWith('firestore/') || errorCode === 'failed-precondition') {
    return ERROR_TYPES.FIRESTORE;
  }
  
  return ERROR_TYPES.UNKNOWN;
};

// Handle error with appropriate user feedback
export const handleError = (error, context = '') => {
  const errorType = detectErrorType(error);
  const category = ERROR_CATEGORIES[errorType];
  
  // Log error for debugging
  console.error(`Error [${errorType}]${context ? ` in ${context}:` : ':'}`, error);
  
  // Show user-friendly toast message
  toast.error(category.message, {
    duration: 4000,
    position: 'top-right'
  });
  
  // Return structured error information
  return {
    type: errorType,
    category: category,
    originalError: error,
    timestamp: new Date().toISOString(),
    context: context
  };
};

// Handle validation errors specifically
export const handleValidationError = (errors, formName = '') => {
  const errorMessages = Object.values(errors).filter(Boolean);
  
  if (errorMessages.length > 0) {
    // Show first validation error
    toast.error(errorMessages[0], {
      duration: 4000,
      position: 'top-right'
    });
    
    // Log all validation errors
    console.warn(`Validation errors${formName ? ` in ${formName}:` : ':'}`, errors);
  }
  
  return {
    type: ERROR_TYPES.VALIDATION,
    errors: errors,
    hasErrors: errorMessages.length > 0
  };
};

// Global error handler for uncaught errors
export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    handleError(event.reason, 'Unhandled Promise Rejection');
  });
  
  // Handle global errors
  window.addEventListener('error', (event) => {
    event.preventDefault();
    handleError(event.error, 'Global Error');
  });
  
  console.log('Global error handling initialized');
};

// Utility to check if error is recoverable
export const isRecoverableError = (error) => {
  const type = detectErrorType(error);
  return type !== ERROR_TYPES.AUTH && type !== ERROR_TYPES.PERMISSION;
};

// Utility to retry operation with exponential backoff
export const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries || !isRecoverableError(error)) {
        throw error;
      }
      
      // Wait with exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      console.log(`Retry attempt ${attempt}/${maxRetries} in ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

export default {
  ERROR_TYPES,
  ERROR_CATEGORIES,
  detectErrorType,
  handleError,
  handleValidationError,
  setupGlobalErrorHandling,
  isRecoverableError,
  retryOperation
};
