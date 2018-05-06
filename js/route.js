/**
 * Funções relacionadas a manipulação das rotas
 */

/**
 * Retorna a distância euclidiana entre dois clientes
 * @param {customer} a - cliente A
 * @param {customer} b - Cliente B
 */
function euclidianDistance(a, b) {
    var square = (x) => x * x;
    return Math.sqrt(
        square(a.x - b.x) +
        square(a.y - b.y)
    );
}

/**
 * Avalia o valor de fitness da rota
 * @param {benchmark} bench - Objeto com os dados do benchmark
 * @param {number[]} route - Rota a ser avaliada
 */
function evaluateFitness(bench, route) {
    // Distância percorrida
    var distance = bench.distances[0][route[0]];
    // Capacidade restante no veículo
    var load = bench.customers[route[0]].request;

    var i;
    for (i = 1; i < bench.customersQtd; i++) {
        
        // Soma à carga atual do veículo o valor requerido pelo cliente
        load += bench.customers[route[i]].request;

        // Se o veículo chegou à sua carga máxima
        if (load >= bench.vehicleCapacity) {
            // Adiciona distância de ida até o depósito (zero)
            // e retorno para o próximo cliente
            distance += bench.distances[route[i - 1]][0];
            distance += bench.distances[0][route[i]];
            
            // Zera a carga do veículo
            load = bench.customers[route[i]].request;
        } else {
            // Se o veículo suporta mais carga, continua o cálculo
            distance += bench.distances[route[i - 1]][route[i]];
        }
    }

    // Adiciona distância da última cidade ao depósito
    distance += bench.distances[route[i - 1]][0];

    return distance;
}

/**
 * Cria um objeto de conjunto disjunto
 * @param {benchmark} bench - Objeto com os dados do benchmark
 */
function buildDisjointSet(bench) {
    var disjointSet = {
        leafs: Array(bench.customersQtd + 1),
        roots: Array(bench.customersQtd + 1),
        route: Array(bench.customersQtd + 1),
        rootsQtd: bench.customersQtd + 1
    };

    for (var i = 0; i <= bench.customersQtd; i++) {
        // Monta array de raízes
        disjointSet.roots[i] = [ i ];

        // Monta array de sub rotas
        disjointSet.leafs[i] = { id: i, parent: -1 };

        // Inicializa arestas da rota com -1
        disjointSet.route[i] = [-1, -1];
    }

    return disjointSet;
}

/**
 * Retorna a raíz do nó
 * @param {disjointSet} disjointSet - Objeto de conjunto disjunto
 * @param {number} id - Identificador do nó a ser avaliado
 */
function root(disjointSet, id) {
    var l = id;
    while (disjointSet.leafs[l].parent != -1) {
        l = disjointSet.leafs[l].parent;
    }
    return disjointSet.leafs[l].id;
}


/**
 * Adiciona a aresta A-B no conjunto disjunto
 * @param {disjointSet} disjointSet - Objeto de conjunto disjunto
 * @param {number} a - Identificador do nó A
 * @param {number} b - Identificador do nó B
 */
function addEdgeInRoute(disjointSet, a, b) {
    // console.log("+ " + a + ": " + disjointSet.route[a] + " | " + b + ": " + disjointSet.route[b]);
    if (disjointSet.route[a][0] == -1) {
        disjointSet.route[a][0] = b;
    } else {
        disjointSet.route[a][1] = b;
    }

    if (disjointSet.route[b][0] == -1) {
        disjointSet.route[b][0] = a;
    } else {
        disjointSet.route[b][1] = a;
    }
    // console.log("= " + a + ": " + disjointSet.route[a] + " | " + b + ": " + disjointSet.route[b]);
}

/**
 * Remove a aresta A-B do conjunto disjunto
 * @param {disjointSet} disjointSet - Objeto de conjunto disjunto
 * @param {number} a - Identificador do nó A
 * @param {number} b - Identificador do nó B
 */
