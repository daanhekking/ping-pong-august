'use client'

import React, { useEffect, useRef, useState } from 'react'

// Confetti particle class - improved to match the p5.js version
class ConfettiParticle {
  constructor(x, y, color) {
    this.x = x
    this.y = y
    this.color = color
    this.size = Math.random() * 20 + 8  // Bigger particles
    this.speedX = Math.random() * 8 - 4
    this.speedY = Math.random() * -20 - 15  // Much stronger upward velocity
    this.gravity = 0.12  // Slightly reduced gravity for longer flight
    this.drag = 0.99  // Less drag for more momentum
    this.rotation = Math.random() * 360
    this.rotationSpeed = Math.random() * 20 - 10
    this.opacity = 1
    this.fadeSpeed = 0.006  // Slower fade for longer visibility
    this.bounceCount = 0
    this.maxBounces = 1  // Fewer bounces for cleaner effect
    this.bounceDamping = 0.6  // More bouncy
    this.shape = Math.random() > 0.5 ? 'rect' : 'circle'
    this.width = this.size
    this.height = this.size * (0.5 + Math.random() * 0.5)
  }

  update() {
    // Apply gravity
    this.speedY += this.gravity
    
    // Apply drag
    this.speedX *= this.drag
    this.speedY *= this.drag
    
    // Add some random movement like in the original
    this.speedX += (Math.random() - 0.5) * 0.5
    this.speedY += (Math.random() - 0.1) * 0.1
    
    // Update position
    this.x += this.speedX
    this.y += this.speedY
    
    // Update rotation
    this.rotation += this.rotationSpeed
    
    // Bounce off bottom
    if (this.y > window.innerHeight - this.height && this.bounceCount < this.maxBounces) {
      this.y = window.innerHeight - this.height
      this.speedY = -this.speedY * this.bounceDamping
      this.bounceCount++
    }
    
    // Fade out gradually
    this.opacity -= this.fadeSpeed
    
    // Check if particle should be removed
    return this.opacity > 0 && this.y < window.innerHeight + 100
  }

  draw(ctx) {
    ctx.save()
    ctx.globalAlpha = this.opacity
    ctx.translate(this.x, this.y)
    ctx.rotate((this.rotation * Math.PI) / 180)
    
    ctx.fillStyle = this.color
    
    if (this.shape === 'rect') {
      // Draw rectangle with some variation like the original
      const width = this.width * (0.8 + Math.sin(this.rotation * 0.1) * 0.2)
      const height = this.height
      ctx.fillRect(-width / 2, -height / 2, width, height)
    } else {
      // Draw circle with some variation like the original
      const radius = this.size / 2 * (0.8 + Math.sin(this.rotation * 0.1) * 0.2)
      ctx.beginPath()
      ctx.arc(0, 0, radius, 0, Math.PI * 2)
      ctx.fill()
    }
    
    ctx.restore()
  }
}

export default function Confetti({ 
  isActive, 
  onComplete, 
  position = { x: 0, y: 0 },
  colors = ["#AA21FF", "#E6BCFF", "#C8E9C7", "#FDCC93"],
  particleCount = 300 
}) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (!isActive || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Create initial particles from the specified position
    const newParticles = []
    const screenWidth = window.innerWidth
    const spreadWidth = screenWidth * 0.6 // 60% of screen width for more focused spread
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push(
        new ConfettiParticle(
          position.x + (Math.random() - 0.5) * spreadWidth, // Spread particles across 60% of screen width
          position.y + (Math.random() - 0.5) * 60, // Tighter vertical spread for more focused upward burst
          colors[Math.floor(Math.random() * colors.length)]
        )
      )
    }
    
    setParticles(newParticles)

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      let activeParticles = 0
      newParticles.forEach(particle => {
        if (particle.update()) {
          particle.draw(ctx)
          activeParticles++
        }
      })
      
      if (activeParticles > 0) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        // All particles are done, call onComplete
        if (onComplete) onComplete()
      }
    }
    
    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, position, colors, particleCount, onComplete])

  if (!isActive) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ position: 'fixed', top: 0, left: 0 }}
    />
  )
}
