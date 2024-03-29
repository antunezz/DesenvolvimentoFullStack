import { badData, notFound } from '@hapi/boom';
import { DefinirPreco } from './command/definir-preco';
import { ProdutoPreco } from './query/produto-preco';
import { ProdutosApi } from './api/produtos-api';
import { Preco } from './query/preco';
import { Consul } from 'consul';

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
  private precos = new Map<string, Preco>();
  private watcher;

  constructor(consul: Consul) {
    let that = this;
    this.watcher = consul.watch({
      method: consul.health.service,
      options: ({
        service: 'produtos',
        passing: true
      } as any)
    }).on('change', async (dados) => this.produtosApi.baseUrl = await buscarEndereco(consul, 'produtos', dados)
    ).on('error', e => console.error(e));
  }

  async definir(id: string, params: DefinirPreco): Promise<void> {
    await this.validar(params);
    const preco: Preco = {
      precoNormal: params.precoNormal,
      precoPromocional: params.precoPromocional
    };
    this.precos.set(id, preco);
    return Promise.resolve(null);
  }

  async ler(id: string): Promise<ProdutoPreco> {
    const preco = this.precos.get(id);
    if (!preco) {
      return Promise.reject(notFound(`Nenhum preço definido para o produto ${id}`));
    }
    const produto = await this.produtosApi.ler(id);
    const produtoPreco: ProdutoPreco = {
      ...produto,
      ...preco
    };
    return Promise.resolve(produtoPreco);
  }

  private async validar(params: DefinirPreco): Promise<void> {
    if (!params || params.precoNormal < 0.01 || params.precoNormal > 999999999
      || params.precoPromocional > params.precoNormal) {
      return Promise.reject(badData(`Erro de validação: ${JSON.stringify(params)}`));
    }
    return Promise.resolve();
  }

  async popular() {
    // 1: Tomate
    this.precos.set('1', { precoNormal: 7.50 });
    // 2: Laranja
    this.precos.set('2', { precoNormal: 5.65 });
    // 3: Alface
    this.precos.set('3', { precoNormal: 2.10 });
    // 4: Brócolis
    this.precos.set('4', { precoNormal: 8.70, precoPromocional: 7.70 });
    // 5: Leite
    this.precos.set('5', { precoNormal: 5.50 });
    // 6: Iogurte natural
    this.precos.set('6', { precoNormal: 9.99 });
    // 7: Linguiça colonial
    this.precos.set('7', { precoNormal: 19.10, precoPromocional: 16.99 });
  }

  destruir() {
    console.log('Finalizando watcher de produtos');
    this.watcher.end();
  }

}
