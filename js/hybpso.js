
/**
 * Lê o arquivo passado por parâmetro
 * @param {string} file - Caminho do arquivo a ser lido
 * @param {*} cb - Função callback que recebe o texto de retorno
 */
function readTextFile(file, cb) {
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.overrideMimeType("text/plain");
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                cb(rawFile.responseText);
            }
        }
    }
    rawFile.send(null);
}

function customer(x, y, request) {
    return {
        x: x,
        y: y,
        request: request
    }
}

function euclidianDistance(a, b) {
    var square = (x) => x * x;
    return Math.sqrt(
        square(a.x - b.x) +
        square(a.y - b.y)
    );
}

/**
 * Gera inteiro aleatório menor que max
 * @param {Number} max - Inteiro que representa o valor máximo menos 1 gerado
 * @returns {Number} Valor inteiro gerado aleatóriamente menor que max
 */
function randomIntLessThan(max) {
    return Math.floor(Math.random() * max);
}

function readBenchmark(benchmark, cb) {
    readTextFile("benchmark/vrpnc" + benchmark + ".txt",
        (rawText) => {
            // Separa texto em linhas
            var lines = rawText.split("\r\n ");

            // Lê valores da primeira linha
            var parameters = lines.shift().trim().split(" ");

            // Lê valores da segunda linha
            var depot = lines.shift().trim().split(" ");

            // number of customers, vehicle capacity, maximum route time, drop time
            var bench = {
                // Quantidade de clientes
                customersQtd: parseInt(parameters[0]),

                // Capacidade de cada veículo
                vehicleCapacity: parseInt(parameters[1]),

                // Tempo máximo da rota
                maxRouteTime: parseInt(parameters[2]),

                // Tempo final
                dropTime: parseInt(parameters[3]),

                // Coordenadas dos clientes
                customers: Array(parseInt(parameters[0]) + 1),

                // Distâncias entre os clientes
                distances: Array(parseInt(parameters[0]) + 1),

                // Distâncias ordenadas
                ordenatedDistances: Array(
                    parseInt(parseFloat(parameters[0]) / 2 * parseInt(parameters[0])))
            }


            // Para cada cliente existente
            for (var i = 0; i < bench.customersQtd; i++) {
                // Separa valores da linha
                var c = lines[i].trim().split(" ");
                // Guarda as coordenadas do cliente
                bench.customers[i + 1] = customer(parseInt(c[0]), parseInt(c[1]), parseInt(c[2]));

                // Aproveita o laço para alocar a matriz de distâncias
                bench.distances[i] = Array(bench.customersQtd + 1);
            }

            // Aloca a última linha da matriz de distâncias
            bench.distances[bench.customersQtd] = Array(bench.customersQtd + 1);

            // Guarda coordenadas do depósito na posição 0 do array de clientes
            bench.customers[0] = customer(parseInt(depot[0]), parseInt(depot[1]), 0);

            // Contador do array de distâncias ordenadas
            var k = 0;

            // Calcula e armazena a distância euclidiana entre cada vértice (cliente e depósito)
            for (var i = 0; i <= bench.customersQtd; i++) {
                bench.distances[i][i] = 0;
                for (var j = i + 1; j <= bench.customersQtd; j++) {
                    var distance = euclidianDistance(bench.customers[i], bench.customers[j]);
                    bench.distances[i][j] = bench.distances[j][i] = distance;

                    // Guarda distâncias ordenadas
                    bench.ordenatedDistances[k++] = {
                        a: i,
                        b: j,
                        distance: distance
                    };
                }
            }

            bench.ordenatedDistances.sort((a, b) => a.distance > b.distance);

            // Chama a função de callback passando o
            // objeto com os dados do benchmark por parâmetro
            cb(bench);
        }
    );
}

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

function root(disjointSet, id) {
    var l = id;
    while (disjointSet.leafs[l].parent != -1) {
        l = disjointSet.leafs[l].parent;
    }
    return disjointSet.leafs[l].id;
}

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

