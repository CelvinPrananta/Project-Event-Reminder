import React, { Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useAuthRedirect } from './views/check-auth/auth-apps.js'
import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// Other pages outside the Apps
const Login = React.lazy(() => import('./views/pages/login/Login'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))
const LandingPage = React.lazy(() => import('./views/landing/Landing-page'))

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
  useAuthRedirect(protectedPaths)

  // Set judul halaman berdasarkan rute
  useEffect(() => {
    const routeTitleMap = {
      '/': 'Event Reminder | GMS Church ',
      '/login': 'Login | GMS Church ',
      '/register': 'Register | GMS Church ',
      '/404': 'Page Not Found | GMS Church ',
      '/500': 'Server Error | GMS Church ',
      '/dashboard': 'Dashboard | GMS Church ',
      '/schedule-event/line-1': 'Schedule Event - Line 1 | GMS Church ',
      '/schedule-event/line-2': 'Schedule Event - Line 2 | GMS Church ',
      '/schedule-event/line-3': 'Schedule Event - Line 3 | GMS Church ',
      '/announcement-flyer': 'Announcement Flyer | GMS Church ',
      '/pengguna/profile': 'Profile | GMS Church ',
    }

    // Dapatkan title berdasarkan rute, default jika rute tidak terdaftar
    const newTitle = routeTitleMap[location.pathname] || 'GMS Church '

    // Update judul di tab browser secara dinamis (scrolling)
    let titleInterval
    let tempTitle = newTitle
    let currentIndex = 0
    let repeatCount = 0
    const maxRepeats = 5

    // Fungsi untuk membuat judul bergerak
    const moveTitle = () => {
      document.title = tempTitle.slice(currentIndex) + tempTitle.slice(0, currentIndex)

      currentIndex++
      if (currentIndex === tempTitle.length) {
        currentIndex = 0
        repeatCount++
        if (repeatCount >= maxRepeats) {
          clearInterval(titleInterval)  // Stop animasi setelah sejumlah pengulangan
        }
      }
    }

    titleInterval = setInterval(moveTitle, 500) // Update judul setiap 500ms

    // Stop animasi jika ada perubahan rute
    return () => clearInterval(titleInterval)

  }, [location.pathname]) // Efek dijalankan setiap kali rute berubah
  
  const navigate = useNavigate();

  useEffect(() => {
    const unlisten = () => {
      // Hapus tanda saat pengguna berpindah halaman
      sessionStorage.removeItem('loginWarningToastShown');
    };
  
    // Pastikan untuk membersihkan listener saat komponen unmount
    return unlisten;
  }, [navigate]);
  
  const isLandingPage = location.pathname === '/'

  return (
    <Suspense fallback={
        <div className="pt-3 text-center">
          <CSpinner color="primary" variant="grow" />
        </div>
      }>

      <Routes>
        <Route exact path="/" name="Landing Page" element={<LandingPage />} />
        <Route exact path="/login" name="Login Page" element={<Login />} />
        <Route exact path="/register" name="Register Page" element={<Register />} />
        <Route exact path="/404" name="Page 404" element={<Page404 />} />
        <Route exact path="/500" name="Page 500" element={<Page500 />} />
        {!isLandingPage && <Route path="*" name="Home" element={<DefaultLayout />} />}
      </Routes>

    </Suspense>
  )
}

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) {
      setColorMode(theme)
    }

    if (isColorModeSet()) {
      return
    }

    setColorMode(storedTheme)
  }, [])

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App