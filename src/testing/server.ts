import { Server } from 'http';

import Koa from 'koa';
import request from 'supertest';

/**
 * Create a new SuperTest agent from a Koa application.
 */
export const agentFromApp = <State, Context>(app: Koa<State, Context>) => {
  let server: Server;
  let agent: request.SuperTest<request.Test>;

  const getAgent = () => agent;

  const setup = async () => {
    await new Promise((resolve) => (server = app.listen(undefined, resolve)));
    agent = request.agent(server);
  };

  const teardown = () => new Promise((resolve) => server.close(resolve));

  return Object.assign(getAgent, { setup, teardown });
};
