// function quicksort3way(arr, lo, hi) {
//     if (lo < hi) {
//       // Initialize pivot elements
//       let lt = lo;   // lt represents the elements less than the pivot
//       let gt = hi;   // gt represents the elements greater than the pivot
//       let i = lo + 1; // i is used for iterating through the array

//       // Choose the pivot element
//       let pivot = arr[lo];

//       // Partition the array into three parts: elements less than, equal to, and greater than the pivot
//       while (i <= gt) {
//         if (arr[i] < pivot) {
//           swap(arr, lt++, i++);
//         } else if (arr[i] > pivot) {
//           swap(arr, i, gt--);
//         } else {
//           i++;
//         }
//       }

//       // Recursively sort the subarrays
//       quicksort3way(arr, lo, lt - 1);
//       quicksort3way(arr, gt + 1, hi);
//     }
//   }

//   // Helper function to swap elements in an array
//   function swap(arr, i, j) {
//     let temp = arr[i];
//     arr[i] = arr[j];
//     arr[j] = temp;
//   }

//   // Example usage
//   let arr = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];
//   quicksort3way(arr, 0, arr.length - 1);
//   console.log("Sorted array:", arr);

let { gerarArray, trocar } = require('./util');

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

const tamanho = process.argv[2] || 10000;
const valorMin = process.argv[3] || 0;
const valorMax = process.argv[4] || 1000;

const meuArray = gerarArray(tamanho, valorMin, valorMax);
console.log("Array inicial:", meuArray);

const tempoInicio = new Date().getTime();
quicksort3(meuArray, 0, meuArray.length - 1);
const tempoFim = new Date().getTime();

console.log("Array ordenado:", meuArray);
console.log('Tempo:', tempoFim - tempoInicio, 'ms');
