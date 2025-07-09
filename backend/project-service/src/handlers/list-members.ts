import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { listMembersQuerySchema } from '../schemas/member';
import { memberService } from '../services/member';

type ListMembersRequest = FastifyRequest<{
  Params: { projectId: string };
  Querystring: z.infer<typeof listMembersQuerySchema>;
}>;

export async function listMembersHandler(
  request: ListMembersRequest,
  reply: FastifyReply
) {
  const members = await memberService.listMembers(request.params.projectId);
  return reply.send(members);
} 