import React, { useState, useEffect, useRef } from 'react';
import { database, ref, onValue } from '../../firebase-config';
import '../landing/assets/style.css';

const LandingPage = () => {
    // State untuk gambar dan jadwal acara dari Firebase
    const [images, setImages] = useState([]);
    const [eventData1, setEventData1] = useState([]);
    const [eventData2, setEventData2] = useState([]);
    const [eventData3, setEventData3] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isImageTransitioning, setIsImageTransitioning] = useState(false);
    const [currentEventIndex1, setCurrentEventIndex1] = useState(0);
    const [currentEventIndex2, setCurrentEventIndex2] = useState(0);
    const [currentEventIndex3, setCurrentEventIndex3] = useState(0);
    const [isEventTransitioning, setIsEventTransitioning] = useState(false);

    // Ref untuk kontainer utama
    const containerRef = useRef(null);

    // Format tanggal untuk Indonesia
    const getFormattedDate = () => {
        const date = new Date();
    
        // Konversi waktu ke zona WIB (GMT+7)
        const utc = date.getTime() + date.getTimezoneOffset() * 60000; // Waktu UTC
        const wibTime = new Date(utc + 7 * 3600000); // Tambahkan offset GMT+7
    
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Intl.DateTimeFormat('id-ID', options).format(wibTime);
    };

    // Ambil gambar dan jadwal acara dari Firebase
    useEffect(() => {
        const fetchImages = () => {
            const imagesRef = ref(database, 'flyerdata');
            onValue(imagesRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const loadedImages = Object.values(data).map((flyer) => flyer.image); // Ambil URL gambar
                    setImages(loadedImages);
                }
            });
        };

        // Filter jadwal acara berdasarkan endTime, timestamps Indonesia saat ini, dan created_at dari firebase
        const formatTimestampToIndonesianFormat = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
        
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        };
        
        const filterEventsByEndTime = (events) => {
            const now = new Date();
            const utc = now.getTime() + now.getTimezoneOffset() * 60000;
            const wibNow = new Date(utc + 7 * 3600000); // Waktu Indonesia sekarang
        
            return events.filter((event) => {
                if (!event.endTime || !event.created_at) {
                    console.warn('Invalid event data:', event);
                    return false;
                }
        
                // Konversi `created_at` ke objek Date
                const eventCreatedAt = new Date(event.created_at);
        
                // Konversi `endTime` dan mulai dari tanggal `created_at`
                const eventEndTime = new Date(eventCreatedAt); 
                const [hours, minutes] = event.endTime.split(':');
                eventEndTime.setHours(parseInt(hours, 10));
                eventEndTime.setMinutes(parseInt(minutes, 10));
                eventEndTime.setSeconds(0);
        
                // Event di masa depan
                const isEventInFuture = eventCreatedAt.getTime() > wibNow.getTime();
        
                // Event sedang berlangsung
                const isEventOngoing = eventCreatedAt.getTime() <= wibNow.getTime() && eventEndTime.getTime() > wibNow.getTime();
        
                // Menampilkan event sedang berlangsung atau valid di masa depan
                return isEventInFuture || isEventOngoing;
            });
        };

        const fetchEvents = () => {
            const events1Ref = ref(database, 'events1');
            const events2Ref = ref(database, 'events2');
            const events3Ref = ref(database, 'events3');

            onValue(events1Ref, (snapshot) => {
                const data = snapshot.val();
                const events = data ? Object.values(data) : [];
                setEventData1(filterEventsByEndTime(events)); // Filter sebelum ditampilkan ke state
            });

            onValue(events2Ref, (snapshot) => {
                const data = snapshot.val();
                const events = data ? Object.values(data) : [];
                setEventData2(filterEventsByEndTime(events)); // Filter sebelum ditampilkan ke state
            });

            onValue(events3Ref, (snapshot) => {
                const data = snapshot.val();
                const events = data ? Object.values(data) : [];
                setEventData3(filterEventsByEndTime(events)); // Filter sebelum ditampilkan ke state
            });
        };

        fetchImages();
        fetchEvents();

        // Interval untuk menyaring ulang acara setiap menit
        const eventFilterInterval = setInterval(() => {
            setEventData1((prevData) => filterEventsByEndTime(prevData));
            setEventData2((prevData) => filterEventsByEndTime(prevData));
            setEventData3((prevData) => filterEventsByEndTime(prevData));
        }, 60000); // Jalankan setiap 60 detik

        return () => clearInterval(eventFilterInterval); // Bersihkan interval saat komponen di-unmount
    }, []);

    useEffect(() => {
        // Interval untuk mengganti gambar dan jadwal acara
        const imageInterval = setInterval(() => {
            setIsImageTransitioning(true);
            setTimeout(() => {
                setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
                setIsImageTransitioning(false);
            }, 500); // Blur 5 detik
        }, 10000); // 10 detik perpindahan

        const eventInterval = setInterval(() => {
            setIsEventTransitioning(true);
            setTimeout(() => {
                if (eventData1.length > 0) {
                    setCurrentEventIndex1((prevIndex) => (prevIndex + 1) % eventData1.length);
                }
                if (eventData2.length > 0) {
                    setCurrentEventIndex2((prevIndex) => (prevIndex + 1) % eventData2.length);
                }
                if (eventData3.length > 0) {
                    setCurrentEventIndex3((prevIndex) => (prevIndex + 1) % eventData3.length);
                }
                setIsEventTransitioning(false);
            }, 500); // Blur 5 detik
        }, 5000); // 5 detik perpindahan

        // Membersihkan interval
        return () => {
            clearInterval(imageInterval);
            clearInterval(eventInterval);
        };
    }, [images.length, eventData1, eventData2, eventData3]);

    // Fungsi untuk fullscreen
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            containerRef.current?.classList.add('fullscreen'); // Tambahkan class saat fullscreen
        } else {
            document.exitFullscreen?.();
            containerRef.current?.classList.remove('fullscreen'); // Hapus class saat keluar fullscreen
        }
    };

    // Untuk merender jadwal acara
    const renderEvent = (eventData, currentIndex) => {
        if (!eventData || eventData.length === 0) {
            return null;
        }

        const indexToShow = eventData.length === 1 ? 0 : currentIndex;

        return (
            <div className={`event ${isEventTransitioning ? 'blur' : ''}`}>
                <h4>{eventData[indexToShow]?.title}</h4>
                <div className="event-details">
                    <p>{eventData[indexToShow]?.location}</p>
                    <p className="floor">{eventData[indexToShow]?.floor}<sup>{eventData[indexToShow]?.textfloor || "FL"}</sup></p>
                    <p className="time">{eventData[indexToShow]?.startTime} - {eventData[indexToShow]?.endTime} WIB</p>
                </div>
            </div>
        );
    };

    return (
        <div ref={containerRef} onDoubleClick={toggleFullscreen} className="landing-container">
            {/* Bagian Kiri Kontainer */}
            <div className="left-container">
                <div className="header-landing">
                    <h2>JADWAL HARI INI</h2>
                    <h3>{getFormattedDate()}</h3>
                </div>
                <div className={`events-container ${isImageTransitioning ? 'transitioning' : 'non-transitioning'}`}>
                    {eventData1.length > 0 && renderEvent(eventData1, currentEventIndex1)}
                    {eventData2.length > 0 && renderEvent(eventData2, currentEventIndex2)}
                    {eventData3.length > 0 && renderEvent(eventData3, currentEventIndex3)}
                </div>
            </div>

            {/* Bagian Kanan Kontainer */}
            <div className="right-container">
                {images.length > 0 && ( <img src={images[currentImageIndex]} alt={`flyers-${currentImageIndex + 1}`} className={isImageTransitioning ? 'transitioning' : 'non-transitioning'}/> )}
            </div>
        </div>
    )
}

export default LandingPage