function minimumCostSubroute(bench, disjointSet, majorRoute, minorRoute, pointA, pointB) {

    var minSubrouteCost = Number.MAX_VALUE;
    var minSubroute = [-1, -1];

    if (majorRoute.length == 1) {
        // console.log("Arestas:", [pointA, pointB]);
        minSubroute = [pointA, pointB, pointB, pointA];
    } else {
        for (var i = 0; i < majorRoute.length; i++) {
            for (var j = 0; j < 2; j++) {
                var a = majorRoute[i];
                var b = disjointSet.route[a][j];
                if (b != -1) {
                    if (minorRoute.length == 1) {
                        var subrouteCost
                            = bench.distances[a][pointB]
                            + bench.distances[b][pointB]
                            - bench.distances[a][b];

                        if (subrouteCost < minSubrouteCost) {
                            minSubrouteCost = subrouteCost;
                            minSubroute = [a, b, pointB, pointB];
                        }
                        // console.log("#");
                    } else {
                        for (var k = 0; k < minorRoute.length; k++) {
                            for (var l = 0; l < 2; l++) {
                                var c = minorRoute[k];
                                var d = disjointSet.route[c][l];
                                if (d != -1) {
                                    var subrouteCost
                                        = bench.distances[a][c]
                                        + bench.distances[b][d]
                                        - bench.distances[a][b]
                                        - bench.distances[c][d];

                                    if (subrouteCost < minSubrouteCost) {
                                        if (b == d)
                                            console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
                                        minSubrouteCost = subrouteCost;
                                        minSubroute = [a, b, c, d];
                                    }
                                    // console.log("  $");
                                }
                            }
                        }
                    }
                }
            }
        }


        // console.log("Arestas:", minSubroute);
        // console.log(minorRoute, majorRoute)
        if (minSubroute[2] == minSubroute[3]) {
            // console.log("#");
            removeEdgeInRoute(disjointSet, minSubroute[0], minSubroute[1]);
        } else {
            // console.log("  $");
            removeEdgeInRoute(disjointSet, minSubroute[0], minSubroute[1]);
            removeEdgeInRoute(disjointSet, minSubroute[2], minSubroute[3]);
        }
    }

    addEdgeInRoute(disjointSet, minSubroute[0], minSubroute[2]);
    addEdgeInRoute(disjointSet, minSubroute[1], minSubroute[3]);

    // console.log(disjointSet.route.map((e, i) => i + ": " + e));
}

function addEdge(bench, disjointSet, edge) {
    var subtreeA = disjointSet.leafs[edge.a];
    var subtreeB = disjointSet.leafs[edge.b];

    var pointA = edge.a;
    var pointB = edge.b;
    var rootA = root(disjointSet, pointA);
    var rootB = root(disjointSet, pointB);
    
    // console.log("-->", edge.a, edge.b);

    // A sub árvore A sempre terá mais folhas que a B
    if (disjointSet.roots[rootA].length < disjointSet.roots[rootB].length) {
        subtreeB = disjointSet.leafs[edge.a];
        subtreeA = disjointSet.leafs[edge.b];
        pointA = edge.b;
        pointB = edge.a;
        var aux = rootB;
        rootB = rootA;
        rootA = aux;
    }


    minimumCostSubroute(bench, disjointSet, disjointSet.roots[rootA], disjointSet.roots[rootB], pointA, pointB);
    
    disjointSet.roots[rootA].map(e1 => {
        disjointSet.roots[rootB].map(e2 => {
            if (e1 == e2) {
                console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
                console.log(e1, e2);
                console.log(disjointSet.roots[rootA], disjointSet.roots[rootB]);
            }
        });
    });

    // Adiciona as folhas de B às folhas de A
    disjointSet.roots[rootA] = disjointSet.roots[rootA].concat(disjointSet.roots[rootB]);

    // Marca a raiz de B como sendo a mesma de A
    disjointSet.leafs[rootB].parent = rootA;

    // Remove raíz de B da lista de raízes
    disjointSet.roots[rootB] = null;
    disjointSet.rootsQtd--;
}

