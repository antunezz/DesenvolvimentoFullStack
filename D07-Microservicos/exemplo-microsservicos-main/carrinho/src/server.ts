import { server as HapiServer } from '@hapi/hapi';
import Consul from 'consul';
import { randomUUID } from 'crypto';
import { Servico } from './servico';


const consul = new Consul();
const consulId = randomUUID();
let servico;

const init = async () => {

  servico = new Servico(consul);

  const server = HapiServer();

  server.route({
    method: 'GET',
    path: '/',
    handler: (_, reply) => reply.response('').code(200)
  });

  server.route({
    method: 'GET',
    path: '/api/',
    handler: () => servico.ler()
  });

  server.route({
    method: 'PUT',
    path: '/api/{id}',
    handler: (req, res) => servico.ajustar(req.params.id, req.query.quantidade !== undefined ? Number(req.query.quantidade) : undefined)
  });

  server.route({
    method: 'DELETE',
    path: '/api/',
    handler: () => servico.limpar()
  });

  server.route({
    method: 'POST',
    path: '/api/checkout',
    handler: () => servico.checkout()
  });

  server.route({
    method: 'POST',
    path: '/api/fecharpedido',
    handler: (req) => servico.fecharPedido()
  });


  await server.start();
  console.log('Carrinho de compras iniciado em %s', server.info.uri);

  const opts: Consul.Agent.Service.RegisterOptions = {
    name: 'carrinho',
    address: server.info.host,
    port: server.info.port as number,
    id: consulId,
    check: {
      http: server.info.uri,
      interval: '5s'
    }
  };
  await consul.catalog.service.nodes({service: opts.name}).then((result) => {
    if (Array.isArray(result)) {
      result.forEach(async node => {
        await consul.agent.service.deregister({ id: node.ServiceID });
        console.log('Desregistrando', node.ServiceName, node.ServiceID, node.ServicePort);
      });
    }
  });
  await consul.agent.service.register(opts);
  console.log(`Registrado no consul com id: ${consulId}`);
};

process.on('SIGINT', async () => {
  servico.destruir();
  await consul.agent.service.deregister({ id: consulId });
  console.log('Removido do consul');
  process.exit();
});

init();