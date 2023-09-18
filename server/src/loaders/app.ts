import cors from 'cors';
import express, { Express, Router } from 'express'
import { SnapshotPollingControllers } from './controllers';
import { adminRoutes, publicRoutes } from '../api/routes';

export default (app: Express, controllers: SnapshotPollingControllers) => {
  app.use(cors());
  app.use(express.json());
  app.get('/status', (_req, res) => {
    res.status(200).end();
  });

  const router = Router()

  adminRoutes(router, controllers);
  publicRoutes(router, controllers);

  app.use('/api', router);

  return app;
}
