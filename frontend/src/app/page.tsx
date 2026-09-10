'use client';

import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { ApiClient } from '../lib/api';
import { Navbar } from '../components/Navbar';
import { POSWorkspace } from '../components/POSWorkspace';
import { InventoryManagement } from '../components/InventoryManagement';
import { UdhaarKhata } from '../components/UdhaarKhata';
import { ExecutiveDashboard } from '../components/ExecutiveDashboard';
import { DayClosingModal } from '../components/DayClosingModal';
import { AiAssistantDrawer } from '../components/AiAssistantDrawer';
import { LoginScreen } from '../components/LoginScreen';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [isAiOpen, setIsAiOpen] = useState<boolean>(false);
  const [isClosingOpen, setIsClosingOpen] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  useEffect(() => {
    // Check saved session
    const user = ApiClient.getSavedUser();
    if (user) {
      setCurrentUser(user);
    }
    setIsLoadingAuth(false);
  }, []);

  const handleLogout = () => {
    ApiClient.clearToken();
    setCurrentUser(null);
    setActiveTab('pos');
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading DukaanOS...
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Top Navigation Bar */}
      <Navbar
        user={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onOpenAi={() => setIsAiOpen(true)}
        onOpenClosing={() => setIsClosingOpen(true)}
      />

      {/* Main Tab Views */}
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        {activeTab === 'pos' && <POSWorkspace />}
        {activeTab === 'inventory' && <InventoryManagement currentUser={currentUser} />}
        {activeTab === 'udhaar' && <UdhaarKhata />}
        {activeTab === 'dashboard' && currentUser.role === 'OWNER' && <ExecutiveDashboard />}
      </main>

      {/* Day Closing Modal */}
      <DayClosingModal
        isOpen={isClosingOpen}
        onClose={() => setIsClosingOpen(false)}
      />

      {/* AI Assistant Drawer ("Dukaan Dost") */}
      <AiAssistantDrawer
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
      />
    </div>
  );
}
