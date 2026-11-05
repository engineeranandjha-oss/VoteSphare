'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, RefreshCw, Link as LinkIcon } from 'lucide-react';

/**
 * Universal Image Upload Component for VoteSphere
 * Supports drag-and-drop, direct file upload with client-side compression/preview, and optional URL mode.
 *
 * @param {{
 *   value?: string | null,
 *   onChange: (val: string | null) => void,
 *   label?: string,
 *   optional?: boolean,
 *   helperText?: string,
 *   aspectRatio?: 'square' | 'wide' | 'avatar',
 *   maxSizeMB?: number,
 *   className?: string
 * }} props
 */
export default function ImageUpload({
  value = '',
  onChange,
  label = 'Upload Image',
  optional = true,
  helperText = 'PNG, JPG, WEBP, or GIF (max 5MB)',
  aspectRatio = 'square',
  maxSizeMB = 5,
  className = '',
}) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef(null);

  const processFile = (file) => {
    setError('');

    if (!file) return;

    // Check mime type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP, SVG, GIF)');
      return;
    }

    // Check size limit
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image size exceeds ${maxSizeMB}MB limit`);
      return;
    }

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress / resize image using HTML5 Canvas to keep payload lightweight and fast
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Export as optimized WebP or JPEG Data URL
        const dataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88);
        setIsProcessing(false);
        onChange(dataUrl);
      };

      img.onerror = () => {
        setIsProcessing(false);
        setError('Failed to process image');
      };

      img.src = event.target.result;
    };

    reader.onerror = () => {
      setIsProcessing(false);
      setError('Failed to read image file');
    };

    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      onChange(null);
      setIsUrlMode(false);
      return;
    }
    onChange(urlInput.trim());
    setIsUrlMode(false);
  };

  const isAvatar = aspectRatio === 'avatar';
  const isWide = aspectRatio === 'wide';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            {label} {optional && <span className="text-slate-500 font-normal">(Optional)</span>}
          </label>
          <button
            type="button"
            onClick={() => {
              setIsUrlMode(!isUrlMode);
              setUrlInput(value || '');
            }}
            className="text-[11px] font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            <LinkIcon className="h-3 w-3" />
            <span>{isUrlMode ? 'Upload from device' : 'Paste link instead'}</span>
          </button>
        </div>
      )}

      {isUrlMode ? (
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.png"
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors"
          >
            Apply
          </button>
        </div>
      ) : value ? (
        /* Image Preview Box */
        <div className="relative group rounded-2xl border border-slate-700/80 bg-slate-900/90 p-3 overflow-hidden flex items-center gap-4 transition-all hover:border-slate-600">
          <div
            className={`relative overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0 flex items-center justify-center ${
              isAvatar
                ? 'h-16 w-16 rounded-full'
                : isWide
                ? 'h-16 w-28 rounded-xl'
                : 'h-16 w-16 rounded-xl'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Uploaded Preview"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Image Attached</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {value.startsWith('data:') ? 'Uploaded from device' : value}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Change</span>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Remove image"
              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Drag & Drop Upload Zone */
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all flex flex-col items-center justify-center gap-2 group ${
            dragActive
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700'
          }`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <RefreshCw className="h-6 w-6 text-blue-400 animate-spin" />
              <p className="text-xs font-medium text-slate-400">Processing image...</p>
            </div>
          ) : (
            <>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 group-hover:bg-blue-500/20 transition-all">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  <span className="text-blue-400 group-hover:underline">Click to upload</span> or drag and drop
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">{helperText}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
