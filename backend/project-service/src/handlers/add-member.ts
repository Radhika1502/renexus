import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { addMemberSchema } from '../schemas/member';
import { memberService } from '../services/member';

type AddMemberRequest = FastifyRequest<{
  Params: { projectId: string };
  Body: z.infer<typeof addMemberSchema>;
}>;

export async function addMemberHandler(
  request: AddMemberRequest,
  reply: FastifyReply
) {
  const member = await memberService.addMember({
    projectId: request.params.projectId,
    userId: request.body.userId,
    role: request.body.role,
  });
  return reply.status(201).send(member);
} 