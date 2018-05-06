/**
 * Funções relacionadas ao PSO híbrido
 */

/**
 * Lê parâmetros de entrada
 */
function readParams() {

    return {
        swarms: 1,
        particles: parseInt(document.getElementById("particles").value),
        generations: parseInt(document.getElementById("generations").value),
        c1: parseFloat(document.getElementById("c1").value),
        c2: parseFloat(document.getElementById("c2").value),
        wMin: parseFloat(document.getElementById("wMin").value),
        wMax: parseFloat(document.getElementById("wMax").value),
        rclD: parseInt(document.getElementById("rclD").value),
        testsQtd: parseInt(document.getElementById("testsQtd").value),
    };
}

readParams();

/**
 * PSO híbrido
 * @param {*} bench 
 * @param {*} params 
 */
function hybPSO(bench, params) {
    // Gera população inicial
    var population = mpnsGrasp(bench, params.particles, params.rclD);

    // Calcula melhor rota pelo PSO
    var best = pso(bench, population, params);

    return best;
}



/**
 * Realiza bateria de testes
 * @param {*} bench 
 * @param {*} params 
 */
function batteryTests(bench, params) {
    var bestOfBests = { fitness: Number.MAX_VALUE };
        
    for (var i = 0; i < params.testsQtd; i++) {
        
        // Guarda instante inicial da execução
        var beginTime = new Date().getTime();

        // PSO híbrido
        var best = hybPSO(bench, params);

        // Calcula tempo decorrido na execução do algoritmo
        var endTime = new Date().getTime();
        var time = new Date(endTime - beginTime);

        if (best.fitness < bestOfBests.fitness) {
            bestOfBests = best;
            bestOfBests.time = time;
        }
    }

    return bestOfBests;
}

/**
 * Função inicial do algoritmo
 * @param {string} benchmark - Número do benchmark escolhido
 */
function init(benchmark) {

    var params = readParams();

    readBenchmark(benchmark, bench => {
        
        
        if (bench.customersQtd < 50) {
            params.rclD = parseInt(bench.customersQtd / 2);
        }
        
        // A parte comentada abaixo serve para testar os melhores valores de c1 e c2 no PSO
        // var bestParams = null;
        // var bestOfBests = { fitness: Number.MAX_VALUE };

        // for (var c1 = 1; c1 <= 2.4; c1 += 0.2) {
        //     for (var c2 = 1; c2 <= 2.4; c2 += 0.2) {
        //         params.c1 = c1;
        //         params.c2 = c2;
                var bestOfBests = batteryTests(bench, params);
                // if (best.fitness < bestOfBests.fitness) {
                //     bestParams = JSON.parse(JSON.stringify(params));
                //     bestOfBests = JSON.parse(JSON.stringify(params));
                // }

        //         console.log("c1: " + c1 + ", c2: " + c2 + ", fitness: " + bestOfBests);
        //     }
        // }
        
        // Mostra a 
        // insertDepotReturns(bench, bestOfBests.routeDiscrete);
        plotGraph(bench, bestOfBests);
    });
}