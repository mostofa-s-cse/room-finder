'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Upload,
  X,
  Image as ImageIcon,
  Camera,
  AlertCircle,
  Check,
  Loader2,
  Move,
} from 'lucide-react';
import { cn, isValidImage, fileToBase64 } from '@/utils/helpers';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  uploaded: boolean;
  uploading: boolean;
  error?: string;
}

interface ImageUploaderProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  maxImages?: number;
  maxFileSize?: number; // in MB
  acceptedFormats?: string[];
  uploadEndpoint?: string;
  className?: string;
}

export function ImageUploader({
  images,
  onImagesChange,
  maxImages = 10,
  maxFileSize = 5,
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  uploadEndpoint,
  className,
}: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const newImages: ImageFile[] = [];
      const errors: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check if we've reached the max images limit
        if (images.length + newImages.length >= maxImages) {
          errors.push(`Maximum ${maxImages} images allowed`);
          break;
        }

        // Validate file
        if (!acceptedFormats.includes(file.type)) {
          errors.push(`${file.name}: Invalid format. Please use JPG, PNG, or WebP`);
          continue;
        }

        if (file.size > maxFileSize * 1024 * 1024) {
          errors.push(`${file.name}: File too large. Maximum ${maxFileSize}MB allowed`);
          continue;
        }

        if (!isValidImage(file)) {
          errors.push(`${file.name}: Invalid image file`);
          continue;
        }

        try {
          const preview = await fileToBase64(file);
          const imageFile: ImageFile = {
            id: `${Date.now()}-${i}`,
            file,
            preview,
            uploaded: false,
            uploading: false,
          };
          newImages.push(imageFile);
        } catch {
          errors.push(`${file.name}: Failed to process image`);
        }
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
      }

      // Show errors if any
      if (errors.length > 0) {
        console.error('Image upload errors:', errors);
        // You could show these in a toast notification
      }
    },
    [images, maxImages, maxFileSize, acceptedFormats, onImagesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files);
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFileSelect]
  );

  const removeImage = useCallback(
    (id: string) => {
      onImagesChange(images.filter((img) => img.id !== id));
      setDeleteConfirmId(null);
    },
    [images, onImagesChange]
  );

  const moveImage = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newImages = [...images];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      onImagesChange(newImages);
    },
    [images, onImagesChange]
  );

  const uploadImage = async (imageFile: ImageFile) => {
    if (!uploadEndpoint) return;

    // Update image state to show uploading
    const updatedImages = images.map((img) =>
      img.id === imageFile.id ? { ...img, uploading: true, error: undefined } : img
    );
    onImagesChange(updatedImages);

    try {
      const formData = new FormData();
      formData.append('image', imageFile.file);

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      // Update image state to show success
      const finalImages = images.map((img) =>
        img.id === imageFile.id
          ? { ...img, uploading: false, uploaded: true, preview: result.url || img.preview }
          : img
      );
      onImagesChange(finalImages);
    } catch {
      // Update image state to show error
      const errorImages = images.map((img) =>
        img.id === imageFile.id
          ? { ...img, uploading: false, error: 'Upload failed' }
          : img
      );
      onImagesChange(errorImages);
    }
  };

  const uploadAllImages = async () => {
    const unuploadedImages = images.filter((img) => !img.uploaded && !img.uploading);
    for (const image of unuploadedImages) {
      await uploadImage(image);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          'border-2 border-dashed transition-colors cursor-pointer',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          images.length >= maxImages && 'opacity-50 cursor-not-allowed'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (images.length < maxImages && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
      >
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="flex flex-col items-center space-y-4">
            {isDragOver ? (
              <Upload className="h-12 w-12 text-primary animate-bounce" />
            ) : (
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            )}
            
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">
                {images.length >= maxImages
                  ? `Maximum ${maxImages} images reached`
                  : isDragOver
                  ? 'Drop images here'
                  : 'Upload room images'}
              </p>
              
              {images.length < maxImages && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Drag and drop images here, or click to browse</p>
                  <p>
                    Supports JPG, PNG, WebP up to {maxFileSize}MB each
                  </p>
                  <p>
                    {images.length} of {maxImages} images uploaded
                  </p>
                </div>
              )}
            </div>

            {images.length < maxImages && (
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFormats.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Upload Actions */}
      {images.length > 0 && uploadEndpoint && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {images.filter((img) => img.uploaded).length} of {images.length} images uploaded
          </div>
          <Button
            onClick={uploadAllImages}
            disabled={images.every((img) => img.uploaded || img.uploading)}
            size="sm"
          >
            {images.some((img) => img.uploading) ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Upload All
          </Button>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={image.id} className="relative group overflow-hidden">
              <div className="aspect-square relative">
                <Image
                  src={image.preview}
                  alt={`Upload ${index + 1}`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />

                {/* Status Indicators */}
                <div className="absolute top-2 left-2 flex space-x-1">
                  {index === 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Main
                    </Badge>
                  )}
                  
                  {image.uploading && (
                    <Badge variant="outline" className="text-xs bg-background">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Uploading
                    </Badge>
                  )}
                  
                  {image.uploaded && (
                    <Badge variant="default" className="text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Uploaded
                    </Badge>
                  )}
                  
                  {image.error && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Error
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                  {index > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveImage(index, index - 1);
                      }}
                    >
                      <Move className="h-3 w-3" />
                    </Button>
                  )}
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(image.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {/* Upload Progress */}
                {image.uploading && (
                  <div className="absolute bottom-0 left-0 right-0 bg-background/80">
                    <Progress value={50} className="h-1" />
                  </div>
                )}
              </div>

              {/* File Info */}
              <CardContent className="p-2">
                <div className="text-xs text-muted-foreground truncate">
                  {image.file.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {(image.file.size / 1024 / 1024).toFixed(1)} MB
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Image?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The image will be permanently removed from your listing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && removeImage(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}