/* global require:false */
import { ServerConfig } from './serverTypes';

const services = {};
const serviceAPI = {};

interface ServiceAPI {
  configure: (config: ServerConfig) => void;
}

export function configure(config: ServerConfig) {
  console.log(`requestHandler.configure ${JSON.stringify(config, null, 2)}`);

  config.services.forEach(async ({ name, module, API }) => {
    console.log(`about to import service ${name}, module=${module}`);
    // TODO roll these up into async functions we can invoke in parallel
    const service: ServiceAPI = await import(module);
    services[name] = service;
    API.forEach((messageType) => (serviceAPI[messageType] = name));
    console.log(`configure service ${name} `);
    // do we have to wait ?
    await service.configure(config);
  });
}

export function findHandler(type) {
  const serviceName = serviceAPI[type];
  if (serviceName) {
    return services[serviceName][type];
  }
}

export function killSubscriptions(clientId, queue) {
  Object.keys(services).forEach((name) => {
    const killSubscription = services[name]['unsubscribeAll'];
    if (killSubscription) {
      killSubscription(clientId, queue);
    }
  });
}
