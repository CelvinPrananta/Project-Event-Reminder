import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CAvatar, CDropdown, CDropdownHeader, CDropdownItem, CDropdownMenu, CDropdownToggle, CSpinner } from '@coreui/react'
import { cilUser, cilArrowThickFromRight } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { auth, firestore } from "../../firebase-config";
import { doc, getDoc } from "firebase/firestore";

const AppHeaderDropdown = () => {
  const [loading, setLoading] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState('Currently redirecting to login page');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  // Ambil gambar avatar dan nama pengguna dari Firebase Authentication atau Firestore
  useEffect(() => {
    // Amati perubahan status autentikasi
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);  // Perbarui status pengguna
        setUsername(currentUser.displayName || currentUser.email); // Gunakan displayName atau email sebagai nama pengguna
        if (currentUser.photoURL) {
          setAvatarUrl(currentUser.photoURL); // Tetapkan URL foto dari Firebase Authentication
        } else {
          const userDocRef = doc(firestore, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData && userData.avatarUrl) {
              setAvatarUrl(userData.avatarUrl); // Tetapkan URL avatar dari Firestore
            }
          }
        }
      } else {
        console.error("User is not authenticated.");
      }
    });

    return () => unsubscribe();
  }, []); // Efek ini berjalan sekali saat komponen dipasang

  // Untuk logout dan simpan toast ketika pengguna melakukan logout
  const handleLogout = async () => {
    // Hapus tanda goodbyeToastShown saat keluar
    localStorage.removeItem('goodbyeToastShown');
    try {
      setLoading(true);

      let index = 0;
      const messages = [
        'Currently redirecting to login page',
        'Currently redirecting to login page.',
        'Currently redirecting to login page..',
        'Currently redirecting to login page...'
      ];
      
      const interval = setInterval(() => {
        setRedirectMessage(messages[index]);
        index = (index + 1) % messages.length;
      }, 500); // Ubah pesan setiap 500ms

      // Simulasikan waktu pemuatan dan keluar
      setTimeout(async () => {
        clearInterval(interval); // Berhenti mengubah pesan
        await auth.signOut();
        localStorage.removeItem("userSession");

        // Diarahkan ke halaman login setelah keluar
        navigate("/login", { state: { showGoodbyeToast: true } });
      }, 3000); // Simulasikan penundaan 3 detik sebelum pengalihan
    } catch (error) {
      setLoading(false);  // Hentikan pemuatan jika terjadi kesalahan
    }
  };

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <div className="username-avatar">
          {username && <span className="username">{username}</span>}
          <CAvatar src={avatarUrl || './../src/assets/images/avatars/9.jpg'} size="md" />
        </div>
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-body-secondary fw-semibold mb-2">Account</CDropdownHeader>
        <Link to="/pengguna/profile" className='link-profile'>
          <CDropdownItem>
            <CIcon icon={cilUser} className="me-2" />Profile
          </CDropdownItem>
        </Link>
        <CDropdownHeader className="bg-body-secondary fw-semibold my-2">Settings</CDropdownHeader>
        <CDropdownItem onClick={ handleLogout } className="link-logout">
          <CIcon icon={cilArrowThickFromRight} className="me-2" />Logout
        </CDropdownItem>
      </CDropdownMenu>

      {/* Loading and blur overlay */}
      {loading && (
        <div className="loading-overlay d-flex flex-column justify-content-center align-items-center position-fixed top-0 start-0 w-100 h-100" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', zIndex: 1050 }} >
          <CSpinner color="primary" className="spinner" />
          <p className="redirect-message mt-3">{redirectMessage}</p>
        </div>
      )}
    </CDropdown>
  )
}

export default AppHeaderDropdown