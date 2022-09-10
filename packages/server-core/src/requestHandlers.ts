import { MessageQueue } from './messageQueue';
import { ServerConfig, VuuRequestHandler } from './serverTypes';

interface ConfiguredService {
  configure: (config: ServerConfig) => void;
  unsubscribeAll?: (sessionId: string, queue: MessageQueue) => void;
}

type ServiceHandlers = {
  [messageType: string]: VuuRequestHandler;
};

type ServiceAPI = ConfiguredService & ServiceHandlers;

const _services: { [serviceName: string]: ServiceAPI } = {};

// Map message types to the name of the service that should handle these messages
const _messageTypeToServiceNameMap: { [messageType: string]: string } = {};

export function configure(config: ServerConfig) {
  config.services.forEach(async ({ name: serviceName, module, API }) => {
    // TODO roll these up into async functions we can invoke in parallel
    const service: ServiceAPI = await import(module);
    _services[serviceName] = service;
    API.forEach((messageType) => (_messageTypeToServiceNameMap[messageType] = serviceName));
    console.log(`configure service ${serviceName} `);
    // do we have to wait ?
    await service.configure(config);
  });
}

export function findHandler(messageType: string) {
  const serviceName = _messageTypeToServiceNameMap[messageType];
  if (serviceName) {
    return _services[serviceName][messageType];
  }
}

export function killSubscriptions(sessionId: string, queue: MessageQueue) {
  Object.keys(_services).forEach((serviceName) => {
    const service = _services[serviceName] as ConfiguredService;
    if (service) {
      service.unsubscribeAll?.(sessionId, queue);
    }
  });
}
