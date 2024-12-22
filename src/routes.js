import React from 'react'

// Landing Page
const LandingPage = React.lazy(() => import('./views/landing/Landing-page.js'))

// Dashboard
const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))

// Schedule Event
const ScheduleEventLine1 = React.lazy(() => import('./views/schedule-event/line-1'))
const ScheduleEventLine2 = React.lazy(() => import('./views/schedule-event/line-2'))
const ScheduleEventLine3 = React.lazy(() => import('./views/schedule-event/line-3'))

// Upload Flyer
const AnnouncementFlyer = React.lazy(() => import('./views/announcement-flyer/flyer'))

// Profile
const Profile = React.lazy(() => import('./views/pengguna/profile'))

// Routes Web
const routes = [
  { path: '/', name: 'Landing Page', element: LandingPage },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/schedule-event/line-1', name: 'Schedule Event / Line 1', element: ScheduleEventLine1, exact: true },
  { path: '/schedule-event/line-2', name: 'Schedule Event / Line 2', element: ScheduleEventLine2, exact: true },
  { path: '/schedule-event/line-3', name: 'Schedule Event / Line 3', element: ScheduleEventLine3, exact: true },
  { path: '/announcement-flyer', name: 'Announcement Flyer', element: AnnouncementFlyer, exact: true },
  { path: '/pengguna/profile', name: 'Profile', element: Profile, exact: true },
]

export default routes