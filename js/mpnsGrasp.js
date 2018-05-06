/**
 * Funções relacionadas ao GRASP de múltiplas fases
 */

/**
 * Retorna o array das arestas da rota
 * @param {benchmark} bench - Objeto com os dados do benchmark
 * @param {number[]} route - Rota a ser analisada
 */
function getEdgesFomRoute(bench, route) {

    // Monta primeira aresta
    var edges = [ {
        a: 0,
        b: route[0],
        distance: bench.distances[0][route[0]]
     } ];

    // Monta restante das arestas
    for (var i = 1; i < bench.customersQtd; i++) {
        edges.push({
            a: route[i - 1],
            b: route[i],
            distance: bench.distances[route[i-1]][route[i]]
        });
    }

    // Monta última aresta
    edges.push({
        a: 0,
        b: route[0],
        distance: bench.distances[route[i-1]][0]
    });

    // Retorna array de arestas
    return edges;
}

/**
 * Verifica se a menor distância entre um dos pontos da aresta A-B e
 * um dos pontos da aresta "edge" é menor que "radius".
 * Portanto, ambas as arestas estão dentro de um círculo de raio "radius"
 * @param {benchmark} bench - Objeto com os dados do benchmark
 * @param {number} a - Ponto A da aresta central
 * @param {number} b - Potno B da aresta central
 * @param {{a, b}} edge - Aresta a ser avaliada
 * @param {number} radius - Raio de distância
 */
function insideRadius(bench, a, b, edge, radius) {
    return euclidianDistance(bench.customers[a], bench.customers[edge.a]) < radius
        && euclidianDistance(bench.customers[a], bench.customers[edge.b]) < radius
        && euclidianDistance(bench.customers[b], bench.customers[edge.a]) < radius
        && euclidianDistance(bench.customers[b], bench.customers[edge.b]) < radius;
}

/**
 * Busca local com restrição circular
 * @param {benchmark} bench - Objeto com os dados do benchmark
 * @param {number[]} route - Rota a ser analisada
 * @param {number} A - Ponto central
 * @param {number} radius - Raio de distância
 */
function circleRestrictedLocalSearch(bench, route, A, radius) {

    var restrictedEdges = [];

    if (insideRadius(bench, 0, route[0], A, radius)) {
        restrictedEdges = {
            a: 0,
            b: route[0],
            distance: bench.distances[route[i-1]][0]
        };
    }


    for (var i = 0; i < bench.customersQtd; i++) {

        if (bench.distances[route[i]]) {

        }
    }
}

/**
 * Busca local de múltiplas fases na rota
 * @param {benchmark} bench - Objeto com os dados do benchmark
 * @param {*} route - Rota a ser analisada
 */
function multiplePhaseNeighborhoodSearch(bench, route) {
    
    // Monta lista de array ordenada da maior para a menor
    // var edges = getEdgesFomRoute(bench, route).sort((e1, e2) => e1.distance < e2.distance);
    
    // Pega maior aresta
    // var A = edges.shift();

    // Raio do circulo de busca
    // var circleRadius = A.distance / 2;

    // Objeto que guarda a melhor rota encontrada na busca local
    var bestRoute = {
        route: route.slice(),
        fitness: evaluateFitness(bench, route)
    }

    // Itera por todos os nós existentes
    for (var i = 0; i < bench.customersQtd; i++) {
        // Itera por todos os nós existentes
        for (var j = 0; j < bench.customersQtd; j++) {

            // Escolhe as arestas dentro do raio de busca
            // circleRestrictedLocalSearch(bench, route, A, circleRadius);
            
            // Só calcula se os nós não forem os mesmos
            if (i == j) continue;

            // Rota temporária é uma cópia da original
            var tmpRoute = route.slice();

            // Troca os nós i e j da rota
            var tmp = tmpRoute[j];
            tmpRoute[j] = tmpRoute[i];
            tmpRoute[i] = tmp;

            // Calcula o fitness da nova rota
            var fitness = evaluateFitness(bench, tmpRoute);

            // Se o fitness for melhor que o melhor já encontrado na busca
            // guarda a rota como sendo a melhor
            if (fitness < bestRoute.fitness) {
                bestRoute.route = tmpRoute;
                bestRoute.fitness = fitness;
            }
        }
    }

    // A antiga rota é substituída pela melhor rota
    route = bestRoute.route;

    // Retorna o valor de fitness da nova rota
    return bestRoute.fitness;
}

/**
 * Cria uma população utilizando o algoritmo GRASP de múltiplas fases
 * @param {benchmark} bench - Objeto com os dados do benchmark
 * @param {number} populationSize - Tamanho da população a ser criada
 * @param {number} rclD - Tamanho do RCL
 */
function mpnsGrasp(bench, populationSize, rclD) {

    // Aloca o array da população
    var population = Array(populationSize);

    // Número de arestas existentes no array de distâncias ordenadas
    var availableEdges = bench.ordenatedDistances.length;

    // Itera até todas as partículas serem criadas
    for (var particle = 0; particle < populationSize; particle++) {

        // Aloca o array da próxima partícula
        population[particle] = Array(bench.customersQtd + 1);

        // Fase de construção do GRASP
        // Monta uma rota de um modo guloso e aleatório
        var route = routeConstruction(bench, rclD);

        // Fase de busca local do GRASP
        // Aplica as fases de busca local na rota construída
        multiplePhaseNeighborhoodSearch(bench, route);
        
        // Guarda a nova partícula construída
        population[particle] =  {
            route: route
        };
    }

    // plotGraph(bench, population[0].route);

    return population;
}