function mpnsGrasp(bench, populationSize, rclD) {

    // Aloca o array da população
    var population = Array(populationSize);

    // Número de arestas existentes no array de distâncias ordenadas
    var availableEdges = bench.ordenatedDistances.length;

    // Itera até todas as partículas serem criadas
    for (var particle = 0; particle < populationSize; particle++) {
        // Aloca o array da próxima partícula
        population[particle] = Array(bench.customersQtd + 1);

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

        // ###############################
        // Aplicar a busca local aqui
        // ###############################
        
        // Guarda a nova partícula construída
        population[particle] =  {
            route: route
        };
    }

    // plotGraph(bench, population[0].route);

    return population;
}

function toContinuos(bench, route) {
    for (var i = 0; i < bench.customersQtd; i++) {
        route[i] = route[i] / bench.customersQtd;
    }
}

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

function updateFitness(bench, particle, index, oldNode) {
    
    // Se o nó substituído não for o último da rota
    // Calcula a diferença da rota entre ele e o próximo nó
    if (index < bench.customersQtd - 1) {
        particle.fitness -= bench.distances[particle.routeDiscrete[index + 1]][oldNode];
        particle.fitness += bench.distances[particle.routeDiscrete[index + 1]][particle.routeDiscrete[index]];
    }
    
    // Se o nó substituído não for o primeiro da rota
    // Calcula a diferença da rota entre ele e o nó anterior
    if (index > 0) {
        particle.fitness -= bench.distances[oldNode][particle.routeDiscrete[index - 1]];
        particle.fitness += bench.distances[particle.routeDiscrete[index]][particle.routeDiscrete[index - 1]];
    }
}

function pathRelinking(bench, particle, aim) {
    var fitness = particle.fitness;
    var particleRoute = particle.routeDiscrete.slice();
    
    for (var i = 0; i < bench.customersQtd; i++) {

        // Encontra a posição do nó na melhor rota
        var j = aim.findIndex((e, t) => e == particleRoute[i]);
        
        // Só calcula se os nós não estiverem na mesma posição nas duas rotas
        if (i == j) continue;
        
        // Troca os nós entre as duas posições
        var tmp = particleRoute[i];
        particleRoute[i] = particleRoute[j];
        particleRoute[j] = tmp;
        
        // Atualiza o fitness da particula
        fitness = evaluateFitness(bench, particleRoute);

        // Retorna se encontrou uma rota melhor que a atual
        if (fitness < particle.fitness) {
            // console.log("Path relinking !!!");
            particle.routeDiscrete = particleRoute.slice();
            particle.fitness = fitness;
            particle.route = particleRoute;
            toContinuos(bench, particle.route);
            break;
        }
    }
}

function updateBests(bench, particle, bestParticle) {

    // Atualiza o melhor resultado da partícula
    if (particle.fitness < particle.best.fitness) {
        particle.best.routeDiscrete = particle.routeDiscrete.slice();
        particle.best.route         = particle.route.slice();
        particle.best.fitness       = particle.fitness;
        console.log("--->", particle.best.fitness);
        // Atualiza o melhor resultado global
        if (particle.best.fitness < bestParticle.fitness) {
            bestParticle.routeDiscrete  = particle.best.routeDiscrete.slice();
            bestParticle.route          = particle.best.route.slice();
            bestParticle.fitness        = particle.best.fitness;
            console.log("------>", bestParticle);
        }
    }
}

