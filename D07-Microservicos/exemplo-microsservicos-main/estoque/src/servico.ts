import { notFound } from '@hapi/boom';
import { Consul } from 'consul';
import { ProdutosApi } from './api/produtos-api';
import { ProdutoEstoque } from './query/produto-estoque';

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
  private estoque = new Map<string, number>();
  private watcher;

  constructor(consul: Consul) {
    this.watcher = consul.watch({
      method: consul.health.service,
      options: ({
        service: 'produtos',
        passing: true
      } as any)
    }).on('change', async (dados) => this.produtosApi.baseUrl = await buscarEndereco(consul, 'produtos', dados)
    ).on('error', e => console.error(e));
  }

  async ajustar(id: string, ajuste: number): Promise<number> {
    const produto = await this.ler(id);
    const mult = Math.pow(10, produto.decimaisQuantidade) * 1.0;
    let estoque = produto.estoque + ajuste;
    estoque = Math.round(estoque * mult) / mult;
    this.estoque.set(id, estoque);
    return Promise.resolve(estoque);
  }

  async ler(id: string): Promise<ProdutoEstoque> {
    console.log('Chegou no serviço ler', id);
    const estoque = this.estoque.get(id);
    if (!estoque) {
      return Promise.reject(notFound(`Nenhum estoque definido para o produto ${id}`));
    }
    console.log('O estoque para', id, 'é', estoque);
    const produto = await this.produtosApi.ler(id);
    console.log('O produto para', id, 'é', produto);
    const produtoEstoque: ProdutoEstoque = {
      ...produto,
      estoque
    };
    return Promise.resolve(produtoEstoque);
  }

  async popular() {
    // 1: Tomate
    this.estoque.set('1', 10.5);
    // 2: Laranja
    this.estoque.set('2', 0);
    // 3: Alface
    this.estoque.set('3', 35);
    // 4: Brócolis
    this.estoque.set('4', 27);
    // 5: Leite
    this.estoque.set('5', 120);
    // 6: Iogurte natural
    this.estoque.set('6', 41);
    // 7: Linguiça colonial
    this.estoque.set('7', 19.7);
  }

  destruir() {
    console.log('Finalizando watcher de produtos');
    this.watcher.end();
  }

}
