"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 antialiased">
        <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <span className="text-lg text-red-600">!</span>
            </div>
            <h1 className="text-lg font-semibold">Something went wrong</h1>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            {error.message || "The application failed to load."}
          </p>
          <button
            onClick={reset}
            className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