function removeEdgeInRoute(disjointSet, a, b) {
    // console.log("- " + a + ": " + disjointSet.route[a] + " | " + b + ": " + disjointSet.route[b]);
    if (disjointSet.route[a][0] == b) {
        disjointSet.route[a][0] = -1;
    } else if (disjointSet.route[a][1] == b) {
        disjointSet.route[a][1] = -1;
    }

    if (disjointSet.route[b][0] == a) {
        disjointSet.route[b][0] = -1;
    } else if (disjointSet.route[b][1] == a) {
        disjointSet.route[b][1] = -1;
    }
    // console.log("= " + a + ": " + disjointSet.route[a] + " | " + b + ": " + disjointSet.route[b]);
}

/**
 * Conecta duas rotas a partir da menor rota possível.
 * @param {*} bench - Objeto com os dados do benchmark
 * @param {*} disjointSet - Objeto do conjunto disjunto
 * @param {*} majorRoute - A maior entre as duas rotas
 * @param {*} minorRoute - A menor entre as duas rotas
 * @param {*} pointA - Ponta de ligação na maior rota
 * @param {*} pointB - Ponto de ligação na menor rota
 */
function minimumCostSubroute(bench, disjointSet, majorRoute, minorRoute, pointA, pointB) {

    // Custo da menor subrota possível
    var minSubrouteCost = Number.MAX_VALUE;
    // Nós das duas arestas que conectam as duas rotas, formando a menor subrota
    var minSubroute = [-1, -1, -1, -1];

    // Se a maior rota possui apenas um nó, então as duas rotas possuem um único nó,
    // e a menor rota é a reta que conecta os dois nós
    if (majorRoute.length == 1) {
        minSubroute = [pointA, pointB, pointB, pointA];

    } else { // Se a maior rota é formada por 2 ou mais nós

        // Itera por todos os nós da rota maior
        for (var i = 0; i < majorRoute.length; i++) {

            // Itera pelos 2 nós vizinhos ao nó i da rota maior
            for (var j = 0; j < 2; j++) {

                // Nó A pertence a maior rota
                var a = majorRoute[i];

                // Nó B é um dos vizinhos do nó A
                var b = disjointSet.route[a][j];

                // Se o nó A realmente tiver um vizinho
                if (b != -1) {

                    // Se a menor rota possui um único nó
                    if (minorRoute.length == 1) {

                        // Adiciona a rota menor (formada por um único ponto)entre os pontos A e 
                        // seu vizinho B na rota maior e calcula a distância dessa possível nova rota
                        var subrouteCost
                            = bench.distances[a][pointB]
                            + bench.distances[b][pointB]
                            - bench.distances[a][b];

                        // Se a distância for menor que a menor já encontrada, guarda-a como menor rota
                        if (subrouteCost < minSubrouteCost) {
                            minSubrouteCost = subrouteCost;
                            minSubroute = [a, b, pointB, pointB];
                        }
                        
                    } else { // Se a menor rota é formada por 2 ou mais nós

                        // Itera por todos os nós da rota menor
                        for (var k = 0; k < minorRoute.length; k++) {

                            // Itera pelos 2 nós vizinhos ao nó k da rota menor 
                            for (var l = 0; l < 2; l++) {

                                // Nó C pertence a menor rota
                                var c = minorRoute[k];

                                // Nó D é um dos vizinhos do nó C
                                var d = disjointSet.route[c][l];

                                // Se o nó C realmente tiver um vizinho
                                if (d != -1) {

                                    // Conecta o ponto A da rota maior no ponto C da rota menor
                                    // e o ponto B da rota maior ao ponto D da rota menor
                                    // e calcula a distância dessa possível nova rota
                                    var subrouteCost
                                        = bench.distances[a][c]
                                        + bench.distances[b][d]
                                        - bench.distances[a][b]
                                        - bench.distances[c][d];

                                    // Se a distância for menor que a menor já encontrada, guarda-a como menor rota
                                    if (subrouteCost < minSubrouteCost) {
                                        minSubrouteCost = subrouteCost;
                                        minSubroute = [a, b, c, d];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Se a segunda nova aresta for um ponto, significa que a menor rota possui apenas um ponto
        if (minSubroute[2] == minSubroute[3]) {
            // Remove apenas a aresta da maior rota
            removeEdgeInRoute(disjointSet, minSubroute[0], minSubroute[1]);
        } else {
            // Remove as arestas dos nós que serão conectados entre a maior e a menor rota
            removeEdgeInRoute(disjointSet, minSubroute[0], minSubroute[1]);
            removeEdgeInRoute(disjointSet, minSubroute[2], minSubroute[3]);
        }
    }

    // Adiciona as duas novas arestas para conectar a rota maior à rota menor
    addEdgeInRoute(disjointSet, minSubroute[0], minSubroute[2]);
    addEdgeInRoute(disjointSet, minSubroute[1], minSubroute[3]);
}

function routeConstruction(bench, rclD) {
    // Monta RCL
    var rcl = bench.ordenatedDistances.slice();

    // Contador de iteração
    var rclM = 0;

    // Estrutura de dados para conjuntos disjuntos
    // com a partícula sendo montada atualmente
    var disjointSet = buildDisjointSet(bench);

    do {
        // Escolhe uma partícula aleatoriamente do RCL
        var partIndex = randomIntLessThan(rcl.length < rclD ? rcl.length : rclD);
        // Pega candidato escolhido do RCL
        var candidate = rcl.splice(partIndex, 1)[0];

        // Se os nós não forem da mesma árvore, adiciona um ao outro
        if (root(disjointSet, candidate.a) != root(disjointSet, candidate.b)) {
            addEdge(bench, disjointSet, candidate);
        }

    // Itera enquanto houver mais de uma raíz
    } while (disjointSet.rootsQtd > 1);
    
    // Monta a rota
    var next = disjointSet.route[0][0];
    var last = 0;
    var route = [];
    while (next != 0) {
        route.push(next);
        if (disjointSet.route[next][0] != last) {
            last = next;
            next = disjointSet.route[next][0];
        } else {
            last = next;
            next = disjointSet.route[next][1];
        }
    }

    // Retorna a rota construída
    return route;
}

/**
 * Conecta as subrotas que contém os nós da aresta "edge", de forma
 * que a rota resultante seja a menor possível
 * @param {benchmark} bench - Objeto com os dados do benchmark
 * @param {disjointSet} disjointSet - Objeto do conjunto disjunto
 * @param {{a, b}} edge - Objeto com os dois nós de uma aresta
 */
function addEdge(bench, disjointSet, edge) {
    // Subárvore A é a subárvore do nó A da aresta na representação do conjunto disjunto
    var subtreeA = disjointSet.leafs[edge.a];
    // Subárvore B é a subárvore do nó B da aresta na representação do conjunto disjunto
    var subtreeB = disjointSet.leafs[edge.b];

    // Nó A da aresta
    var pointA = edge.a;
    // Nó B da aresta
    var pointB = edge.b;

    // Raíz da subárvore A
    var rootA = root(disjointSet, pointA);
    // Raíz da subárvore B
    var rootB = root(disjointSet, pointB);

    // Garante que a subárvore A sempre terá mais folhas que a B
    if (disjointSet.roots[rootA].length < disjointSet.roots[rootB].length) {
        subtreeB = disjointSet.leafs[edge.a];
        subtreeA = disjointSet.leafs[edge.b];
        pointA = edge.b;
        pointB = edge.a;
        var aux = rootB;
        rootB = rootA;
        rootA = aux;
    }

    // Une dois grupos de arestas com a menor rota possível
    minimumCostSubroute(bench, disjointSet, disjointSet.roots[rootA], disjointSet.roots[rootB], pointA, pointB);

    // Adiciona as folhas de B às folhas de A
    disjointSet.roots[rootA] = disjointSet.roots[rootA].concat(disjointSet.roots[rootB]);

    // Marca a raiz de B como sendo a mesma de A
    disjointSet.leafs[rootB].parent = rootA;

    // Remove raíz de B da lista de raízes
    disjointSet.roots[rootB] = null;
    disjointSet.rootsQtd--;
}

/**
 * Insere nós de retorno ao depósito entre a rota conforme necessário
 * @param {*} bench 
 * @param {*} route 
 */
function insertDepotReturns(bench, route) {
    // Rota contendo retornos ao depósito
    var completeRoute = [0].concat(route);
    // Carga no veículo
    var load = 0;

    var i;
    for (i = 1; i < completeRoute.length; i++) {
        // Soma à carga atual do veículo o valor requerido pelo cliente
        load += bench.customers[completeRoute[i]].request;
        // Se o veículo chegou à sua carga máxima
        if (load >= bench.vehicleCapacity) {
            // Adiciona o depósito (zero) na posição i
            completeRoute.splice(i, 0, 0)
            
            // Zera a carga do veículo
            load = 0;
        }
    }

    // Adiciona depósito à ultima posição da rota
    completeRoute.push(0);

    return completeRoute;
}

/**
 * Avalia o fitness da rota com os depósitos
 * @param {*} bench 
 * @param {*} route 
 */
function evaluateFitnessWithDepots(bench, route) {

    var distance = 0;

    var i;
    for (i = 1; i < route.length; i++) {
        distance += bench.distances[route[i - 1]][route[i]];
    }

    return distance;
}

/**
 * Converte os nós de uma rota para valores entre 0 e 1
 */
function toContinuos(bench, route, routeDiscrete = null) {

    if (routeDiscrete == null)
        routeDiscrete = route;

    for (var i = 0; i < bench.customersQtd; i++) {
        route[i] = routeDiscrete[i] / bench.customersQtd;
    }
}

/**
 * Coverte nós da rota para valores discretos
 * @param {*} bench 
 * @param {*} particle 
 */
function toDiscrete(bench, particle) {
    // Cria array temporário para as posições
    var positions = Array(bench.customersQtd);
    
    // Guarda cada elemento com sua devida posição
    particle.route.map((e, i) => positions[i] = {
        element: e,
        index: i
    });

    // Ordena os valores da rota
    positions.sort((a, b) => a.element > b.element);
    
    // Atribui valores naturais aos elementos ordenados
    var count = 1;
    positions.map(e => particle.routeDiscrete[e.index] = count++);
}

/**
 * Sai de uma rota inicial e chega em uma final com fitness melhor.
 * A rota é reconstruída trocando de dois em dois nós.
 * Se for encontrado uma rota com melhor fitness durante o percurso, ela é retornada
 * @param {*} bench 
 * @param {*} particle 
 * @param {*} aim 
 */
function pathRelinking(bench, particle, aim) {
    var fitness = particle.fitness;
    var particleRoute = particle.routeDiscrete.slice();
    
    for (var count = 0; count < bench.customersQtd; count++) {

        // var i = randomIntLessThan(bench.customersQtd);
        var i = count;

        // Encontra a posição do nó na melhor rota
        var j = aim.routeDiscrete.findIndex((e, t) => e == particleRoute[i]);
        
        // Só calcula se os nós não estiverem na mesma posição nas duas rotas
        if (i == j)
            continue;
        
        // Troca os nós entre as duas posições
        var tmp = particleRoute[i];
        particleRoute[i] = particleRoute[j];
        particleRoute[j] = tmp;
        
        // Atualiza o fitness da particula
        fitness = evaluateFitness(bench, particleRoute);

        // Retorna se encontrou uma rota melhor que a alvo
        if (fitness < aim.fitness) {
            // console.log("Path relinking !!!");
            particle.routeDiscrete = particleRoute.slice();
            particle.fitness = fitness;
            particle.route = particleRoute;
            toContinuos(bench, particle.route);
            break;
        }
    }
}