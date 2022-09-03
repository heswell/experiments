const services = {};
const serviceAPI = {};
function configure(config) {
  console.log(`requestHandler.configure ${JSON.stringify(config, null, 2)}`);
  config.services.forEach(async ({ name, module, API }) => {
    console.log(`about to import ${module}`);
    const service = await import(module);
    services[name] = service;
    API.forEach((messageType) => serviceAPI[messageType] = name);
    console.log(`configure service ${name} `);
    await service.configure(config);
  });
}
function findHandler(type) {
  const serviceName = serviceAPI[type];
  if (serviceName) {
    return services[serviceName][type];
  }
}
function killSubscriptions(clientId, queue) {
  Object.keys(services).forEach((name) => {
    const killSubscription = services[name]["unsubscribeAll"];
    if (killSubscription) {
      killSubscription(clientId, queue);
    }
  });
}
export {
  configure,
  findHandler,
  killSubscriptions
};
//# sourceMappingURL=requestHandlers.js.map
