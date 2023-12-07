module.exports = {
    gerarArray: function(tamanho, min, max) {
        const arr = [];
        let i = 0;
        while (i < tamanho) {
            arr.push(Math.trunc(min + Math.random() * (max - min)));
            i++;
        }
        return arr;
    },
    trocar: function (arr, i, j) {
        let temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
      }
};
