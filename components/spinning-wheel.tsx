"use client"

import { useEffect, useRef } from "react"

interface SpinningWheelProps {
  size?: number
  color?: string
}

export default function SpinningWheel({ size = 100, color = "#ED1C24" }: SpinningWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let rotation = 0
    let animationFrameId: number

    const drawWheel = () => {
      if (!ctx) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Save the current context state
      ctx.save()

      // Move to center of canvas
      ctx.translate(canvas.width / 2, canvas.height / 2)

      // Rotate
      ctx.rotate(rotation)

      // Draw wheel
      const centerX = 0
      const centerY = 0
      const radius = size / 2 - 10
      const spokeCount = 8
      const spokeWidth = 5

      // Draw rim
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.strokeStyle = color
      ctx.lineWidth = 8
      ctx.stroke()

      // Draw center hub
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius / 5, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()

      // Draw spokes
      for (let i = 0; i < spokeCount; i++) {
        const angle = (i * Math.PI * 2) / spokeCount
        ctx.beginPath()
        ctx.moveTo(centerX + (radius / 5) * Math.cos(angle), centerY + (radius / 5) * Math.sin(angle))
        ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle))
        ctx.strokeStyle = color
        ctx.lineWidth = spokeWidth
        ctx.stroke()
      }

      // Restore the context state
      ctx.restore()

      // Update rotation for next frame
      rotation += 0.05
      if (rotation >= Math.PI * 2) {
        rotation = 0
      }

      // Request next frame
      animationFrameId = requestAnimationFrame(drawWheel)
    }

    drawWheel()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [size, color])

  return <canvas ref={canvasRef} width={size} height={size} className="mx-auto" />
}
