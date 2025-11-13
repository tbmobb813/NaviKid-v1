import { JWTPayload } from './index';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}
