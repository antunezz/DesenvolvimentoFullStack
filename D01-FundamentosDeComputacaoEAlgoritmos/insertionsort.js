let { rodarTeste, trocar } = require('./util');

function insertionSort(arr) {
    const n = arr.length;
  
    for (let i = 1; i < n; i++) {
      let atual = arr[i];
      let j = i - 1;
  
      // Desloca elementos do array arr[0..i-1] que sejam maiores do que
      // o elemento atual para uma posição a frente
      while (j >= 0 && arr[j] > atual) {
        arr[j + 1] = arr[j];
        j--;
      }
  
      arr[j + 1] = atual;
    }
  }

  console.log('\n--== Insertion Sort ==--\n');
  rodarTeste(insertionSort);
