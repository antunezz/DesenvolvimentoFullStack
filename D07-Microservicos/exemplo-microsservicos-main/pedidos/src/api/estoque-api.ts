const axios = require('axios');
import { Estoque } from '../query/estoque';

export class EstoqueApi {

  baseUrl: string;

  async ler(id: string): Promise<Estoque> {
    return (await axios.get(`/${id}`, {
      baseURL: this.baseUrl
    })).data;
  }
}