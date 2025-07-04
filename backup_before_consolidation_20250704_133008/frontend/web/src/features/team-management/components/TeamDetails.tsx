import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTeam, useUpdateTeam, useDeleteTeam } from '../hooks/useTeams';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { Team, TeamMember } from '../types';
import { Button, Card, Tabs, TabsContent, TabsList, TabsTrigger } from '@renexus/ui-components';
import { EditIcon, Trash2Icon, UserPlusIcon, UsersIcon } from 'lucide-react';
import { TeamForm } from './TeamForm';
import { TeamMembersList } from './TeamMembersList';
import { TeamMemberForm } from './TeamMemberForm';

export const TeamDetails: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const { data: team, isLoading: isLoadingTeam, error: teamError } = useTeam(teamId || '');
  const { data: members, isLoading: isLoadingMembers } = useTeamMembers(teamId || '');
  const updateTeam = useUpdateTeam(teamId || '');
  const deleteTeam = useDeleteTeam();

  if (isLoadingTeam) {
    return <div className="flex justify-center p-8">Loading team details...</div>;
  }

  if (teamError || !team) {
    return (
      <div className="text-red-500 p-4">
        Error loading team: {teamError?.message || 'Team not found'}
      </div>
    );
  }

  const handleUpdateTeam = async (data: Partial<Team>) => {
    try {
      await updateTeam.mutateAsync(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update team:', error);
    }
  };

  const handleDeleteTeam = async () => {
    if (window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      try {
        await deleteTeam.mutateAsync(teamId || '');
        navigate('/teams');
      } catch (error) {
        console.error('Failed to delete team:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {team.avatar ? (
            <img 
              src={team.avatar} 
              alt={team.name} 
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <UsersIcon size={24} className="text-blue-500 dark:text-blue-300" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{team.name}</h1>
            {team.department && (
              <p className="text-gray-500 dark:text-gray-400">{team.department}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1"
          >
            <EditIcon size={16} />
            <span>Edit</span>
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteTeam}
            className="flex items-center gap-1"
          >
            <Trash2Icon size={16} />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Edit Form Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Edit Team</h2>
            <TeamForm
              team={team}
              onSubmit={handleUpdateTeam}
              onCancel={() => setIsEditing(false)}
              isSubmitting={updateTeam.isLoading}
            />
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Add Team Member</h2>
            <TeamMemberForm
              teamId={teamId || ''}
              onCancel={() => setIsAddingMember(false)}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Team Information</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {team.description || 'No description provided.'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</h3>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {new Date(team.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</h3>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {new Date(team.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Members</h3>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {team.members?.length || 0} members
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="pt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Team Members</h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddingMember(true)}
              className="flex items-center gap-1"
            >
              <UserPlusIcon size={16} />
              <span>Add Member</span>
            </Button>
          </div>
          
          {isLoadingMembers ? (
            <div className="text-center p-4">Loading members...</div>
          ) : (
            <TeamMembersList teamId={teamId || ''} members={members || []} />
          )}
        </TabsContent>

        <TabsContent value="projects" className="pt-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Team Projects</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Projects associated with this team will be displayed here.
            </p>
            {/* Project list component would go here */}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
