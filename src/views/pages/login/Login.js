import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "../../../firebase-config";
import { getDoc, doc } from 'firebase/firestore';
import { CButton, CCard, CCardBody, CCardGroup, CCol, CContainer, CForm, CFormInput, CInputGroup, CInputGroupText, CRow, CSpinner, CToast, CToastBody, CToastHeader, CToaster } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilEnvelopeClosed } from '@coreui/icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import GoogleLogo from '../../../assets/brand/google-logo.png';

const Login = () => {
  const [toast, addToast] = useState(null);
  const toaster = useRef();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error1, setError1] = useState("");
  const [error2, setError2] = useState("");
  const [error3, setError3] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState("Currently redirecting to dashboard page");
  const [redirectMessage2, setRedirectMessage2] = useState("Currently redirecting to the register page");
  const [showPassword, setShowPassword] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Periksa apakah sesi pengguna ada di localStorage
    const userSession = localStorage.getItem("userSession");
    if (userSession) {
      // Jika ada sesi, langsung alihkan ke /dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);
  
  useEffect(() => {
    if (loading) {
      const messages = [
        "Currently redirecting to dashboard page",
        "Currently redirecting to dashboard page.",
        "Currently redirecting to dashboard page..",
        "Currently redirecting to dashboard page...",
      ];
      const messages2 = [
        "Currently redirecting to the register page",
        "Currently redirecting to the register page.",
        "Currently redirecting to the register page..",
        "Currently redirecting to the register page...",
      ];
      let index = 0;
      let index2 = 0;
      const interval = setInterval(() => {
        if (redirectTarget === '/dashboard') {
          setRedirectMessage(messages[index]);
        } else if (redirectTarget === '/register') {
          setRedirectMessage2(messages2[index2]);
        }
        index = (index + 1) % messages.length;
        index2 = (index2 + 1) % messages2.length;
      }, 500);
      return () => clearInterval(interval);
    }
  }, [loading, redirectTarget]);

  // Toast ketika pengguna melakukan logout
  useEffect(() => {
    if (location.state?.showGoodbyeToast) {
      // Periksa apakah ucapan selamat tinggal sudah ditampilkan di sesi saat ini
      const hasShownGoodbyeToast = localStorage.getItem('goodbyeToastShown');
      
      if (!hasShownGoodbyeToast) {
        const goodbyeToast = (
          <CToast>
            <CToastHeader closeButton>
              <svg className="rounded me-2" width="20" height="20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" focusable="false" role="img">
                <rect width="100%" height="100%" fill="#4caf50"></rect>
              </svg>
              <strong className="me-auto">Event Reminder | GMS Church</strong>
              <small>Just now</small>
            </CToastHeader>
            <CToastBody>Goodbye, you have successfully exited the app.</CToastBody>
          </CToast>
        );
        addToast(goodbyeToast);
  
        // Tetapkan tanda di localStorage untuk mencegah ditampilkannya toast lagi
        localStorage.setItem('goodbyeToastShown', 'true');
      }
    }
  }, [location.state]);

  // Toast ketika pengguna belum login
  useEffect(() => {
    // Cek apakah toast sudah pernah ditampilkan di sesi ini
    const hasShownToast = sessionStorage.getItem('loginWarningToastShown');
  
    // Cek apakah halaman sebelumnya bukan '/register' dan apakah toast belum ditampilkan
    if (!hasShownToast && location.state?.showLoginWarning && location.pathname !== '/register') {
      const warningLoginToast = (
        <CToast>
          <CToastHeader closeButton>
            <svg className="rounded me-2" width="20" height="20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" focusable="false" role="img">
              <rect width="100%" height="100%" fill="#ffc107"></rect>
            </svg>
            <strong className="me-auto">Event Reminder | GMS Church</strong>
            <small>Just now</small>
          </CToastHeader>
          <CToastBody>You are not logged in. Please login first to access this app 😊.</CToastBody>
        </CToast>
      );
      addToast(warningLoginToast);
  
      // Tandai bahwa toast telah ditampilkan di sessionStorage
      sessionStorage.setItem('loginWarningToastShown', 'true');
  
      // Hapus state untuk mencegah toast muncul lagi setelah refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, location.pathname, navigate]);

  const handleLogin = async () => {
    // Setel ulang kesalahan sebelum mencoba masuk
    setError1("");
    setError2("");
    setError3("");

    // Validasi input email dan password
    if (!email) {
      setError2("Email field is required or invalid.");
    } else if (!email.endsWith("@gmail.com")) {
      setError2("Email must be a valid @gmail.com address.");
    }

    if (!password) {
      setError3("Password field is required.");
    }

    // Jika ada kesalahan validasi, hentikan eksekusi
    if (!email || !email.endsWith("@gmail.com") || !password) {
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);

      // Setelah login berhasil, simpan sesi pengguna
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          // Simpan data sesi (untuk saat ini, menggunakan localStorage)
          localStorage.setItem("userSession", JSON.stringify(userData));
        }
      }
  
      // Memicu loading spinner dan efek blur
      setLoading(true);
      setRedirectTarget('/dashboard'); // Tetapkan pengalihan target ke /dashboard
      setTimeout(() => {
        navigate('/dashboard', { state: { loginSuccess: true } }); // Diarahkan ke dashboard setelah 3 detik dan kirim state ke dashboard
      }, 3000);
    } catch (err) {

      // Menampilkan toast untuk kesalahan login
      const errorToast = (
        <CToast>
          <CToastHeader closeButton>
            <svg className="rounded me-2" width="20" height="20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" focusable="false" role="img">
              <rect width="100%" height="100%" fill="#ff4d4f"></rect>
            </svg>
            <strong className="me-auto">Event Reminder - GMS Church</strong>
            <small>Just now</small>
          </CToastHeader>
          <CToastBody>Failed, password doesn't match. please re-enter a valid password.</CToastBody>
        </CToast>
      );
      addToast(errorToast);

      // Menangani kode kesalahan tertentu
      if (err.code === 'auth/invalid-credential') {
        setError1("Sorry, your email is not registered. Please register first.");
      } else if (err.code === 'auth/invalid-email') {
        setError2("Email field is required or invalid.");
      } else if (err.code === 'auth/missing-password') {
        setError3("Invalid password. Please try again.");
      } else {
        setError1(err.message);
      }
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Masuk dengan Google menggunakan Firebase Auth
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
  
      // Setelah berhasil login Google, ambil data pengguna dari Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
  
      if (userDocSnap.exists()) {
        // Jika pengguna ada di Firestore, simpan data sesi dan arahkan ke dashboard
        const userData = userDocSnap.data();
        localStorage.setItem("userSession", JSON.stringify(userData));
  
        // Tampilkan loading spinner dan arahkan ke dashboard setelah 3 detik
        setLoading(true);
        setRedirectTarget('/dashboard');
        setTimeout(() => {
          navigate('/dashboard', { state: { loginSuccess: true } });
        }, 3000);
      } else {

        // Jika pengguna tidak ada di Firestore, arahkan ke halaman register
        setLoading(true);
        setRedirectTarget('/register');
        
        // Tampilkan loading spinner dan alihkan setelah 3 detik
        setTimeout(() => {
          navigate('/register');
        }, 3000);
      }
    } catch (error) {
      setError1("Something went wrong with Google login. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className={`bg-body-tertiary min-vh-100 d-flex flex-row align-items-center`}>
      <CContainer>
        {loading && (
          <div className="loading-overlay d-flex flex-column justify-content-center align-items-center position-fixed top-0 start-0 w-100 h-100" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', zIndex: 1050 }}>
            <CSpinner color="primary" className='spinner' />
            <p className='redirect-message mt-3'>{redirectTarget === '/dashboard' ? redirectMessage : redirectMessage2}</p>
          </div>
        )}
        <CToaster ref={toaster} push={toast} placement="top-end" />
        <CRow className={`justify-content-center ${loading ? 'blur' : ''}`}>
          <CCol md={8}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <CForm onSubmit={(e) => e.preventDefault()}>
                    <h1>Login</h1>
                    <p className="text-body-secondary">Sign In to your account</p>

                    {/* Tombol masuk dengan Google */}
                    <div className="text-center mb-4">
                      <CButton color="link" className="d-flex justify-content-center align-items-center" style={{ maxWidth: '300px', margin: '0 auto', padding: '12px 20px', borderRadius: '5px', border: '1px solid #dadce0', fontSize: '16px' }} onClick={handleGoogleLogin}>
                        <img src={GoogleLogo} alt="Google logo" style={{ width: '1.3rem' }} />
                      </CButton>
                    </div>

                    {/* Pembagi dengan "atau" */}
                    <div className="d-flex align-items-center mb-4">
                      <div style={{ flexGrow: 1, height: '1px', backgroundColor: '#dadce0' }}></div>
                      <p className="text-center text-muted mx-2 mb-0">or</p>
                      <div style={{ flexGrow: 1, height: '1px', backgroundColor: '#dadce0' }}></div>
                    </div>

                    {error1 && <p className='error-general'>{error1}</p>}
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilEnvelopeClosed} />
                      </CInputGroupText>
                      <CFormInput type="email" placeholder="Enter your email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </CInputGroup>
                    {error2 && <p className='error-email'>{error2}</p>}
                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput type={showPassword ? "text" : "password"} placeholder="Enter your password" autoComplete="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                      <CButton color="primary" className="password-toggle p-2 d-flex align-items-center justify-content-center border" onClick={() => setShowPassword(!showPassword)} style={{ borderRadius: '0 5px 5px 0' }} >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                      </CButton>
                    </CInputGroup>
                    {error3 && <p className='error-password'>{error3}</p>}
                    <CRow>
                      <CCol xs={6}>
                        <CButton color="primary" className="px-4" onClick={handleLogin}>
                          Login
                        </CButton>
                      </CCol>
                      <CCol xs={6} className="text-right">
                        <CButton color="link" className="px-0">
                          Forgot password?
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
              <CCard className="text-white bg-primary py-5">
                <CCardBody className="text-center">
                  <div>
                    <h2>Sign up</h2>
                    <p>Welcome to the gms event reminder app, please login using email/password or google if you want to enter the app and if you don't have an account, please register using the button below.</p>
                    <Link to="/register">
                      <CButton color="primary" className="mt-3" active tabIndex={-1}>
                        Register Now!
                      </CButton>
                    </Link>
                    <div className='container-copyright'>
                      <strong className='text-copyright'>&copy;2023 - {new Date().getFullYear()} GMS.</strong>
                      <p className='text-reserved'>All rights reserved.</p>
                    </div>
                  </div>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login