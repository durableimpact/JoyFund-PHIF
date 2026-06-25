"use client";

import React, { useCallback, useRef, useState } from "react";
import { Upload, X, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  accept?: string;
  onChange: (file: File | null) => void;
  value?: File | null;
  label?: string;
  className?: string;
}

export function FileUpload({
  accept = "image/*",
  onChange,
  value,
  label = "Upload file",
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0] || null;
      onChange(file);
    },
    [onChange]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      onChange(file);
    },
    [onChange]
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
      if (inputRef.current) inputRef.current.value = "";
    },
    [onChange]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all min-h-[100px]",
        isDragging
          ? "border-indigo-400 bg-indigo-50"
          : value
            ? "border-emerald-300 bg-emerald-50"
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {value ? (
        <>
          <div className="flex items-center gap-2 text-emerald-600">
            <FileImage size={18} />
            <span className="text-xs font-medium truncate max-w-[160px]">
              {value.name}
            </span>
          </div>
          <span className="text-[10px] text-gray-400">
            {(value.size / 1024).toFixed(1)} KB
          </span>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 rounded-full bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-colors"
          >
            <X size={12} className="text-gray-400 hover:text-red-500" />
          </button>
        </>
      ) : (
        <>
          <Upload
            size={18}
            className={isDragging ? "text-indigo-500" : "text-gray-400"}
          />
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600">{label}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Drag & drop or click to browse
            </p>
          </div>
        </>
      )}
    </div>
  );
}
