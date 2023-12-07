let { gerarArray, trocar } = require('./util');

function bubbleSort(arr) {
    const n = arr.length;

    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - 1 - i; j++) {
            // Compara elementos lado-a-lado
            if (arr[j] > arr[j + 1]) {
                // Troca de posição
                trocar(arr, j, j + 1);
            }
        }
    }
}

const tamanho = process.argv[2] || 10000;
const valorMin = process.argv[3] || 0;
const valorMax = process.argv[4] || 1000;

const meuArray = gerarArray(tamanho, valorMin, valorMax);
console.log("Array inicial:", meuArray);

const tempoInicio = new Date().getTime();
bubbleSort(meuArray, 0, meuArray.length - 1);
const tempoFim = new Date().getTime();

console.log("Array ordenado:", meuArray);
console.log('Tempo:', tempoFim - tempoInicio, 'ms');
