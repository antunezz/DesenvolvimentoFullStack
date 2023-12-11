let { rodarTeste, trocar } = require('./util');

function bubblesort(arr) {
    const n = arr.length;

    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - 1 - i; j++) {
            // Compara elementos lado-a-lado
            if (arr[j] > arr[j + 1]) {
                // Os troca de posição
                trocar(arr, j, j + 1);
            }
        }
    }
}

console.log('\n--== Bubble Sort ==--\n');
rodarTeste(bubblesort);
