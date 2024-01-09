let { rodarTeste, trocar } = require('./util');

function quicksort(arr) {
  if (arr.length <= 1) {
      return arr;
  }

  // Escolhe um pivô (usando o elemento do meio neste exemplo)
  const pivo = arr[Math.floor(arr.length / 2)];

  // Particiona o array em elementos menores, iguais e maiores que o pivô
  const menores = arr.filter(elemento => elemento < pivo);
  const iguais = arr.filter(elemento => elemento === pivo);
  const maiores = arr.filter(elemento => elemento > pivo);

  // Recursivamente ordena os subarrays e combina os resultados
  return quicksort(menores).concat(iguais, quicksort(maiores));
}

console.log('\n--== Quick Sort ==--\n');
rodarTeste(quicksort);
