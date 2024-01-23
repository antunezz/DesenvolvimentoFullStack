const soap = require('soap');
const url = 'http://localhost:3000/wstodo?wsdl';

// Função para criar um cliente SOAP e realizar chamadas
async function executarChamadas() {
  try {
    // Criar um cliente SOAP
    const client = await soap.createClientAsync(url);

    // Adicionar uma tarefa
    const novaTarefa = { titulo: 'Comprar pão', concluida: false };
    let respostaCriacao = await client.criarTarefaAsync({ tarefa: novaTarefa });
    let idTarefa = respostaCriacao[0].id;
    console.log('Tarefa criada:', idTarefa);

    // Obter todas as tarefas
    let respostaObterTodas = await client.obterTodasTarefasAsync({});
    console.log('Todas as tarefas:', JSON.stringify(respostaObterTodas[0]));

    // Adicionar outra tarefa
    const outraTarefa = { titulo: 'Comprar leite', concluida: false };
    respostaCriacao = await client.criarTarefaAsync({ tarefa: outraTarefa });
    console.log('Tarefa criada:', respostaCriacao[0].id);

    // Obter todas as tarefas
    respostaObterTodas = await client.obterTodasTarefasAsync({});
    console.log('Todas as tarefas:', JSON.stringify(respostaObterTodas[0]));

    // Atualizar a primeira tarefa
    const atualizarTarefa = { id: idTarefa, tarefa: { titulo: 'Comprar pão', concluida: true }};
    let respostaAtualizacao = await client.atualizarTarefaAsync(atualizarTarefa);
    console.log('Tarefa atualizada:', respostaAtualizacao[0]);

    // Excluir a primeira tarefa criada
    const respostaExcluir = await client.excluirTarefaAsync({ id: idTarefa });
    const tarefaExcluida = respostaExcluir[0].mensagem;
    console.log('Tarefa excluída:', tarefaExcluida);

    // Obter todas as tarefas novamente após a exclusão, só deve haver uma
    respostaObterTodas = await client.obterTodasTarefasAsync({});
    console.log('Todas as tarefas:', JSON.stringify(respostaObterTodas[0]));
  } catch (error) {
    console.error('Erro ao executar chamadas:', error);
  }
}

// Executar as chamadas
executarChamadas();
