import React, { useState } from 'react'
import CIcon from '@coreui/icons-react'
import { useNavigate } from 'react-router-dom'
import { cilNotes, cilSpeedometer, cilArrowThickFromRight, cilUser, cilCloudUpload } from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle, CSpinner } from '@coreui/react'
import { auth } from "./firebase-config";

const LogoutButton = () => {
  const [loading, setLoading] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState("Currently redirecting to login page");
  const navigate = useNavigate();

  const handleLogout = async () => {
    // Hapus tanda goodbyeToastShown saat keluar
    localStorage.removeItem('goodbyeToastShown');
    try {
      // Mulai memuat state
      setLoading(true);

      // Mengatur interval pesan untuk titik-titik
      let index = 0;
      const messages = [
        "Currently redirecting to login page",
        "Currently redirecting to login page.",
        "Currently redirecting to login page..",
        "Currently redirecting to login page..."
      ];
      const interval = setInterval(() => {
        setRedirectMessage(messages[index]);
        index = (index + 1) % messages.length;
      }, 500); // Change message every 500ms

      // Simulasikan waktu pemuatan (3 detik)
      setTimeout(async () => {
        clearInterval(interval); // Berhenti mengubah pesan
        await auth.signOut();
        localStorage.removeItem("userSession");

        // Diarahkan ke halaman login setelah keluar
        navigate("/login", { state: { showGoodbyeToast: true } });
      }, 3000); // 3 detik sebelum dialihkan
    } catch (error) {
      setLoading(false);  // Hentikan pemuatan jika terjadi kesalahan
    }
  };

  return (
    <div>
      {/* Tombol keluar */}
      <button className="nav-link" onClick={handleLogout} style={{ flex: 0, width: '100%' }}>
        <CIcon icon={cilArrowThickFromRight} customClassName="nav-icon" />
        <span>Logout</span>
      </button>

      {/* Loading overlay */}
      {loading && (
        <div className="loading-overlay d-flex flex-column justify-content-center align-items-center position-fixed top-0 start-0 w-100 h-100" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', zIndex: 1050 }} >
          <CSpinner color="primary" className="spinner" />
          <p className="redirect-message mt-3">{redirectMessage}</p>
        </div>
      )}
    </div>
  );
};

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    badge: {
      color: 'info',
    },
  },
  {
    component: CNavTitle,
    name: 'Event GMS',
  },
  {
    component: CNavGroup,
    name: 'Schedule Event',
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Line 1',
        to: '/schedule-event/line-1',
      },
      {
        component: CNavItem,
        name: 'Line 2',
        to: '/schedule-event/line-2',
      },
      {
        component: CNavItem,
        name: 'Line 3',
        to: '/schedule-event/line-3',
      },
    ],
  },
  {
    component: CNavTitle,
    name: 'Flyer Data',
  },
  {
    component: CNavItem,
    name: 'Flyer',
    to: '/announcement-flyer',
    icon: <CIcon icon={cilCloudUpload} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Setting',
  },
  {
    component: CNavItem,
    name: 'Profile',
    to: '/pengguna/profile',
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
  },
  {
    component: LogoutButton,
  },
]

export default _nav