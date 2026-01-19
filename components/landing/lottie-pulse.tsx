"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useReducedMotion } from "framer-motion"

const Lottie = dynamic(() => import("lottie-react"), { ssr: false })

type LottiePulseProps = {
  className?: string
}

export default function LottiePulse({ className }: LottiePulseProps) {
  const [animationData, setAnimationData] = useState<object | null>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    let mounted = true
    fetch("/lottie/pulse.json")
      .then((res) => res.json())
      .then((data) => {
        if (mounted) {
          setAnimationData(data)
        }
      })
      .catch(() => undefined)

    return () => {
      mounted = false
    }
  }, [])

  if (!animationData) {
    return null
  }

  return (
    <div className={className} aria-hidden="true">
      <Lottie
        animationData={animationData}
        loop={!reduceMotion}
        autoplay
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  )
}
