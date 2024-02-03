import { badData, badRequest } from '@hapi/boom';
import { Consul } from 'consul';
import { EstoqueApi } from './api/estoque-api';
import { PedidosApi } from './api/pedidos-api';
import { PrecosApi } from './api/precos-api';
import { ProdutosApi } from './api/produtos-api';
import { Carrinho } from './query/carrinho';
import { ProdutoPrecoEstoque } from './query/produto-preco-estoque';
import { FecharPedido } from './command/fechar-pedido';

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
  private pedidosApi = new PedidosApi();

  private carrinhos = new Map<string, Carrinho>();

  private watches = [];

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

    this.watches.push(produtosWatcher);
    this.watches.push(precosWatcher);
    this.watches.push(estoqueWatcher);
  }

  async ajustar(idProduto: string, quantidade?: number): Promise<Carrinho> {
    console.log('Ajustando carrinho', idProduto, quantidade);
    const carrinho = await this.ler();
    let item = carrinho.itens.find(i => i.produto.id === idProduto);
    console.log('Já estava no carrinho?', item !== undefined);
    const produto = await this.produto(idProduto);
    console.log('Produto', produto);
    const mult = Math.pow(10, produto.decimaisQuantidade);
    if (quantidade === 0) {
      carrinho.itens = carrinho.itens.filter(i => i.produto.id !== produto.id);
    } else {
      if (!quantidade) {
        quantidade = produto.minimoNoCarrinho;
      }
      if (quantidade < produto.minimoNoCarrinho || quantidade > produto.maximoNoCarrinho) {
        return Promise.reject(badData(`Quantidade inválida: ${quantidade}`));
      }
      quantidade = Math.round(quantidade * mult) / mult;
      if (!item) {
        item = { produto, quantidade, valorTotal: 0 };
        carrinho.itens.push(item);
        carrinho.itens.sort((a, b) => a.produto.nome.localeCompare(b.produto.nome));
      } else {
        item.produto = produto;
        item.quantidade = quantidade;
      }
    }
    this.atualizarTotais(carrinho);
    console.log('Feito!', carrinho);
    return Promise.resolve(carrinho);
  }

  async ler(): Promise<Carrinho> {
    const usuario = this.usuario();
    console.log('Lendo carrinho de ', usuario);
    let carrinho = this.carrinhos.get(usuario);
    console.log(carrinho);
    if (!carrinho) {
      this.carrinhos.set(usuario, {
        usuario,
        itens: [],
        valorTotal: 0
      });
      carrinho = this.carrinhos.get(usuario);
    }
    return Promise.resolve(carrinho);
  }

  async limpar(): Promise<void> {
    this.carrinhos.delete(this.usuario());
    return Promise.resolve(null);
  }

  async fecharPedido(): Promise<Object> {
    let pedido : FecharPedido = { usuario: "usuarioLogado", itens: [] };
    (await this.ler()).itens.forEach((item) => {
      pedido.itens.push({
        produto: item.produto.id,
        quantidade: item.quantidade
      });
    });
    return this.pedidosApi.fecharPedido(pedido);
  };
  
  private async produto(id: string): Promise<ProdutoPrecoEstoque> {
    console.log('Chamando API produtos');
    const produto = await this.produtosApi.ler(id);
    console.log(produto);
    console.log('Chamando API estoque');
    const estoque = await this.estoqueApi.ler(id);
    console.log(estoque);
    console.log('Chamando API precos');
    const preco = await this.precosApi.ler(id);
    console.log(preco);
    return Promise.resolve({
      ...produto,
      ...estoque,
      ...preco
    });
  }

  async checkout(): Promise<void> {
    const carrinho = await this.ler();
    if (carrinho.itens.length === 0) {
      return Promise.reject(badRequest('Carrinho vazio!'));
    }

    // Atualiza todos os produtos
    for (const item of carrinho.itens) {
      item.produto = await this.produto(item.produto.id);
    }
    this.atualizarTotais(carrinho);
  }

  private usuario() {
    // Deveria trazer o usuário logado...
    return 'usuarioLogado';
  }

  private atualizarTotais(carrinho: Carrinho) {
    let total = 0;
    for (const item of carrinho.itens) {
      item.valorTotal = item.quantidade * (item.produto.precoPromocional || item.produto.precoNormal);
      total += item.valorTotal;
    }
    carrinho.valorTotal = total;
  }

  destruir() {
    this.watches.forEach(watcher => {
      console.log('Finalizando watcher', watcher._options.service);
      watcher.end();
    });
  }
  
}
