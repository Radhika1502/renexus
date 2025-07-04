import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTeams, useDeleteTeam } from '../hooks/useTeams';
import { Team } from '../types';
import { Button } from '@renexus/ui-components';
import { PlusIcon, Trash2Icon, EditIcon, UsersIcon } from 'lucide-react';

interface TeamListProps {
  onCreateTeam?: () => void;
  onEditTeam?: (team: Team) => void;
}

export const TeamList: React.FC<TeamListProps> = ({ onCreateTeam, onEditTeam }) => {
  const { data: teams, isLoading, error } = useTeams();
  const deleteTeamMutation = useDeleteTeam();
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const handleDeleteTeam = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await deleteTeamMutation.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete team:', error);
      }
    }
  };

  const toggleTeamExpansion = (id: string) => {
    setExpandedTeamId(expandedTeamId === id ? null : id);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading teams...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading teams: {error.message}</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Teams</h2>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={onCreateTeam}
          className="flex items-center gap-2"
        >
          <PlusIcon size={16} />
          <span>New Team</span>
        </Button>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {teams && teams.length > 0 ? (
          teams.map((team) => (
            <div key={team.id} className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {team.avatar ? (
                    <img 
                      src={team.avatar} 
                      alt={team.name} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <UsersIcon size={20} className="text-blue-500 dark:text-blue-300" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      <Link to={`/teams/${team.id}`} className="hover:underline">
                        {team.name}
                      </Link>
                    </h3>
                    {team.department && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {team.department}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditTeam && onEditTeam(team)}
                    className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
                    aria-label="Edit team"
                  >
                    <EditIcon size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                    aria-label="Delete team"
                  >
                    <Trash2Icon size={18} />
                  </button>
                  <button
                    onClick={() => toggleTeamExpansion(team.id)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label={expandedTeamId === team.id ? "Collapse team details" : "Expand team details"}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform ${expandedTeamId === team.id ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
              
              {expandedTeamId === team.id && (
                <div className="mt-4 pl-12">
                  {team.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {team.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Link
                      to={`/teams/${team.id}`}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Details
                    </Link>
                    <Link
                      to={`/teams/${team.id}/members`}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Manage Members
                    </Link>
                    <Link
                      to={`/teams/${team.id}/projects`}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Projects
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No teams found. Create a team to get started.
          </div>
        )}
      </div>
    </div>
  );
};
