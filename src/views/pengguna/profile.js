import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { auth, firestore, database } from "../../firebase-config";
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from "firebase/firestore";

const Profile = () => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // Memeriksa apakah pengguna sudah login
    useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (!user) {
        navigate('/login'); // Diarahkan ke halaman login jika tidak ada pengguna yang diautentikasi
        } else {
        setUser(user);
        setLoading(false);
        }
    });

    return () => unsubscribe(); // Bersihkan listener ketika komponen tidak lagi digunakan
    }, [navigate]);

    if (loading) {
        return <p>Loading...</p>; // Menampilkan loading sampai status login diperiksa
    }

    return (
        <p className="typing-animation">Coming Soon...</p>

    )
}

export default Profile