import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { requireAuth, successResponse, errorResponse, ApiErrorClass } from '@/lib/api-utils';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'chat');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    await requireAuth(request);
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const threadId = formData.get('threadId') as string;

    if (!file) {
      return errorResponse(new ApiErrorClass('No file provided', 'VALIDATION_ERROR', 400));
    }

    if (!threadId) {
      return errorResponse(new ApiErrorClass('Thread ID is required', 'VALIDATION_ERROR', 400));
    }

    // Verify file size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(new ApiErrorClass('File size exceeds 10MB limit', 'FILE_TOO_LARGE', 413));
    }

    // Allowed file types
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedMimes.includes(file.type)) {
      return errorResponse(
        new ApiErrorClass('File type not allowed', 'INVALID_FILE_TYPE', 400)
      );
    }

    // Create upload directory if it doesn't exist
    const uploadPath = join(UPLOAD_DIR, threadId);
    if (!existsSync(uploadPath)) {
      await mkdir(uploadPath, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const ext = file.name.split('.').pop();
    const filename = `${timestamp}-${randomString}.${ext}`;
    const filepath = join(uploadPath, filename);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return file URL
    const fileUrl = `/uploads/chat/${threadId}/${filename}`;

    return successResponse({
      fileUrl,
      fileName: file.name,
      fileType: file.type,
      size: file.size,
    }, 201);
  } catch (error) {
    console.error('Upload error:', error);
    if (error instanceof ApiErrorClass) {
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Failed to upload file', 'UPLOAD_ERROR', 500));
  }
}
