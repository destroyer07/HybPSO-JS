/**
 * Funções de apoio geral
 */

/**
 * Gera inteiro aleatório menor que max
 * @param {Number} max - Inteiro que representa o valor máximo menos 1 gerado
 * @returns {Number} Valor inteiro gerado aleatóriamente menor que max
 */
function randomIntLessThan(max) {
    return Math.floor(Math.random() * max);
}

/**
 * Verifica se dois arrays são diferentes
 * @param {number[]} a 
 * @param {number[]} b 
 */
function diferentArrays(a , b) {
    a.forEach((e, i) => {
        if (b[i] != e)
            return true;
    });

    return false;
}