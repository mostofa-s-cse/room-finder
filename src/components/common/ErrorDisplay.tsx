import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, XCircle, CheckCircle, Info } from 'lucide-react';

interface ValidationDetail {
  field: string;
  message: string;
  code?: string;
}

interface ApiError {
  message: string;
  code: string;
  details?: ValidationDetail[] | string | Record<string, unknown>;
}

interface ErrorDisplayProps {
  error: ApiError | string | null;
  success?: string | null;
  className?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
}

export function ErrorDisplay({ 
  error, 
  success, 
  className = '', 
  variant 
}: ErrorDisplayProps) {
  if (!error && !success) return null;

  // Determine variant based on content
  let displayVariant = variant;
  let icon;
  let title;

  if (success) {
    displayVariant = 'success';
    icon = <CheckCircle className="h-4 w-4" />;
    title = 'Success';
  } else if (error) {
    if (!displayVariant) {
      // Auto-determine variant based on error code
      const errorObj = typeof error === 'string' ? { message: error, code: 'UNKNOWN' } : error;
      switch (errorObj.code) {
        case 'VALIDATION_ERROR':
          displayVariant = 'warning';
          icon = <AlertCircle className="h-4 w-4" />;
          title = 'Validation Error';
          break;
        case 'UNAUTHORIZED':
        case 'FORBIDDEN':
          displayVariant = 'destructive';
          icon = <XCircle className="h-4 w-4" />;
          title = 'Access Denied';
          break;
        case 'NOT_FOUND':
          displayVariant = 'warning';
          icon = <Info className="h-4 w-4" />;
          title = 'Not Found';
          break;
        default:
          displayVariant = 'destructive';
          icon = <XCircle className="h-4 w-4" />;
          title = 'Error';
      }
    }
  }

  const message = success || (typeof error === 'string' ? error : error?.message);
  const details = typeof error === 'object' && error?.details;

  return (
    <Alert variant={displayVariant as "default" | "destructive"} className={className}>
      {icon}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {message}
        {details && Array.isArray(details) && (
          <ul className="mt-2 ml-4 list-disc space-y-1">
            {(details as ValidationDetail[]).map((detail, index: number) => (
              <li key={index} className="text-sm">
                {typeof detail === 'string' ? detail : 
                 detail.field ? `${detail.field}: ${detail.message}` : 
                 detail.message || JSON.stringify(detail)}
              </li>
            ))}
          </ul>
        )}
        {details && typeof details === 'string' && (
          <p className="mt-2 text-sm">{details}</p>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Hook for handling API errors consistently
export function useApiError() {
  const [error, setError] = React.useState<ApiError | string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const handleError = React.useCallback((error: unknown) => {
    console.error('API Error:', error);
    
    // Type guards for error handling
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { response: { data: { error: ApiError } } };
      if (apiError.response?.data?.error) {
        setError(apiError.response.data.error);
        setSuccess(null);
        return;
      }
    }
    
    if (error && typeof error === 'object' && 'message' in error) {
      const networkError = error as { message: string };
      setError({
        message: networkError.message,
        code: 'NETWORK_ERROR'
      });
    } else if (typeof error === 'string') {
      // String error
      setError({
        message: error,
        code: 'UNKNOWN'
      });
    } else {
      // Unknown error
      setError({
        message: 'An unexpected error occurred',
        code: 'UNKNOWN'
      });
    }
    setSuccess(null);
  }, []);

  const handleSuccess = React.useCallback((message: string) => {
    setSuccess(message);
    setError(null);
  }, []);

  const clearMessages = React.useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    error,
    success,
    setError,
    setSuccess,
    handleError,
    handleSuccess,
    clearMessages
  };
}