function initPso(bench, population, bestParticle, params) {
    
    bestParticle.fitness = Number.MAX_VALUE;

    var bestPosition = -1;

    for (var i = 0; i < params.particles; i++) {

        // Calcula o fitness para a partícula
        population[i].fitness = evaluateFitness(bench, population[i].route);

        // Cria rota contínua para a partícula i
        population[i].routeDiscrete = population[i].route.slice();
        toContinuos(bench, population[i].route);

        // Inicializa array de velocidade da partícula
        population[i].velocities = Array(bench.customersQtd);
        for (var j = 0; j < bench.customersQtd; j++) {
            population[i].velocities[j] = 0;
        }
        
        // Guarda o melhor resultado de cada partícula
        population[i].best = {
            routeDiscrete: population[i].routeDiscrete.slice(),
            route: population[i].route.slice(),
            fitness: population[i].fitness
        }

        // Guarda a partícula de melhor valor
        if (bestParticle.fitness > population[i].fitness) {
            bestParticle.fitness = population[i].fitness;
            bestPosition = i;
        }
    }

    // Guarda dados da melhor partícula global
    bestParticle.route = population[bestPosition].route.slice();
    bestParticle.routeDiscrete = population[bestPosition].routeDiscrete.slice();
}

function diferentArrays(a , b) {
    a.forEach((e, i) => {
        if (b[i] != e)
            return true;
    });

    return false;
}

function pso(bench, population, params) {

    var bestParticle = {};
    // Inicializa variáveis do PSO
    initPso(bench, population, bestParticle, params);

    // console.log(population[0].fitness, population[1].fitness, "->" + bestParticle.fitness);

    // Itera até o número máximo de gerações
    for (var t = 0; t < params.generations; t++) {
        // Calcula a constante de inércia w
        var w = params.wMax - params.wMin
        w /= params.generations;
        w *= t;
        w = params.wMax - w;

        // Itera por todas as partículas da população
        population.forEach((particle, iPart)=> {
            // console.log(iPart);
            var route = particle.route;
            var best = particle.best.route;
            var vel = particle.velocities;
            // if (iPart == 0) console.log(particle.route, particle.best.route, particle.velocities);
            // Itera por todos os nós da rota
            for (var i = 0; i < bench.customersQtd; i++) {
                // Calcula a velocidade
                vel[i] = w * vel[i];
                vel[i] += params.c1 * Math.random() * (best[i] - route[i]);       
                vel[i] += params.c2 * Math.random() * (bestParticle.route[i] - route[i]);

                // Calcula a nova posição dos nós
                particle.route[i] += vel[i];
            }

            // if (iPart == 0) { console.log(particle.route, particle.best.route, particle.velocities); console.log(); console.log(); }

            // console.log(particle.route.map(e => e + ", "), particle.routeDiscrete.map(e => e + ", "));
            
            // Converte a rota de volta para o espaço discreto
            toDiscrete(bench, particle);

            

            // console.log(particle.route.map(e => e + ", "), particle.routeDiscrete.map(e => e + ", "));


            // Recalcula o fitness da partícula
            particle.fitness = evaluateFitness(bench, particle.routeDiscrete);

            // Escolhe a partícula alvo do path relinking probabilisticamente
            var probabilityToChooseBestGlobalParticle = 0.5;
            var aim = Math.random() < probabilityToChooseBestGlobalParticle
                ? bestParticle.routeDiscrete
                : particle.best.routeDiscrete;

            if (!diferentArrays(aim, particle.routeDiscrete)) {
                // Faz o path relinking da partícula atual com a alvo escolhida
                pathRelinking(bench, particle, aim);
            }
           
            // Atualiza as melhores partículas locais e a global
            updateBests(bench, particle, bestParticle);

            
            // console.log(particle.fitness, particle.best.fitness, bestParticle.fitness);
        });
        // console.log(population.map(e => e.best.fitness));
        // console.log(bestParticle.fitness);
    }

    return bestParticle;
}

