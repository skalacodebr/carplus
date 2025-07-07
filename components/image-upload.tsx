"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"

interface ImageUploadProps {
  currentImageUrl: string | null
  onImageSelected: (file: File) => void
  isUploading: boolean
}

export default function ImageUpload({ currentImageUrl, onImageSelected, isUploading }: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione uma imagem válida.")
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB.")
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Pass file to parent component
    onImageSelected(file)
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  // Use preview URL if available, otherwise use current image URL
  const displayUrl = previewUrl || currentImageUrl

  return (
    <div className="flex flex-col items-center">
      <div className="w-24 h-24 rounded-full bg-[#3A3942] overflow-hidden mb-3 relative">
        {isUploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <svg
              className="animate-spin h-8 w-8 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        ) : null}

        {displayUrl ? (
          <Image
            src={displayUrl || "/placeholder.svg"}
            alt="Foto de perfil"
            width={96}
            height={96}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={isUploading}
      />

      <button type="button" onClick={handleButtonClick} className="text-[#ED1C24] text-sm" disabled={isUploading}>
        {isUploading ? "Enviando..." : "Alterar foto"}
      </button>
    </div>
  )
}
