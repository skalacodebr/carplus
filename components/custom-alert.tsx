"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

interface CustomAlertProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: "info" | "warning" | "error" | "success"
  confirmText?: string
  showIcon?: boolean
}

export default function CustomAlert({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  confirmText = "OK",
  showIcon = true,
}: CustomAlertProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    if (isOpen) {
      // Prevent scrolling when alert is open
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscapeKey)
    return () => document.removeEventListener("keydown", handleEscapeKey)
  }, [isOpen, onClose])

  // Get styles based on type
  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          bgColor: "bg-green-500",
          borderColor: "border-green-500",
          textColor: "text-green-400",
          iconPath: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />,
        }
      case "error":
        return {
          bgColor: "bg-red-500",
          borderColor: "border-red-500",
          textColor: "text-red-400",
          iconPath: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />,
        }
      case "warning":
        return {
          bgColor: "bg-yellow-500",
          borderColor: "border-yellow-500",
          textColor: "text-yellow-400",
          iconPath: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          ),
        }
      default:
        return {
          bgColor: "bg-blue-500",
          borderColor: "border-blue-500",
          textColor: "text-blue-400",
          iconPath: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ),
        }
    }
  }

  const { bgColor, borderColor, textColor, iconPath } = getTypeStyles()

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-70 transition-opacity" onClick={onClose} />

      {/* Alert Modal */}
      <div className="relative z-10 w-full max-w-sm transform overflow-hidden rounded-2xl bg-[#2C2B34] border border-[#3A3942] shadow-xl transition-all">
        {/* Header with icon */}
        {showIcon && (
          <div className="flex justify-center pt-6 pb-2">
            <div className={`flex-shrink-0 rounded-full ${bgColor} bg-opacity-20 border ${borderColor} p-3`}>
              <svg
                className={`h-8 w-8 ${textColor}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {iconPath}
              </svg>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-6 pb-6">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
            <p className="text-sm text-gray-300 leading-relaxed mb-6">{message}</p>
          </div>

          {/* Button */}
          <button
            type="button"
            className="w-full bg-[#ED1C24] hover:bg-[#ED1C24]/90 text-white font-bold py-3 px-4 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:ring-offset-2 focus:ring-offset-[#2C2B34]"
            onClick={onClose}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
