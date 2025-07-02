import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api/apiClient';
import { DocumentVersion } from '../types';

export const useDocumentVersions = (documentId: string) => {
  const queryClient = useQueryClient();

  // Fetch document versions
  const { data, isLoading, error } = useQuery<DocumentVersion[]>({
    queryKey: ['document-versions', documentId],
    queryFn: async () => {
      const response = await apiClient.get<{ versions: DocumentVersion[] }>(
        `/api/documents/${documentId}/versions`
      );
      return response.data.versions;
    },
    enabled: !!documentId,
  });

  // Create a new version
  const { mutateAsync: createVersion } = useMutation({
    mutationFn: async ({ content, comment }: { content: string; comment?: string }) => {
      const response = await apiClient.post<{ version: DocumentVersion }>(
        `/api/documents/${documentId}/versions`,
        { content, comment }
      );
      return response.data.version;
    },
    onSuccess: (newVersion) => {
      queryClient.setQueryData<DocumentVersion[]>(
        ['document-versions', documentId],
        (oldVersions) => {
          if (!oldVersions) return [newVersion];
          return [newVersion, ...oldVersions];
        }
      );
    },
  });

  // Restore a version
  const { mutateAsync: restoreVersion } = useMutation({
    mutationFn: async (versionId: string) => {
      const response = await apiClient.post<{ version: DocumentVersion }>(
        `/api/documents/${documentId}/versions/${versionId}/restore`
      );
      return response.data.version;
    },
    onSuccess: (restoredVersion) => {
      queryClient.setQueryData<DocumentVersion[]>(
        ['document-versions', documentId],
        (oldVersions) => {
          if (!oldVersions) return [restoredVersion];
          return [restoredVersion, ...oldVersions];
        }
      );
    },
  });

  // Delete a version
  const { mutateAsync: deleteVersion } = useMutation({
    mutationFn: async (versionId: string) => {
      await apiClient.delete(`/api/documents/${documentId}/versions/${versionId}`);
      return versionId;
    },
    onSuccess: (deletedVersionId) => {
      queryClient.setQueryData<DocumentVersion[]>(
        ['document-versions', documentId],
        (oldVersions) => {
          if (!oldVersions) return [];
          return oldVersions.filter(version => version.id !== deletedVersionId);
        }
      );
    },
  });

  // Compare versions
  const { mutateAsync: compareVersions } = useMutation({
    mutationFn: async ({ versionId1, versionId2 }: { versionId1: string; versionId2: string }) => {
      const response = await apiClient.get<{ diff: string }>(
        `/api/documents/${documentId}/versions/compare?v1=${versionId1}&v2=${versionId2}`
      );
      return response.data.diff;
    },
  });

  return {
    data,
    isLoading,
    error,
    createVersion,
    restoreVersion,
    deleteVersion,
    compareVersions,
  };
};
