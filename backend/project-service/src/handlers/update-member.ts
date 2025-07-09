import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { memberParamsSchema, updateMemberSchema } from '../schemas/member';
import { memberService } from '../services/member';

type UpdateMemberRequest = FastifyRequest<{
  Params: z.infer<typeof memberParamsSchema>;
  Body: z.infer<typeof updateMemberSchema>;
}>;

export async function updateMemberHandler(
  request: UpdateMemberRequest,
  reply: FastifyReply
) {
  const member = await memberService.updateMember(
    request.params.projectId,
    request.params.userId,
    request.body
  );
  return reply.send(member);
} 