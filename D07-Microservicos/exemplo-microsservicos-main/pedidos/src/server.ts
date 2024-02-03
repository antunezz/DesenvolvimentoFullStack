import { server as HapiServer } from '@hapi/hapi';
import Consul from 'consul';
import { randomUUID } from 'crypto';
import { FecharPedido } from './command/fechar-pedido';
import { Servico } from './servico';
import { conectar, FILA} from './messageBroker';

const consul = new Consul();
const consulId = randomUUID();
let servico;

const init = async () => {
  
  servico = new Servico(consul);

  const canal = await conectar();
  await canal.assertQueue(FILA);
  console.log('Escutando a fila', FILA);
  await canal.consume(FILA, msg => {
    console.log(`Mensagem recebida: ${msg.content}\n`);
    canal.ack(msg);
    let pedido : FecharPedido = JSON.parse(msg.content.toString('utf-8'));
    servico.fechar(pedido).catch(e => console.log(e));
  });

  const server = HapiServer();

  server.route({
    method: 'GET',
    path: '/',
    handler: (_, reply) => reply.response('').code(200)
  });

  server.route({
    method: 'POST',
    path: '/api/',
    handler: req => {
      console.log('Payload', req.payload);
      return servico.fechar(req.payload as FecharPedido);
    }
  });

  server.route({
    method: 'GET',
    path: '/api/{id}',
    handler: req => servico.ler(req.params.id)
  });

  await server.start();
  console.log('Pedidos iniciado em %s', server.info.uri);

  const opts: Consul.Agent.Service.RegisterOptions = {
    name: 'pedidos',
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