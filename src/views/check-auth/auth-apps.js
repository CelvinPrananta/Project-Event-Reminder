import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from "../../firebase-config"
import { doc, getDoc } from "firebase/firestore"

export const useAuthRedirect = (redirectPaths) => {
  const [userName, setUserName] = useState("User")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const isMounted = useRef(true)

  useEffect(() => {
    // Daftar rute yang tidak memerlukan autentikasi
    const publicPaths = ['/', '/register', '/forgot-password']; 

    // Periksa status autentikasi
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          setLoading(true); // Mulai memuat sambil mengambil data pengguna
          
          // Periksa apakah pengguna telah menetapkan displayName di Firebase Authentication
          if (user.displayName) {
            setUserName(user.displayName);
          } else {
            // Jika tidak ada displayName, ambil dari Firestore
            const userDocRef = doc(firestore, "users", user.uid);
            const docSnap = await getDoc(userDocRef);

            if (docSnap.exists()) {
              const userData = docSnap.data();
              setUserName(userData.name || "User");
            } else {
              console.error("User document not found in Firestore.");
            }
          }
        } catch (error) {
          navigate("/login"); // Jika terjadi kesalahan, arahkan ke login
        } finally {
          if (isMounted.current) {
            setLoading(false); // Hentikan pemuatan setelah data diambil
          }
        }
      } else if (!publicPaths.includes(location.pathname) && !redirectPaths.includes(location.pathname)) {
        // Jika pengguna tidak terautentikasi dan mencoba mengakses rute yang tidak diizinkan, arahkan ke /login
        navigate("/login", { state: { showLoginWarning: true } });
      }
    });

    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, [navigate, location.pathname, redirectPaths]);

  return { userName, loading };
};