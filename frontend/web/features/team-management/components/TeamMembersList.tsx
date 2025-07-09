import React, { useState } from 'react';
import { TeamMember, TeamRole } from '../types';
import { useUpdateTeamMember, useRemoveTeamMember } from '../hooks/useTeamMembers';
import { Button } from '@renexus/ui-components';
import { Trash2Icon, UserIcon } from 'lucide-react';

interface TeamMembersListProps {
  teamId: string;
  members: TeamMember[];
}

export const TeamMembersList: React.FC<TeamMembersListProps> = ({ teamId, members }) => {
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const updateMember = useUpdateTeamMember(teamId);
  const removeMember = useRemoveTeamMember(teamId);

  const handleRoleChange = async (userId: string, role: TeamRole) => {
    try {
      await updateMember.mutateAsync({ userId, update: { role } });
      setEditingMemberId(null);
    } catch (error) {
      console.error('Failed to update member role:', error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (window.confirm('Are you sure you want to remove this member from the team?')) {
      try {
        await removeMember.mutateAsync(userId);
      } catch (error) {
        console.error('Failed to remove member:', error);
      }
    }
  };

  if (members.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">No members in this team yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Member
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Role
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Joined
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {members.map((member) => (
            <tr key={member.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {member.user.avatar ? (
                    <img 
                      src={member.user.avatar} 
                      alt={member.user.name} 
                      className="h-10 w-10 rounded-full mr-3"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3">
                      <UserIcon size={20} className="text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {member.user.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {member.user.email}
                    </div>
                    {member.user.title && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {member.user.title}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {editingMemberId === member.userId ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.userId, e.target.value as TeamRole)}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    disabled={updateMember.isLoading}
                  >
                    {Object.values(TeamRole).map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div 
                    className="text-sm cursor-pointer hover:text-blue-500"
                    onClick={() => setEditingMemberId(member.userId)}
                  >
                    <span className={`
                      px-2 py-1 text-xs font-medium rounded-full
                      ${member.role === TeamRole.OWNER ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : ''}
                      ${member.role === TeamRole.ADMIN ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
                      ${member.role === TeamRole.MEMBER ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                      ${member.role === TeamRole.GUEST ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : ''}
                    `}>
                      {member.role}
                    </span>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {new Date(member.joinedAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.userId)}
                  disabled={member.role === TeamRole.OWNER || removeMember.isLoading}
                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2Icon size={16} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
