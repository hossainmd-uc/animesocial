'use client';

import React, { useState, useRef } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { uploadImage, validateImageFile, type ImageUploadOptions } from '../../lib/image-upload';
import { useDarkMode } from '../../hooks/useDarkMode';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  onError?: (error: string) => void;
  currentImageUrl?: string;
  uploadOptions: ImageUploadOptions;
  label?: string;
  className?: string;
  previewClassName?: string;
  showPreview?: boolean;
  disabled?: boolean;
}

export default function ImageUpload({
  onImageUploaded,
  onError,
  currentImageUrl,
  uploadOptions,
  label = "Upload Image",
  className = "",
  previewClassName = "",
  showPreview = true,
  disabled = false
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isDarkMode } = useDarkMode();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      onError?.(validation.error || 'Invalid file');
      return;
    }

    setUploading(true);

    try {
      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Upload image
      const result = await uploadImage(file, uploadOptions);

      if (result.success && result.url) {
        onImageUploaded(result.url);
        // Clean up object URL and use the uploaded URL
        URL.revokeObjectURL(objectUrl);
        setPreviewUrl(result.url);
      } else {
        // Revert preview on error
        URL.revokeObjectURL(objectUrl);
        setPreviewUrl(currentImageUrl || null);
        onError?.(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      onError?.('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    if (disabled || uploading) return;
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className={`block text-sm font-medium ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {label}
        </label>
      )}

      <div className="flex items-center space-x-4">
        {/* Upload Button */}
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || uploading}
          className={`
            relative flex items-center justify-center px-4 py-2 border border-dashed rounded-lg transition-colors
            ${disabled || uploading 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:border-primary cursor-pointer'
            }
            ${isDarkMode 
              ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700' 
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }
          `}
        >
          <PhotoIcon className="w-5 h-5 mr-2" />
          {uploading ? 'Uploading...' : 'Choose Image'}
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />

        {/* Clear button */}
        {previewUrl && (
          <button
            type="button"
            onClick={clearImage}
            className={`
              p-2 rounded-lg transition-colors
              ${isDarkMode 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }
            `}
            title="Remove image"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Preview */}
      {showPreview && previewUrl && (
        <div className={`relative inline-block ${previewClassName}`}>
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-xs max-h-32 rounded-lg border object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          )}
        </div>
      )}

      {/* Upload progress indicator */}
      {uploading && (
        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Uploading image...
        </div>
      )}
    </div>
  );
}
