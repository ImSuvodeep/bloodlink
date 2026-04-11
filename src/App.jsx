import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import NotificationToast from './components/NotificationToast';
import DonorNotificationModal from './components/DonorNotificationModal';
import LandingPage from './pages/LandingPage';
import PatientPortal from './pages/PatientPortal';
import NgoPortal from './pages/NgoPortal';
import MatchPage from './pages/MatchPage';
import VolunteerPortal from './pages/VolunteerPortal';
import './index.css';

function AppContent() {
  const { activeTab } = useApp();

  return (
    <>
      <Navbar />
      <NotificationToast />
      <DonorNotificationModal />
      {activeTab === 'home' && <LandingPage />}
      {activeTab === 'patient' && <PatientPortal />}
      {activeTab === 'ngo' && <NgoPortal />}
      {activeTab === 'volunteer' && <VolunteerPortal />}
      {activeTab === 'match' && <MatchPage />}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