function hybPSO(bench, params) {
    // Gera população inicial
    // var population = mpnsGrasp(bench, params.particles, params.rclD);

    // console.log(JSON.stringify(population));

    var population = [{"route":[47,12,37,44,42,40,19,41,13,17,4,18,25,14,6,24,43,23,7,48,27,8,26,31,28,36,35,3,22,1,32,11,38,9,50,16,2,20,29,21,34,30,39,33,45,15,10,49,5,46]},{"route":[1,22,8,26,31,28,3,36,35,20,16,2,29,21,50,34,30,39,10,49,9,5,38,11,32,27,48,7,23,43,24,6,14,25,13,40,42,19,41,18,47,4,17,44,45,33,15,37,12,46]},{"route":[37,15,45,44,17,4,18,41,19,42,40,13,25,14,6,23,24,43,7,26,8,48,1,22,31,28,3,36,35,20,2,29,21,34,30,39,33,10,49,38,9,50,16,11,32,27,46,5,12,47]},{"route":[24,14,25,18,4,47,12,17,19,41,13,40,42,44,45,33,15,37,5,49,10,39,30,34,21,50,9,38,11,16,29,35,36,3,20,2,1,22,28,31,8,26,7,43,23,48,6,27,32,46]},{"route":[11,2,20,36,35,29,16,50,21,34,30,39,10,49,9,38,5,33,45,15,37,44,42,40,19,41,13,17,4,47,12,46,32,1,22,3,28,31,8,26,48,7,23,43,24,25,18,14,6,27]},{"route":[6,14,25,24,43,23,7,48,27,1,22,32,8,26,31,28,3,36,35,20,2,16,29,21,34,50,9,30,39,10,49,5,38,11,12,37,15,33,45,44,17,42,19,40,41,13,4,18,47,46]},{"route":[47,17,37,15,33,45,44,42,19,40,41,13,4,18,25,14,6,24,43,23,7,26,31,28,22,3,36,35,20,2,29,16,50,21,34,30,39,10,49,9,5,38,11,32,1,8,48,27,46,12]},{"route":[46,27,48,6,14,25,24,43,23,7,26,31,8,1,32,11,38,16,2,22,28,36,35,3,20,29,21,50,9,34,30,39,10,49,5,37,15,33,45,44,42,40,13,41,19,17,12,47,4,18]},{"route":[6,48,8,31,26,23,7,43,24,14,25,18,4,13,41,40,19,42,44,45,33,15,37,17,47,12,5,49,10,39,30,50,34,21,29,2,16,9,38,11,32,22,28,3,36,35,20,1,27,46]},{"route":[6,14,25,24,43,23,7,48,27,32,1,22,8,26,31,28,3,36,35,20,2,11,38,16,29,21,50,34,30,39,10,9,49,5,12,37,15,33,45,44,42,40,13,41,19,17,4,18,47,46]},{"route":[27,6,14,25,24,43,7,23,48,8,26,31,28,3,36,35,20,22,1,32,11,2,29,21,16,9,50,34,30,39,10,49,38,5,33,45,15,44,42,19,40,41,13,37,17,4,18,47,12,46]},{"route":[46,6,24,43,23,7,26,8,48,27,1,32,11,38,9,16,2,22,3,28,31,36,35,20,29,21,50,34,30,49,5,10,39,33,15,45,44,42,19,40,41,13,37,17,12,47,4,18,25,14]},{"route":[27,48,8,26,31,28,3,36,35,20,22,1,32,11,38,16,50,2,29,21,34,30,39,10,9,49,5,37,15,33,45,44,17,12,47,4,18,41,19,42,40,13,25,14,24,43,23,7,6,46]},{"route":[27,6,14,25,24,43,23,7,48,8,26,31,28,3,36,35,20,29,21,34,30,39,10,49,9,50,16,38,5,11,2,1,22,32,12,17,37,15,33,45,44,42,19,40,41,13,4,18,47,46]},{"route":[27,6,48,23,24,43,7,8,26,31,28,3,36,35,20,1,22,2,29,16,50,21,34,30,39,10,49,9,38,11,32,46,12,5,33,45,15,44,37,17,4,18,41,19,42,40,13,25,14,47]},{"route":[47,14,25,13,40,42,19,41,18,4,17,44,45,33,15,37,5,9,50,49,10,39,30,34,21,29,2,16,38,11,12,46,32,1,22,20,35,36,3,28,31,26,8,48,7,23,43,24,6,27]},{"route":[46,38,11,9,50,16,2,32,1,22,3,36,35,20,29,21,34,30,39,10,49,5,12,37,15,33,45,44,42,40,19,41,13,17,4,18,47,25,14,6,24,43,23,7,26,31,28,8,48,27]},{"route":[27,6,23,24,43,7,48,26,31,8,22,1,32,11,38,9,50,16,2,3,28,36,35,20,29,21,34,30,39,10,49,5,46,12,37,15,33,45,44,42,40,19,17,4,41,13,25,14,18,47]},{"route":[46,12,37,15,33,45,44,17,4,18,47,42,19,40,41,13,25,14,6,24,43,23,7,26,31,8,48,27,32,1,22,28,3,36,35,20,2,11,38,9,16,29,21,50,34,30,39,10,49,5]},{"route":[46,47,18,4,13,41,40,19,42,17,44,45,33,15,37,12,5,49,38,11,32,16,50,9,10,39,30,34,21,29,2,20,35,36,3,22,28,31,26,8,7,23,43,24,25,14,48,1,27,6]}];

    // Calcula melhor rota pelo PSO
    var best = pso(bench, population, params);


    return best;
}

