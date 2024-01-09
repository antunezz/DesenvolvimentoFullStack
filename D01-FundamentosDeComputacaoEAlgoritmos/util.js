const util = {
    /**
     * Gera um array com um tamanho determinado preenchido com 
     * valores aleatórios entre min e max
     * @param {*} tamanho 
     * @param {*} min 
     * @param {*} max 
     * @returns 
     */
    gerarArray: function (tamanho, min, max) {
        const arr = [];
        let i = 0;
        while (i < tamanho) {
            arr.push(Math.trunc(min + Math.random() * (max - min)));
            i++;
        }
        return arr;
    },
    /**
     * Troca elementos de posição em um array
     * @param {*} arr 
     * @param {*} i 
     * @param {*} j 
     */
    trocar: function (arr, i, j) {
        let temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    },
    /**
     * Ponto de entrada do programa principal. Recebe o algoritmo
     * a ser utilizado em forma de função e o executa.
     * @param {*} fAlgoritmo 
     */
    rodarTeste: function (fAlgoritmo) {
        const tamanho = process.argv[2] || 10000;
        const valorMin = process.argv[3] || 0;
        const valorMax = process.argv[4] || 1000;

        const meuArray = util.gerarArray(tamanho, valorMin, valorMax);
        console.log("Array inicial:", meuArray);

        const tempoInicio = new Date().getTime();
        const resultArray = fAlgoritmo.call(this, meuArray, 0, meuArray.length - 1);
        const tempoFim = new Date().getTime();

        console.log("Array ordenado:", resultArray || meuArray);
        console.log('Tempo:', tempoFim - tempoInicio, 'ms');
    }
};

module.exports = util;
