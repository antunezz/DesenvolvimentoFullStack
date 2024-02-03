//import axios from 'axios';
const axios = require("axios");
import { Produto } from '../query/produto';

export class ProdutosApi {

  baseUrl: string;

  async ler(id: string): Promise<Produto> {
    console.log('Consultando serviço de produtos por ',  id, ' em ', this.baseUrl);
    const retorno = await axios.get(`/${id}`, {
      baseURL: this.baseUrl
    });
    console.log('Retorno: ', retorno);
    return retorno.data;
  }
}