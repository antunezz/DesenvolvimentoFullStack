const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const PORTA = 3000;

// Conectar ao Mongo
mongoose.connect('mongodb://localhost/todo-api');

// Modelo de tarefa
const Tarefa = mongoose.model('Tarefa', {
  titulo: String,
  concluida: { type: Boolean, default: false },
});

app.use(bodyParser.json());

// Rotas

// Obter todas as tarefas
app.get('/tarefas', async (req, res) => {
  try {
    const tarefas = await Tarefa.find();
    res.json(tarefas);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter uma tarefa específica por ID
app.get('/tarefas/:id', async (req, res) => {
  try {
    const idTarefa = req.params.id;
    const tarefa = await Tarefa.findById(idTarefa);
    
    if (tarefa) {
      res.json(tarefa);
    } else {
      res.status(404).json({ error: 'Tarefa não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar uma nova tarefa
app.post('/tarefas', async (req, res) => {
  try {
    const { titulo, concluida } = req.body;
    const novaTarefa = new Tarefa({ titulo, concluida: !!concluida });
    const tarefaSalva = await novaTarefa.save();
    res.status(201).json(tarefaSalva);
  } catch (error) {
    res.status(400).json({ error: 'Requisição inválida' });
  }
});

// Atualizar uma tarefa existente
app.put('/tarefas/:id', async (req, res) => {
  try {
    const idTarefa = req.params.id;
    const { titulo, concluida } = req.body;
    const tarefaAtualizada = await Tarefa.findByIdAndUpdate(
      idTarefa,
      { titulo, concluida },
      { new: true }
    );
    
    if (tarefaAtualizada) {
      res.json(tarefaAtualizada);
    } else {
      res.status(404).json({ error: 'Tarefa não encontrada' });
    }
  } catch (error) {
    res.status(400).json({ error: 'Requisição inválida' });
  }
});

// Excluir uma tarefa
app.delete('/tarefas/:id', async (req, res) => {
  try {
    const idTarefa = req.params.id;
    const tarefaExcluida = await Tarefa.findByIdAndDelete(idTarefa);
    
    if (tarefaExcluida) {
      res.json({ message: 'Tarefa excluída com sucesso' });
    } else {
      res.status(404).json({ error: 'Tarefa não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Iniciar o servidor
app.listen(PORTA, () => {
  console.log(`O servidor está rodando em http://localhost:${PORTA}`);
});
