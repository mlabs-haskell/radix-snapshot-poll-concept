import express from "express"
import { getConfig } from "./config"
import Services from "./loaders/services";
import Controllers from "./loaders/controllers";
import Logger from "./loaders/logger";
import setupExpress from "./loaders/app"


const config = getConfig();
const services = Services(config);
const controllers = Controllers(services)
const app = express();

setupExpress(app, controllers)

app.listen(config.port, () => {
  Logger.info(`Running on port ${config.port}`)
  setInterval(() => {
    services.snapshoter.getLatestState().then(console.log)
  }, 1500)
})
