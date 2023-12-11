let { rodarTeste, trocar } = require('./util');

function quicksort3(arr, baixo, alto) {
  if (baixo < alto) {
    let menorQue = baixo;
    let maiorQue = alto;
    let i = baixo + 1;

    let pivo = arr[baixo];

    while (i <= maiorQue) {
      if (arr[i] < pivo) {
        trocar(arr, menorQue++, i++);
      } else if (arr[i] > pivo) {
        trocar(arr, i, maiorQue--);
      } else {
        i++;
      }
    }

    quicksort3(arr, baixo, menorQue - 1);
    quicksort3(arr, maiorQue + 1, alto);
  }
}

console.log('\n--== Quick Sort 3 ==--\n');
rodarTeste(quicksort3);
