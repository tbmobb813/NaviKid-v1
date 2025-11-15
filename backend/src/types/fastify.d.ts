import { JWTPayload } from './index';

declare module 'fastify' {
  // Merge into FastifyRequest to include typed `user` produced by our JWT middleware
  interface FastifyRequest {
    user?: JWTPayload;
  }
}
import { FastifyReply, FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}
