import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { withErrorHandling, ApiErrorClass } from '@/lib/api-utils';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const data = await request.formData();
  const files = data.getAll('file') as File[]; // Changed from 'images' to 'file' to match the form data key
  const uploadType = data.get('type') as string || 'listing'; // 'profile' or 'listing'
  
  if (!files || files.length === 0) {
    throw new ApiErrorClass('No images were provided. Please select at least one image to upload.', 'VALIDATION_ERROR', 400);
  }

  // Validate maximum number of files (10 files max for listings, 1 for profile)
  const maxFiles = uploadType === 'profile' ? 1 : 10;
  if (files.length > maxFiles) {
    throw new ApiErrorClass(`Too many files. Maximum ${maxFiles} image(s) allowed per upload.`, 'VALIDATION_ERROR', 400);
  }

  const uploadSubDir = uploadType === 'profile' ? 'profiles' : 'listings';
  const uploadDir = join(process.cwd(), 'public', 'uploads', uploadSubDir);
  
  // Create uploads directory if it doesn't exist
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const uploadedImages = [];
  const errors = [];
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxFileSize = 5 * 1024 * 1024; // 5MB

  for (const file of files) {
    try {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Only JPEG, PNG, and WebP images are allowed`);
        continue;
      }

      // Validate file size (5MB limit)
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: File too large. Maximum size is 5MB`);
        continue;
      }

      // Validate file name
      if (!file.name || file.name.trim() === '') {
        errors.push('Invalid file name');
        continue;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const prefix = uploadType === 'profile' ? 'profile' : 'listing';
      const fileName = `${prefix}_${timestamp}_${randomString}.${fileExtension}`;
      
      const filePath = join(uploadDir, fileName);
      
      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      await writeFile(filePath, buffer);
      
      // Return the public URL
      const publicUrl = `/uploads/${uploadSubDir}/${fileName}`;
      uploadedImages.push(publicUrl);
    } catch (fileError) {
      console.error(`Error processing file ${file.name}:`, fileError);
      errors.push(`${file.name}: Failed to process file`);
    }
  }

  // Return results even if some files failed
  if (uploadedImages.length === 0 && errors.length > 0) {
    throw new ApiErrorClass(`All uploads failed: ${errors.join('; ')}`, 'UPLOAD_ERROR', 400);
  }

  return NextResponse.json({
    success: true,
    message: `Successfully uploaded ${uploadedImages.length} image(s)${errors.length > 0 ? `. ${errors.length} files failed` : ''}`,
    urls: uploadedImages,
    errors: errors.length > 0 ? errors : undefined
  });
});

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}