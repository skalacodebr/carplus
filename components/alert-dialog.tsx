"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

interface AlertDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: "success" | "error" | "info" | "warning"
}

export default function AlertDialog({ isOpen, onClose, title, message, type = "info" }: AlertDialogProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    if (isOpen) {
      // Prevent scrolling when dialog is open
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000) // Auto close after 3 seconds

      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

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

  // Get background and icon based on type
  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          bgColor: "bg-green-500",
          iconPath: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />,
        }
      case "error":
        return {
          bgColor: "bg-red-500",
          iconPath: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />,
        }
      case "warning":
        return {
          bgColor: "bg-yellow-500",
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

  const { bgColor, iconPath } = getTypeStyles()

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>

      <div className="relative z-10 w-full max-w-md transform overflow-hidden rounded-lg bg-[#2C2B34] text-white shadow-xl transition-all">
        <div className="p-6">
          <div className="flex items-center">
            <div className={`flex-shrink-0 rounded-full ${bgColor} p-2`}>
              <svg
                className="h-6 w-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {iconPath}
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium">{title}</h3>
              <p className="mt-1 text-sm text-gray-300">{message}</p>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-transparent bg-[#ED1C24] px-4 py-2 text-sm font-medium text-white hover:bg-opacity-80 focus:outline-none"
              onClick={onClose}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
