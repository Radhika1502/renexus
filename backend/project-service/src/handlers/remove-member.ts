import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { memberParamsSchema } from '../schemas/member';
import { memberService } from '../services/member';

type RemoveMemberRequest = FastifyRequest<{
  Params: z.infer<typeof memberParamsSchema>;
}>;

export async function removeMemberHandler(
  request: RemoveMemberRequest,
  reply: FastifyReply
) {
  await memberService.removeMember(
    request.params.projectId,
    request.params.userId
  );
  return reply.status(204).send();
} 