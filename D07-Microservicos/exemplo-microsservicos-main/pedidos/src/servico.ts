import { badRequest, notFound } from '@hapi/boom';
import { Consul } from 'consul';
import { randomUUID } from 'crypto';
import { EstoqueApi } from './api/estoque-api';
import { PrecosApi } from './api/precos-api';
import { ProdutosApi } from './api/produtos-api';
import { FecharPedido } from './command/fechar-pedido';
import { Item } from './query/item';
import { Pedido } from './query/pedido';

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

export class Servico {
  private produtosApi = new ProdutosApi();
  private estoqueApi = new EstoqueApi();
  private precosApi = new PrecosApi();

  private pedidos = new Map<string, Pedido>();
  private watchers = [];

  constructor(consul: Consul) {
    const produtosWatcher = consul.watch({
      method: consul.health.service,
      options: ({
        service: 'produtos',
        passing: true
      } as any)
    }).on('change', async (dados) => this.produtosApi.baseUrl = await buscarEndereco(consul, 'produtos', dados)
    ).on('error', e => console.error(e));

    const precosWatcher = consul.watch({
      method: consul.health.service,
      options: ({
        service: 'precos',
        passing: true
      } as any)
    }).on('change', async (dados) => this.precosApi.baseUrl = await buscarEndereco(consul, 'precos', dados)
    ).on('error', e => console.error(e));

    const estoqueWatcher = consul.watch({
      method: consul.health.service,
      options: ({
        service: 'estoque',
        passing: true
      } as any)
    }).on('change', async (dados) => this.estoqueApi.baseUrl = await buscarEndereco(consul, 'estoque', dados)
    ).on('error', e => console.error(e));

    this.watchers.push(produtosWatcher);
    this.watchers.push(precosWatcher);
    this.watchers.push(estoqueWatcher);
  }

  async fechar(params: FecharPedido): Promise<Pedido> {
    if (!params.usuario || params.itens.length === 0) {
      return Promise.reject(badRequest(`Nenhum item! ${JSON.stringify(params)}`));
    }

    const itens: Item[] = [];
    let total = 0;
    for (const i of params.itens) {
      const produto = await this.produtosApi.ler(i.produto);
      const quantidade = i.quantidade;
      if (quantidade < produto.minimoNoCarrinho || quantidade > produto.maximoNoCarrinho) {
        return Promise.reject(badRequest(`Quantidade inválida de ${quantidade} para ${produto.nome}`));
      }
      const estoque = await this.estoqueApi.ler(produto.id);
      if (estoque.estoque < quantidade) {
        return Promise.reject(badRequest(`Sem estoque de ${quantidade} para ${produto.nome}`));
      }
      const preco = await this.precosApi.ler(produto.id);
      const precoUnitario = preco.precoPromocional || preco.precoNormal;
      const precoTotal = quantidade * precoUnitario;
      itens.push({ produto, precoUnitario, quantidade, precoTotal });
      total += precoTotal;
    }

    const pedido: Pedido = {
      id: randomUUID(),
      usuario: params.usuario,
      data: new Date(),
      itens,
      precoTotal: total
    };

    this.pedidos.set(pedido.id, pedido);
    console.log('Criado pedido', pedido);

    return Promise.resolve(pedido);
  }

  async ler(id: string): Promise<Pedido> {
    const pedido = this.pedidos.get(id);
    if (!pedido) {
      return Promise.reject(notFound(`Pedido não encontrado: ${id}`));
    }
    return Promise.resolve(pedido);
  }

  destruir() {
    this.watchers.forEach(watcher => {
      console.log('Finalizando watcher', watcher._options.service);
      watcher.end()
    });
  }
}