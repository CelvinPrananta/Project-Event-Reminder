import React, { useState, useEffect } from 'react';
import { CCard, CCardBody, CCardHeader, CCol, CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow, CButton, CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CForm, CFormText, CToast, CToastHeader, CToastBody, CToaster, CProgress } from '@coreui/react';
import { cilTrash } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import { ref, set, remove, onValue } from 'firebase/database';
import { storage, database, auth } from "../../firebase-config";
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import '@fancyapps/ui/dist/fancybox.css';
import { Fancybox } from '@fancyapps/ui';
import { Link } from 'react-router-dom';
import imageCompression from 'browser-image-compression';

const AnnouncementFlyer = () => {
  const [flyers, setFlyers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newFlyer, setNewFlyer] = useState({ image: '', filename: '', createdAt: '' });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [errors, setErrors] = useState({ image: '' });
  const [fileDetails, setFileDetails] = useState({ name: '', size: '' });

  // Konfirmasi status modal untuk penghapusan
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [flyerToDelete, setFlyerToDelete] = useState(null);

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

  // Ambil flyers dari Firebase
  useEffect(() => {
    const flyersRef = ref(database, 'flyerdata'); // Menyimpan data di firebase dengan nama "flyerdata"
    onValue(flyersRef, (snapshot) => {
      const data = snapshot.val();
      const loadedFlyers = [];
      for (let id in data) {
        loadedFlyers.push({ id, ...data[id] });
      }
      setFlyers(loadedFlyers); // Perbarui state dengan flyers yang diambil
    });
  }, []);

  // Validasi bidang formulir
  const validateFields = () => {
    let fieldErrors = {};
    if (!newFlyer.filename) fieldErrors.image = 'Image field is required.';
    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  };

  // Menangani penambahan flyer
  const handleAddFlyer = () => {
    if (!validateFields()) return;

    const flyerId = Date.now();
    const createdAt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
    const flyerRef = ref(database, 'flyerdata/' + flyerId); // Referensi unik untuk setiap flyer

    set(flyerRef, {
      id: flyerId,
      filename: newFlyer.filename,
      image: newFlyer.image, // Simpan URL gambar
      createdAt,
    })
      .then(() => {
        setFlyers([...flyers, { id: flyerId, filename: newFlyer.filename, image: newFlyer.image, createdAt }]); // Tambahkan flyer baru ke state
        setNewFlyer({ image: '', filename: '', createdAt: '' });
        setShowModal(false);
        showToast({ type: 'success', message: 'Flyer added successfully.' });
      })
      .catch((error) => {
        showToast({ type: 'error', message: `Failed to add flyer: ${error.message}` });
      });
  };

  // Menangani penghapusan flyer
  const handleDeleteFlyer = (id) => {
    setFlyerToDelete(id); // Simpan ID flyer yang akan dihapus
    setShowDeleteModal(true); // Tampilkan modal konfirmasi penghapusan
  };

  // Menangani unggahan gambar
  const handleImageUpload = async (acceptedFiles) => {
    const file = acceptedFiles[0];

    if (!file) {
      showToast({ type: 'error', message: 'No file selected. Please try again.' });
      return;
    }

    // Validasi tipe file
    const validFileTypes = ['image/jpeg', 'image/png'];
    if (!validFileTypes.includes(file.type)) {
      showToast({
        type: 'error',
        message: `Invalid file type (${file.type}). Please upload a file with one of the following types: JPEG, JPG, PNG.`,
      });
      return;
    }

    // Kompres gambar
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    };
    try {
      const compressedFile = await imageCompression(file, options);

      // Buat nama file dan referensi penyimpanan baru
      const filename = `${Date.now()}_${compressedFile.name}`;
      const storagePath = `announcement-flyer/assets/images/${filename}`; // Simpan gambar di "announcement-flyer/assets/images/"
      const storageReference = storageRef(storage, storagePath);

      const uploadTask = uploadBytesResumable(storageReference, compressedFile);

      // Tampilkan preview gambar sementara
      const reader = new FileReader();
      reader.onload = () => {
        setNewFlyer({ ...newFlyer, image: reader.result, filename }); // Tampilkan gambar lokal sementara
      };
      reader.readAsDataURL(compressedFile);

      // Memantau progress unggahan
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          showToast({ type: 'error', message: `Failed to upload image: ${error.message}` });
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setNewFlyer({ ...newFlyer, image: downloadURL, filename }); // Simpan URL unduhan sebagai "image"
            setUploadProgress(0); // Setel ulang progress setelah pengunggahan selesai
          });
        }
      );

      // Tetapkan detail file (nama dan ukuran) ke state
      setFileDetails({
        name: compressedFile.name,
        size: compressedFile.size <= 1024 * 1024  // Periksa apakah ukuran file kurang dari atau sama dengan 1 MB (1024 KB)
          ? (compressedFile.size / 1024).toFixed(2) + ' KB'  // Jika ukuran file kurang dari atau sama dengan 1 MB, tampilkan ukuran dalam KB
          : (compressedFile.size / 1024 / 1024).toFixed(2) + ' MB',  // Jika ukuran file melebihi 1 MB, tampilkan ukuran dalam MB
      });

    } catch (error) {
      showToast({ type: 'error', message: `Image compression failed: ${error.message}` });
    }
  };

  // Toast notifikasi
  const renderToast = () => {
    if (!toastMessage) return null;

    return (
      <CToast autohide={false} visible={true} color={toastMessage.type === 'success' ? 'success' : 'danger'}>
        <CToastHeader closeButton>
          <strong className="me-auto">Flyer Upload | GMS Church</strong>
          <small>Just now</small>
        </CToastHeader>
        <CToastBody>{toastMessage.message}</CToastBody>
      </CToast>
    );
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 5000); // Sembunyikan toast setelah 5 detik
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleImageUpload,
    accept: {
      'image/jpeg': [],
      'image/png': [],
    }, // Hanya menerima file .jpg, .jpeg, .png
  });

  return (
    <CCol xs={12}>
      <CCard className="mb-4">
        <CCardHeader>
          <strong>Announcement Flyer</strong>
        </CCardHeader>
        <CCardBody>
          <p className="text-body-secondary small">
            Please click <code>Add Flyer</code> to upload an announcement flyer.
          </p>
          <CButton color="primary" onClick={() => setShowModal(true)}>
            Add Flyer
          </CButton>
          <div className="table-responsive mt-3">
            <CTable hover>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell scope="col">ID</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Image</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Filename</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Date Uploaded</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {flyers.map((flyer) => (
                  <CTableRow key={flyer.id}>
                    <CTableDataCell>{flyer.id}</CTableDataCell>
                    <CTableDataCell>
                      <Link to={flyer.image} data-fancybox="gallery" data-caption={flyer.filename}>
                        <img src={flyer.image} alt={flyer.filename} style={{ width: '100px', height: 'auto' }} />
                      </Link>
                    </CTableDataCell>
                    <CTableDataCell>{flyer.filename}</CTableDataCell>
                    <CTableDataCell>{flyer.createdAt} WIB</CTableDataCell>
                    <CTableDataCell>
                      <CButton color="danger" onClick={() => handleDeleteFlyer(flyer.id)}>
                        <CIcon icon={cilTrash} />
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </div>
        </CCardBody>
      </CCard>

      {/* Modal untuk menambahkan flyer */}
      <CModal visible={showModal} onClose={() => setShowModal(false)}>
        <CModalHeader>
          <CModalTitle>Add Flyer</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
              <div {...getRootProps()} style={{ border: '2px dashed #ccc', padding: '20px', textAlign: 'center' }}>
                <input {...getInputProps()} />
                <p>
                  {fileDetails.name ? `File: ${fileDetails.name} (${fileDetails.size})` : 'Drag and drop an image here, or click to select one.'}
                </p>
              </div>
              {errors.image && (
                <CFormText color="danger" style={{ color: '#dc3545' }}>
                  {errors.image}
                </CFormText>
              )}
              {(newFlyer.image || uploadProgress > 0) && (
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '15px' }}>
                  {newFlyer.image && (
                    <Link to={newFlyer.image} data-fancybox="gallery" data-caption={fileDetails.name || "Preview Image"} style={{ marginRight: '20px' }} >
                      <img src={newFlyer.image} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
                    </Link>
                  )}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <CProgress value={uploadProgress} style={{ flex: 1, height: '20px', backgroundColor: '#e9ecef' }} color="primary">
                      <span style={{ fontSize: '12px', color: '#5856d6', lineHeight: '20px', padding: '0 5px' }}>
                        {Math.round(uploadProgress)}%
                      </span>
                    </CProgress>
                  )}
                </div>
              )}

            {/* Tombol Reset */}
            {newFlyer.image && (
              <CButton color="warning" style={{ marginTop: '15px', color: '#fff' }} onClick={() => { setNewFlyer({ image: '', filename: '', createdAt: '' }); setFileDetails({ name: '', size: '' }); setUploadProgress(0) }}>
                Reset
              </CButton>
            )}
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowModal(false)}>Close</CButton>
          <CButton color="primary" onClick={() => { handleAddFlyer(); setFileDetails({ name: '', size: '' }); setNewFlyer({ image: '', filename: '', createdAt: '' }) }} disabled={ uploadProgress > 0 && uploadProgress < 100 } >
            { uploadProgress > 0 && uploadProgress < 100 ? 'Uploading...' : 'Add' }
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal untuk konfirmasi penghapusan */}
      <CModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <CModalHeader>
          <CModalTitle>Confirm Deletion</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>Are you sure you want to delete this flyer?</p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </CButton>
          <CButton
            color="danger"
            onClick={() => {
              if (flyerToDelete) {
                // Lakukan penghapusan sebenarnya
                const flyerRef = ref(database, 'flyerdata/' + flyerToDelete);
                remove(flyerRef)
                  .then(() => {
                    setFlyers(flyers.filter((flyer) => flyer.id !== flyerToDelete)); // Hapus flyer dari state
                    showToast({ type: 'success', message: 'Flyer deleted successfully.' });
                  })
                  .catch((error) => {
                    showToast({ type: 'error', message: `Failed to delete flyer: ${error.message}` });
                  });
              }
              setShowDeleteModal(false); // Tutup modal setelah penghapusan
            }}
          >
            Delete
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Toaster untuk Notifikasi */}
      <CToaster placement="top-end">
        {renderToast()}
      </CToaster>
    </CCol>
  )
}

export default AnnouncementFlyer