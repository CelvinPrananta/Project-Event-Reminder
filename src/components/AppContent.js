import React, { Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { CContainer, CSpinner } from '@coreui/react'

// routes config
import routes from '../routes'
import { useAuthRedirect } from '../views/check-auth/auth-apps.js'

const protectedPaths = [
  '/dashboard',
  '/schedule-event/line-1',
  '/schedule-event/line-2',
  '/schedule-event/line-3',
  '/announcement-flyer',
  '/pengguna/profile'
]

const AppContent = () => {
  const location = useLocation()
  
  // Panggil pemeriksaan autentikasi dan logika pengalihan
  if (location.pathname !== '/' && location.pathname !== '/register') {
    useAuthRedirect(protectedPaths)
  }

  return (
    <CContainer className="px-4" lg>
      <Suspense fallback={<CSpinner color="primary" />}>
        <Routes>
          {routes.map((route, idx) => {
            return (
              route.element && (
                <Route
                  key={idx}
                  path={route.path}
                  exact={route.exact}
                  name={route.name}
                  element={<route.element />}
                />
              )
            )
          })}
          <Route path="/" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </Suspense>
    </CContainer>
  )
}

export default React.memo(AppContent)