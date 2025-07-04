import React, { useState } from 'react';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@renexus/ui-components';
import { useProject } from '../../hooks/useProject';
import { useUsers } from '../../hooks/useUsers';
import { useUpdateProject } from '../../hooks/useUpdateProject';
import { Loader, UserPlus, Trash2 } from 'lucide-react';
import { User } from '../../../team-management/types';

interface ProjectPermissionsTabProps {
  projectId: string;
}

type Role = 'owner' | 'admin' | 'member' | 'viewer';

interface TeamMemberWithRole {
  user: User;
  role: Role;
}

export const ProjectPermissionsTab: React.FC<ProjectPermissionsTabProps> = ({ projectId }) => {
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: allUsers, isLoading: usersLoading } = useUsers();
  const { mutate: updateProject, isPending: isUpdating } = useUpdateProject();
  
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<Role>('member');
  
  // Mock data for team members with roles
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithRole[]>([
    // This would normally be populated from project.teamMembers with roles from permissions
  ]);
  
  React.useEffect(() => {
    if (project?.teamMembers) {
      // In a real implementation, we would get the roles from a permissions endpoint
      // For now, we'll mock it with all members having 'member' role except the owner
      const membersWithRoles = project.teamMembers.map(user => ({
        user,
        role: user.id === project.ownerId ? 'owner' as Role : 'member' as Role
      }));
      setTeamMembers(membersWithRoles);
    }
  }, [project]);
  
  if (projectLoading || usersLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }
  
  const handleAddMember = () => {
    if (!selectedUserId) return;
    
    const userToAdd = allUsers?.find(user => user.id === selectedUserId);
    if (!userToAdd) return;
    
    // In a real implementation, we would call an API to add the user with the selected role
    // For now, we'll just update our local state
    setTeamMembers(prev => [...prev, { user: userToAdd, role: selectedRole }]);
    
    // Close the dialog
    setIsAddMemberOpen(false);
    setSelectedUserId('');
    setSelectedRole('member');
  };
  
  const handleRemoveMember = (userId: string) => {
    // In a real implementation, we would call an API to remove the user
    // For now, we'll just update our local state
    setTeamMembers(prev => prev.filter(member => member.user.id !== userId));
  };
  
  const handleRoleChange = (userId: string, newRole: Role) => {
    // In a real implementation, we would call an API to update the user's role
    // For now, we'll just update our local state
    setTeamMembers(prev => 
      prev.map(member => 
        member.user.id === userId 
          ? { ...member, role: newRole } 
          : member
      )
    );
  };
  
  const availableUsers = allUsers?.filter(
    user => !teamMembers.some(member => member.user.id === user.id)
  ) || [];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Team Members & Permissions</h3>
        <Button onClick={() => setIsAddMemberOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teamMembers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 text-gray-500 dark:text-gray-400">
                No team members added yet
              </TableCell>
            </TableRow>
          ) : (
            teamMembers.map(({ user, role }) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {role === 'owner' ? (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-xs">
                      Owner
                    </span>
                  ) : (
                    <Select 
                      value={role} 
                      onValueChange={(value: Role) => handleRoleChange(user.id, value)}
                      disabled={role === 'owner'}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  {role !== 'owner' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveMember(user.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">User</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 ? (
                    <SelectItem value="" disabled>
                      No available users
                    </SelectItem>
                  ) : (
                    availableUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={selectedRole} onValueChange={(value: Role) => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={!selectedUserId}>
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="mt-6 space-y-4">
        <h4 className="font-medium">Role Permissions</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Permission</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Viewer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Edit project details</TableCell>
              <TableCell>✓</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Manage team members</TableCell>
              <TableCell>✓</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Create/edit tasks</TableCell>
              <TableCell>✓</TableCell>
              <TableCell>✓</TableCell>
              <TableCell>-</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>View tasks and comments</TableCell>
              <TableCell>✓</TableCell>
              <TableCell>✓</TableCell>
              <TableCell>✓</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Add comments</TableCell>
              <TableCell>✓</TableCell>
              <TableCell>✓</TableCell>
              <TableCell>✓</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
