import h2o2 from '@hapi/h2o2';
import { server as HapiServer } from '@hapi/hapi';
import Consul from 'consul';
import dotenv from 'dotenv';
dotenv.config();

const consul = new Consul();

// Configura os serviços e escuta por mudanças no Consul
const servicos = ['carrinho', 'estoque', 'pedidos', 'precos', 'produtos'];
const urls = new Map<string, string>();
let watchers = [];

const buscarEndereco = async (consul, nomeServico, dados) => {
  let servicoUrl;
  console.log('Observando', nomeServico + ':', dados.length ? 'recebeu dados' : 'sem dados');
  if (dados.length) {
    servicoUrl = dados.map(n => `http://${n.Service.Address}:${n.Service.Port}/api`)[0];
  } else {
    const resultado = await consul.catalog.service.nodes({service: nomeServico});
    console.log('Consultando catalogo por', nomeServico + ':', resultado.length ? 'recebeu dados' : 'sem dados');
    if (Array.isArray(resultado) && resultado.length > 0) {
      servicoUrl = `http://${resultado[0].ServiceAddress}:${resultado[0].ServicePort}/api`;
    }
  }
  console.log('Endereço de', nomeServico, servicoUrl);
  return servicoUrl;
}

for (const servico of servicos) {
  let watcher = consul.watch({
    method: consul.health.service,
    options: ({
      service: servico,
      passing: true
    } as any)
  }).on('change', async (data) => {
    urls.set(servico, await buscarEndereco(consul, servico, data));
  }).on('error', e => console.error(e));
  watchers.push(watcher);
}

const init = async () => {
  const server = HapiServer({
    port: process.env.PORT
  });
  await server.register(h2o2);

  server.route({
    method: 'GET',
    path: '/',
    handler: (_, reply) => reply.response('').code(200)
  });

  for (const servico of servicos) {
    const prefix = `/api/${servico}`;
    server.route({
      method: '*',
      path: `${prefix}/{path*}`,
      handler: {
        proxy: {
          mapUri: async req => {
            const uri = `${urls.get(servico)}/${req.path.substring(prefix.length + 1)}${req.url.search}`;
            return Promise.resolve({ uri });
          },
          passThrough: true,
          ttl: 'upstream'
        }
      }
    });
  }

  await server.start();
  console.log('Gateway da API iniciado em %s', server.info.uri);
};

process.on('SIGINT', async () => {
  watchers.forEach(watcher => {
    console.log('Finalizando watcher', watcher._options.service);
    watcher.end();
  });
  console.log('Finalizados watchers');
  process.exit();
});

init();