function readParams() {
    return {
        swarms: 1,
        particles: 20,
        generations: 500,
        c1: 2,
        c2: 2,
        wMin: 0.01,
        wMax: 0.9,
        rclD: 50,
        testsQtd: 10
    };
}

function batteryTests(bench, params) {
    var bestOfBests = { fitness: Number.MAX_VALUE };
        
    for (var i = 0; i < params.testsQtd; i++) {
        
        var best = hybPSO(bench, params);

        if (best.fitness < bestOfBests.fitness)
            bestOfBests = best;
    }

    return bestOfBests;
}

function init(benchmark) {

    var params = readParams();

    readBenchmark(benchmark, bench => {
        
        
        if (bench.customersQtd < 50) {
            params.rclD = parseInt(bench.customersQtd / 2);
        }
        
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
        

        insertDepotReturns(bench, bestOfBests.routeDiscrete);
        plotGraph(bench, bestOfBests.routeDiscrete);
    });
}


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

function tmpEvaluateFitness(bench, route) {

    var distance = 0;

    var i;
    for (i = 1; i < route.length; i++) {
        distance += bench.distances[route[i - 1]][route[i]];
    }

    return distance;
}

function plotGraph(bench, routeWithoutDepots) {

    var route = insertDepotReturns(bench, routeWithoutDepots);
    var distance = tmpEvaluateFitness(bench, route);

    console.log("Rota: " + route);
    console.log("Distância: " + distance);

    document.getElementById("distance").innerText = distance;
    document.getElementById("output").style.visibility = "visible";

    google.charts.load("current", { packages: ["corechart"] });
    google.charts.setOnLoadCallback(() => {

        var options = {
            legend: 'none',
            pointSize: 18,
            pointSize: 5,
            series: {
                0: { lineWidth: 1, color: "#FF0000" },
                1: { lineWidth: 0, color: "#000000" },
                2: { lineWidth: 0, color: "#00FF00" }
            }
        };

        var data = new google.visualization.DataTable();
        data.addColumn('number');
        data.addColumn('number');
        data.addColumn('number');
        data.addColumn('number');

        for (var i = 0; i < route.length; i++) {
            data.addRow([bench.customers[route[i]].x, bench.customers[route[i]].y, null, null]);
        }

        for (var i = 0; i <= bench.customersQtd; i++) {
            data.addRow([bench.customers[i].x, null, bench.customers[i].y, null]);
        }

        data.addRow([bench.customers[0].x, null, null, bench.customers[0].y]);


        var chart = new google.visualization.ScatterChart(document.getElementById('animatedshapes_div'));

        chart.draw(data, options);
    });
}

var teste = [27, 6, 14, 25, 24, 43, 23, 7, 48, 8, 26, 31, 28, 3, 36, 35, 20, 22, 1, 32, 11, 38, 16, 2, 29, 21, 34, 30, 50, 9, 39, 10, 49, 5, 12, 37, 15, 33, 45, 44, 42, 40, 19, 41, 13, 17, 4, 18, 47, 46];

