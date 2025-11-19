# API Error Handling Improvements

## Overview
This document outlines the comprehensive error handling system implemented across all APIs to provide better user experience and developer debugging capabilities.

## Key Improvements

### 1. Enhanced API Utilities (`/src/lib/api-utils.ts`)

#### Error Response Function
- **Zod Validation Errors**: Detailed field-level validation errors with specific messages
- **Prisma Errors**: Specific database error handling for common scenarios:
  - `P2002`: Unique constraint violations (409 Conflict)
  - `P2025`: Record not found (404 Not Found)
  - `P2003`: Foreign key constraint violations (400 Bad Request)
  - `P2014`: Required relation missing (400 Bad Request)
- **JSON Parse Errors**: Clear messages for malformed JSON requests
- **Generic Error Fallback**: User-friendly messages for unexpected errors

#### Authentication Function (`requireAuth`)
- **Specific Role Messages**: Clear explanations of required privileges
- **User-Friendly Messages**: "Please sign in to access this resource" instead of generic "Unauthorized"
- **Role Context**: Shows current role and required roles in error messages

#### Error Logging
- **Enhanced Logging**: Includes request method, URL, and detailed error context
- **Stack Traces**: Preserved for debugging while keeping user messages clean

### 2. Updated API Endpoints

#### Listings API (`/src/app/api/listings/route.ts`)
- Uses improved `withErrorHandling` wrapper
- Leverages enhanced `requireAuth` for better authorization messages
- Automatic validation error formatting

#### Upload API (`/src/app/api/upload/image/route.ts`)
- **File Validation**: Specific messages for file type, size, and count limits
- **Detailed Error Messages**: Individual file processing errors
- **Upload Limits**: Clear messaging about 10-file limit and 5MB size restriction
- **Supported Formats**: JPEG, PNG, WebP validation with clear error messages

#### Authentication API (`/src/app/api/auth/signup/route.ts`)
- **Duplicate Email**: Clear message about existing accounts with suggestion to sign in
- **Password Strength**: Specific requirements for password security
- **Success Messages**: Actionable next steps after account creation

### 3. Frontend Error Display System

#### ErrorDisplay Component (`/src/components/common/ErrorDisplay.tsx`)
- **Visual Error Types**: Different icons and styling for error, warning, success, and info messages
- **Validation Details**: Structured display of field-level validation errors
- **Auto-Detection**: Automatically determines error severity based on error codes
- **Expandable Details**: Shows additional context when available

#### useApiError Hook
- **Centralized Error Handling**: Consistent error state management
- **Type-Safe Error Processing**: Proper handling of different error response formats
- **Success/Error State**: Combined state management for both success and error messages

### 4. Form Integration

#### Listing Creation Form
- **Real-time Error Display**: Shows API errors directly in the form
- **Success Feedback**: Clear success messages with automatic redirect
- **Upload Error Handling**: Specific error messages for image upload failures
- **Progress Preservation**: Form state maintained during error recovery

## Error Message Examples

### Before (Generic)
```json
{
  "error": "Internal server error"
}
```

### After (Specific)
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Invalid email address",
        "code": "invalid_string"
      },
      {
        "field": "price",
        "message": "Price must be greater than 0",
        "code": "too_small"
      }
    ]
  }
}
```

## Error Codes Reference

| Code | Description | Status | Example |
|------|-------------|---------|---------|
| `VALIDATION_ERROR` | Request data validation failed | 400 | Invalid email format |
| `UNAUTHORIZED` | Authentication required | 401 | Please sign in to access this resource |
| `FORBIDDEN` | Insufficient permissions | 403 | This action requires landlord privileges |
| `NOT_FOUND` | Resource not found | 404 | The requested listing was not found |
| `DUPLICATE_EMAIL` | Email already exists | 409 | Account with this email already exists |
| `DATABASE_ERROR` | Database operation failed | 400-500 | Unique constraint violation |
| `UPLOAD_ERROR` | File upload failed | 400 | File too large (max 5MB) |
| `NETWORK_ERROR` | Network/connectivity issue | 500 | Connection timeout |

## Benefits

### For Users
- **Clear Action Items**: Know exactly what to fix or try next
- **Context-Aware Messages**: Understand why an action failed
- **Progress Preservation**: Don't lose work when errors occur
- **Visual Feedback**: Immediate understanding of error severity

### For Developers
- **Structured Debugging**: Consistent error format across all APIs
- **Detailed Logging**: Full context for issue investigation
- **Type Safety**: TypeScript-compliant error handling
- **Centralized Management**: Single source of truth for error handling logic

## Implementation Status

✅ **Completed**:
- Core error handling utilities
- Listings API error improvements
- Upload API error improvements
- Authentication API error improvements
- Frontend ErrorDisplay component
- Listing form integration

🔄 **Next Steps**:
- Extend to remaining API endpoints (bookings, payments, chat)
- Add error tracking/monitoring
- Implement retry mechanisms for transient errors
- Add error analytics dashboard

## Testing

To test the improved error handling:

1. **Validation Errors**: Submit forms with invalid data
2. **Authentication Errors**: Access protected endpoints without authentication
3. **File Upload Errors**: Upload files that exceed size/type limits
4. **Database Errors**: Create duplicate records or reference non-existent resources

## Maintenance

- **Regular Review**: Monitor error logs for new error patterns
- **Message Updates**: Refine error messages based on user feedback
- **Code Coverage**: Ensure all error paths have appropriate handling
- **Documentation**: Keep error codes and messages documented