/* global require:false */

const services = {};
const serviceAPI = {};

export function configure(config){

    console.log(`requestHandler.configure ${JSON.stringify(config,null,2)}`)

    config.services.forEach(async ({name, module, API}) => {
        console.log(`about to import ${module}`)
        services[name] = await import(module);
        API.forEach(messageType => serviceAPI[messageType] = name);
        console.log(`configure service ${name} `)
        services[name].configure(config);
    });

}

export function findHandler(type){
    const serviceName = serviceAPI[type];
    if (serviceName){
        return services[serviceName][type];
    }
}

export function killSubscriptions(clientId, queue){
    Object.keys(services).forEach(name => {
        const killSubscription = services[name]['unsubscribeAll']
        if (killSubscription){
            killSubscription(clientId, queue);
        }
    })

}
