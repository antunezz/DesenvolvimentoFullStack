let { rodarTeste, trocar } = require('./util');

function mergesort(arr) {
    if (arr.length <= 1) {
      return arr;
    }
  
    // Reparte o array em dois
    const meio = Math.floor(arr.length / 2);
    const metadeEsquerda = arr.slice(0, meio);
    const metadeDireita = arr.slice(meio);
  
    // Ordena cada parte recursivamente
    const esquerdaOrdenada = mergesort(metadeEsquerda);
    const direitaOrdenada = mergesort(metadeDireita);
  
    // Une as metades
    return merge(esquerdaOrdenada, direitaOrdenada);
  }
  
  function merge(esquerda, direita) {
    let result = [];
    let esquerdaIndice = 0;
    let direitaIndice = 0;
  
    // Compara os elementos da esquerda e da direita e os unifica
    while (esquerdaIndice < esquerda.length && direitaIndice < direita.length) {
      if (esquerda[esquerdaIndice] < direita[direitaIndice]) {
        result.push(esquerda[esquerdaIndice]);
        esquerdaIndice++;
      } else {
        result.push(direita[direitaIndice]);
        direitaIndice++;
      }
    }
  
    // Apenda os elementos que restaram
    return result.concat(esquerda.slice(esquerdaIndice), direita.slice(direitaIndice));
  }


  console.log('\n--== Merge Sort ==--\n');
  rodarTeste(mergesort);
