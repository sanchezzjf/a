import { logger } from './logger.js'

/*assinatura do arquivo de rotas*/
export default class Routes {
    construction() {}

    setSocketInstance(io){
        this.io = io
    }

    async defaultRoute(request, response){
        response.end('Salve salve familia')
    }

    async options(request, response){
        response.writeHead(204)
        response.end('Salve salve familia')
    }

    async post(request, response) {
        logger.info('postado')
        response.end('Salve salve familia')
    }

    async get(request, response){
        logger.info('getado')
        response.end('Salve salve familia')
    }

    handler(request, response){
        response.setHeader('Access-Control-Allow-Origin', '*')
        const chosen =  this[request.method.toLowerCase()] || this.defaultRoute
        
        return chosen.apply(this, [request, response])
    }
}
