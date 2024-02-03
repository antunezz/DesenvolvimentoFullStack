import { FecharPedido } from '../command/fechar-pedido';
import { conectar, FILA } from '../messageBroker';

export class PedidosApi {

  async fecharPedido(pedido: FecharPedido): Promise<Object> {
    console.log('Fechando pedido', pedido);
    const canal = await conectar();
    await canal.assertQueue(FILA);
    canal.sendToQueue(FILA, Buffer.from(JSON.stringify(pedido)));
    console.log(`Mensagem enviada para a fila '${FILA}'\n`);
    return Promise.resolve({message: 'Enviado!'});
  }
}
