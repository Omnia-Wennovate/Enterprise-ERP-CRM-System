'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()

  useEffect(() => {
    // Use a small delay to ensure router is initialized
    const timeout = setTimeout(() => {
      router.push('/login')
    }, 50)

    return () => clearTimeout(timeout)
  }, [router])

  return null
}
