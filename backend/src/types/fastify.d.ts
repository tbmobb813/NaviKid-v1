import 'fastify';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { JWTPayload } from './index';

declare module 'fastify' {
  interface FastifyInstance {
    // authentication decorator added in server.ts
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }

  // Merge into FastifyRequest to include typed `user` produced by our JWT middleware
  interface FastifyRequest {
    user?: JWTPayload;
    // Validation middleware attaches parsed body here
    validatedBody?: unknown;
  }
}
