import React, { lazy, Suspense } from 'react'
import LoadingSpinner from '../components/common/LoadingSpinner'

const Universe = lazy(() => import('../components/universe/UniverseView'))

export default function UniverseView() {
  return (
    <div className="w-full h-[calc(100vh-64px)]">
      <Suspense fallback={<LoadingSpinner />}>
        <Universe />
      </Suspense>
    </div>
  )
}
