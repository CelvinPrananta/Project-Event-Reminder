import React, { useState, useEffect } from 'react';
import { CCard, CCardBody, CCardHeader, CCol, CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow, CButton, CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CForm, CFormInput, CFormText, CFormSelect, CToast, CToastHeader, CToastBody, CToaster } from '@coreui/react';
import { cilPencil, cilTrash } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { ref, set, update, remove, onValue } from 'firebase/database';
import { database, auth } from "../../firebase-config";
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const ScheduleEventLine3 = () => {
  const [events, setEvents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', location: '', floor: '', startTime: '', endTime: '' });
  const [editEvent, setEditEvent] = useState(null);
  const [errors, setErrors] = useState({ title: '', location: '', floor: '', startTime: '', endTime: '' });
  const [toastMessage, setToastMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState(null);
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

  // Fetch data dari Realtime Database pada saat pertama kali komponen dimuat
  useEffect(() => {
    const eventsRef = ref(database, 'events3'); // Referensi untuk "events"
    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedEvents = [];
      for (let id in data) {
        loadedEvents.push({ id, ...data[id] });
      }
      setEvents(loadedEvents); // Mengupdate state events dengan data yang diambil dari Firebase
    });
  }, []);

  const validateFields = () => {
    let fieldErrors = {};
    if (!newEvent.title) fieldErrors.title = 'Title field is required.';
    if (!newEvent.location) fieldErrors.location = 'Location field is required.';
    if (!newEvent.floor) fieldErrors.floor = 'Floor field is required.';
    if (!newEvent.startTime) fieldErrors.startTime = 'Start time field is required.';
    if (!newEvent.endTime) fieldErrors.endTime = 'End time field is required.';
    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  };

  // Fungsi untuk menambahkan event
  const handleAddEvent = () => {
    if (!validateFields()) return;

    const eventRef = ref(database, 'events3/' + (events.length + 1)); // Referensi baru untuk event
    
    // Mendapatkan timestamp WIB
    const currentDate = new Date();
    const offset = 7 * 60; // WIB = UTC+7, dalam menit
    const localDate = new Date(currentDate.getTime() + offset * 60 * 1000);
    const currentTimestampWIB = localDate.toISOString().replace('T', ' ').split('.')[0]; // Format "YYYY-MM-DD HH:mm:ss"
  
    const newEventWithTimestamp = { ...newEvent, id: events.length + 1, created_at: currentTimestampWIB };
    
    set(eventRef, newEventWithTimestamp)
      .then(() => {
        setEvents([...events, newEventWithTimestamp]); // Menambahkan event ke state lokal
        setNewEvent({ title: '', location: '', floor: '', startTime: '', endTime: '' }); // Setel ulang Event baru setelah sukses
        setErrors({ title: '', location: '', floor: '', startTime: '', endTime: '' }); // Atur ulang kesalahan
        setShowAddModal(false);
        showToast({ type: 'success', message: 'Successfully added event schedule' });
      })
      .catch((error) => {
        showToast({ type: 'error', message: `Failed to add event: ${error.message}` });
      });
  };

  // Fungsi untuk mengedit event
  const handleEditEvent = (event) => {
    setEditEvent(event);
    setNewEvent({ ...event }); // Set state newEvent dengan data event yang akan diedit
    setShowEditModal(true);
  };

  // Fungsi untuk memperbarui event
  const handleUpdateEvent = () => {
    if (!validateFields()) return;

    const eventRef = ref(database, 'events3/' + editEvent.id); // Referensi untuk event yang akan diperbarui
    update(eventRef, newEvent)
      .then(() => {
        setEvents(events.map((event) => (event.id === editEvent.id ? newEvent : event))); // Memperbarui event di state lokal
        setNewEvent({ title: '', location: '', floor: '', startTime: '', endTime: '' }); // Setel ulang Event baru setelah sukses
        setEditEvent(null); // Reset editEvent setelah selesai edit
        setErrors({ title: '', location: '', floor: '', startTime: '', endTime: '' }); // Atur ulang kesalahan
        setShowEditModal(false);
        showToast({ type: 'success', message: 'Successfully updated event schedule' });
      })
      .catch((error) => {
        showToast({ type: 'error', message: `Failed to update event: ${error.message}` });
      });
  };

  // Fungsi untuk menampilkan modal konfirmasi penghapusan
  const confirmDeleteEvent = (id) => {
    setDeleteEventId(id); // Set ID event yang akan dihapus
    setShowConfirmDeleteModal(true); // Tampilkan modal konfirmasi
  };

  // Fungsi untuk menghapus event
  const handleDeleteEvent = () => {
    const eventRef = ref(database, 'events3/' + deleteEventId); // Referensi ke event yang akan dihapus
    remove(eventRef)
      .then(() => {
        setEvents(events.filter((event) => event.id !== deleteEventId)); // Menghapus event dari state lokal
        setShowConfirmDeleteModal(false); // Tutup modal konfirmasi
        showToast({ type: 'success', message: 'Successfully deleted the event schedule' });
      })
      .catch((error) => {
        showToast({ type: 'error', message: `Failed to delete event: ${error.message}` });
      });
  };

  // Daftar waktu yang bisa dipilih dan bisa dibuat secara dinamis
  const timeOptions = [
    '05:00', '05:30', '06:00', '06:30', '07:00', '07:30',
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30', '22:00', '22:30',
    '23:00', '23:30', '00:00'
  ];

  // Fungsi untuk menampilkan toast
  const renderToast = () => {
    if (!toastMessage) return null;

    return (
      <CToast autohide={false} visible={true} color={toastMessage.type === 'success' ? 'success' : 'danger'}>
        <CToastHeader closeButton>
          <strong className="me-auto">Event Reminder | GMS Church</strong>
          <small>Just now</small>
        </CToastHeader>
        <CToastBody>{toastMessage.message}</CToastBody>
      </CToast>
    );
  };

  // Menampilkan toast dengan waktu otomatis
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 5000); // 5000ms (5 detik)
  };

  if (loading) {
    return <p>Loading...</p>; // Menampilkan loading sampai status login diperiksa
  }

  return (
    <CCol xs={12}>
      <CCard className="mb-4">
        <CCardHeader>
          <strong>Schedule Event</strong> <small>Line 3</small>
        </CCardHeader>
        <CCardBody>
          <p className="text-body-secondary small">
            Please click <code>add event</code> to enter the event schedule for line 3.
          </p>
          <CButton color="primary" onClick={() => { setNewEvent({ title: '', location: '', floor: '', startTime: '', endTime: '' }); setShowAddModal(true) }}>
            Add Event
          </CButton>
          <div className="table-responsive mt-3">
            <CTable hover>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell scope="col">No</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Title</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Location</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Floor</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Time</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {events.map((event, index) => (
                  <CTableRow key={event.id}>
                    <CTableDataCell>{index + 1}</CTableDataCell>
                    <CTableDataCell>{event.title}</CTableDataCell>
                    <CTableDataCell>{event.location}</CTableDataCell>
                    <CTableDataCell>{event.floor}</CTableDataCell>
                    <CTableDataCell>{`${event.startTime} - ${event.endTime}`} WIB</CTableDataCell>
                    <CTableDataCell>
                      <div className="d-flex">
                        <CButton
                          color="warning"
                          style={{ marginLeft: '-0.9rem' }}
                          onClick={() => handleEditEvent(event)}
                          className="mr-2"
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton
                          color="danger"
                          style={{ marginLeft: '0.5rem' }}
                          onClick={() => confirmDeleteEvent(event.id)} // Tampilkan modal konfirmasi
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </div>
        </CCardBody>
      </CCard>

      {/* Modal untuk Konfirmasi Penghapusan */}
      <CModal visible={showConfirmDeleteModal} onClose={() => setShowConfirmDeleteModal(false)}>
        <CModalHeader>
          <CModalTitle>Confirm Deletion</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Are you sure you want to delete this event?
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowConfirmDeleteModal(false)}>
            Cancel
          </CButton>
          <CButton color="danger" style={{ color: '#fff' }} onClick={handleDeleteEvent}>
            Delete
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal untuk Menambah Acara */}
      <CModal visible={showAddModal} onClose={() => setShowAddModal(false)}>
        <CModalHeader>
          <CModalTitle>Add Event</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CFormInput
              type="text"
              id="title"
              label="Title"
              value={newEvent.title}
              placeholder="Enter event title"
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              invalid={!!errors.title}
              style={{ borderColor: errors.title ? '#dc3545' : '' }}
            />
            {errors.title && <CFormText color="danger" style={{ color: '#dc3545' }}>{errors.title}</CFormText>}

            <CFormInput
              type="text"
              id="location"
              label="Location"
              value={newEvent.location}
              placeholder="Enter location event"
              onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              invalid={!!errors.location}
              style={{ borderColor: errors.location ? '#dc3545' : '' }}
            />
            {errors.location && <CFormText color="danger" style={{ color: '#dc3545' }}>{errors.location}</CFormText>}

            <CFormInput
              id="floor"
              label="Floor"
              type="text"
              placeholder="Enter the floor where the event is taking place."
              value={newEvent.floor}
              onChange={(e) => setNewEvent({ ...newEvent, floor: e.target.value })}
              invalid={!!errors.floor}
              style={{ borderColor: errors.floor ? '#dc3545' : '' }}
            />
            {errors.floor && <CFormText color="danger" style={{ color: '#dc3545' }}>{errors.floor}</CFormText>}

            <CFormSelect
              id="startTime"
              label="Start Time"
              value={newEvent.startTime}
              onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
              invalid={!!errors.startTime}
            >
              <option disabled selected value="">Select Start Time</option>
              {timeOptions.map((time, index) => (
                <option key={index} value={time}>{time}</option>
              ))}
            </CFormSelect>
            {errors.startTime && <CFormText color="danger" style={{ color: '#dc3545' }}>{errors.startTime}</CFormText>}

            <CFormSelect
              id="endTime"
              label="End Time"
              value={newEvent.endTime}
              onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
              invalid={!!errors.endTime}
            >
              <option disabled selected value="">Select End Time</option>
              {timeOptions.map((time, index) => (
                <option key={index} value={time}>{time}</option>
              ))}
            </CFormSelect>
            {errors.endTime && <CFormText color="danger" style={{ color: '#dc3545' }}>{errors.endTime}</CFormText>}
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleAddEvent}>
            Save
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal untuk Mengedit Acara */}
      <CModal visible={showEditModal} onClose={() => setShowEditModal(false)}>
        <CModalHeader>
          <CModalTitle>Edit Event</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CFormInput
              type="text"
              id="title"
              label="Title"
              value={newEvent.title}
              placeholder="Enter event title"
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              invalid={!!errors.title}
              style={{ borderColor: errors.title ? '#dc3545' : '' }}
            />
            {errors.title && <CFormText color="danger" style={{ color: '#dc3545' }}>{errors.title}</CFormText>}

            <CFormInput
              type="text"
              id="location"
              label="Location"
              value={newEvent.location}
              placeholder="Enter location event"
              onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              invalid={!!errors.location}
              style={{ borderColor: errors.location ? '#dc3545' : '' }}
            />
            {errors.location && <CFormText color="danger" style={{ color: '#dc3545' }}>{errors.location}</CFormText>}

            <CFormInput
              id="floor"
              label="Floor"
              type="text"
              placeholder="Enter the data on which floor the event is taking place."
              value={newEvent.floor}
              onChange={(e) => setNewEvent({ ...newEvent, floor: e.target.value })}
              invalid={!!errors.floor}
              style={{ borderColor: errors.floor ? '#dc3545' : '' }}
            />
            {errors.floor && <CFormText color="danger" style={{ color: '#dc3545' }}>{errors.floor}</CFormText>}

            <CFormSelect
              id="startTime"
              label="Start Time"
              value={newEvent.startTime}
              onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
              invalid={!!errors.startTime} style={{ borderColor: errors.startTime ? '#dc3545' : '' }}
            >
              <option disabled selected value="">Select Start Time</option>
              {timeOptions.map((time, index) => (
                <option key={index} value={time}>{time}</option>
              ))}
            </CFormSelect>
            {errors.startTime && <CFormText color="danger" style={{ color: '#dc3545' }}>{errors.startTime}</CFormText>}

            <CFormSelect
              id="endTime"
              label="End Time"
              value={newEvent.endTime}
              onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
              invalid={!!errors.endTime} style={{ borderColor: errors.endTime ? '#dc3545' : '' }}
            >
              <option disabled selected value="">Select End Time</option>
              {timeOptions.map((time, index) => (
                <option key={index} value={time}>{time}</option>
              ))}
            </CFormSelect>
            {errors.endTime && <CFormText color="danger" style={{ color: '#dc3545' }}>{errors.endTime}</CFormText>}
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleUpdateEvent}>
            Update
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

export default ScheduleEventLine3