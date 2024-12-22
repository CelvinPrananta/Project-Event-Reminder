import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, firestore } from "../../firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const Dashboard = () => {
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState("User");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
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
          setLoading(false); // Hentikan pemuatan setelah data diambil
        }
      } else {
        // Jika pengguna tidak terautentikasi, arahkan ke halaman login
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      setGreeting("Good Morning,");
    } else if (currentHour < 16) {
      setGreeting("Good Afternoon,");
    } else if (currentHour < 18) {
      setGreeting("Good Evening,");
    } else {
      setGreeting("Good Night,");
    }
  }, []);

  return (
    <div className="page-wrapper">

      {/* Page Header */}
      <div className="content container-fluid">
        <div className="page-header">
          <div className="row">
            <div className="col-sm-12">
              <h3 className="page-title">
                {greeting} {userName} &#128522;
              </h3>
              <ul className="breadcrumb">
                <li className="breadcrumb-item active">
                  <b>{userName}'s</b> Dashboard
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        {loading && (
          <div className="loading-overlay d-flex flex-column justify-content-center align-items-center position-fixed top-0 start-0 w-100 h-100" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', zIndex: 1050 }} >
            <CSpinner color="primary" className="spinner" />
            <p className="redirect-message mt-3">Loading...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard