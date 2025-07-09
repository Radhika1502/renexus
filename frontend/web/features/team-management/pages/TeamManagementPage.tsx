import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { TeamList } from '../components/TeamList';
import { TeamDetails } from '../components/TeamDetails';
import { TeamForm } from '../components/TeamForm';
import { useCreateTeam } from '../hooks/useTeams';
import { Team } from '../types';

export const TeamManagementPage: React.FC = () => {
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const createTeam = useCreateTeam();
  const navigate = useNavigate();

  const handleCreateTeam = async (data: Partial<Team>) => {
    try {
      const newTeam = await createTeam.mutateAsync(data);
      setIsCreatingTeam(false);
      navigate(`/teams/${newTeam.id}`);
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Routes>
        <Route 
          path="/" 
          element={
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Management</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Create and manage teams, assign members, and track team performance.
                </p>
              </div>
              
              <TeamList 
                onCreateTeam={() => setIsCreatingTeam(true)} 
                onEditTeam={(team) => navigate(`/teams/${team.id}`)}
              />
              
              {isCreatingTeam && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                    <h2 className="text-xl font-semibold mb-4">Create New Team</h2>
                    <TeamForm
                      onSubmit={handleCreateTeam}
                      onCancel={() => setIsCreatingTeam(false)}
                      isSubmitting={createTeam.isLoading}
                    />
                  </div>
                </div>
              )}
            </>
          } 
        />
        <Route path="/:teamId/*" element={<TeamDetails />} />
      </Routes>
    </div>
  );
};
