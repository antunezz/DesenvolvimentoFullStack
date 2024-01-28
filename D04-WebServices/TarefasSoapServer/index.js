const express = require('express');
const bodyParser = require('body-parser');
const soap = require('soap');
const mongoose = require('mongoose');

const app = express();
const PORTA = 3000;
const MONGODB_URI = 'mongodb://localhost/todo-soap';

// Modelo de tarefa
const Tarefa = mongoose.model('Tarefa', {
  titulo: String,
  concluida: { type: Boolean, default: false },
});

// Conectar ao MongoDB
mongoose.connect(MONGODB_URI);
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Erro na conexão ao MongoDB:'));
db.once('open', async () => {
  console.log('Conectado ao MongoDB');
  await Tarefa.deleteMany({});
});

// Definição do serviço SOAP
const servico = {
  ServicoTodo: {
    PortaTodo: {
      obterTodasTarefas: async function (args, callback) {
        console.log('obterTodasTarefas');
        try {
          const tarefas = await Tarefa.find();
          console.log('Tarefas encontradas', tarefas.length);
          let tarefasTratadas = [];
          tarefas.forEach(tarefa => {
            tarefasTratadas.push({id: tarefa.id, titulo: tarefa.titulo, concluida: tarefa.concluida});
          });
          callback(null, { tarefas: tarefasTratadas });
        } catch (error) {
          callback({ error: 'Erro ao obter todas as tarefas' });
        }
      },
      obterTarefaPorId: async function (args, callback) {
        try {
          const idTarefa = args.id;
          const tarefa = await Tarefa.findById(idTarefa);
          callback(null, { tarefa: tarefa });
        } catch (error) {
          callback({ error: 'Erro ao obter a tarefa por ID' });
        }
      },
      criarTarefa: async function (args, callback) {
        console.log('Criando tarefa: ', JSON.stringify(args));
        try {
          const novaTarefa = new Tarefa(args.tarefa);
          const tarefaSalva = await novaTarefa.save();
          console.log('Tarefa salva', tarefaSalva);
          callback(null, { id: tarefaSalva.id });
        } catch (error) {
          callback({ error: 'Erro ao criar a tarefa' });
        }
      },
      atualizarTarefa: async function (args, callback) {
        try {
          const idTarefa = args.id;
          const tarefaAtualizada = args.tarefa;
          const tarefa = await Tarefa.findByIdAndUpdate(idTarefa, tarefaAtualizada, { new: true });
          
          if (tarefa) {
            callback(null, { tarefa: {id: tarefa.id, titulo: tarefa.titulo, concluida: tarefa.concluida} });
          } else {
            callback({ error: 'Tarefa não encontrada' });
          }
        } catch (error) {
          callback({ error: 'Erro ao atualizar a tarefa' });
        }
      },
      excluirTarefa: async function (args, callback) {
        try {
          const idTarefa = args.id;
          const tarefaExcluida = await Tarefa.findByIdAndDelete(idTarefa);
          
          if (tarefaExcluida) {
            callback(null, { mensagem: 'Tarefa excluída com sucesso', id: idTarefa });
          } else {
            callback({ error: 'Tarefa não encontrada' });
          }
        } catch (error) {
          callback({ error: 'Erro ao excluir a tarefa' });
        }
      },
    },
  },
};

var xml = require('fs').readFileSync('todo.wsdl', 'utf8');

app.use(bodyParser.raw({ type: function () { return true; }, limit: '5mb' }));

app.listen(PORTA, () => {
  console.log(`O servidor está rodando em http://localhost:${PORTA}`);
  soap.listen(app, '/wstodo', servico, xml, () => {
    console.log('Serviço de tarefas inicializado');
  });
});
