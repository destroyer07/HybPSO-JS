/**
 * Funções relacionadas ao PSO
 */

/**
 * Atualiza melhores partículas local e global
 * @param {*} particle 
 * @param {*} bestParticle 
 * @param {*} newBestParticle 
 */
function updateBests(particle, bestParticle, newBestParticle) {

    // Atualiza o melhor resultado da partícula
    if (particle.fitness < particle.best.fitness) {
        particle.best.routeDiscrete = particle.routeDiscrete.slice();
        particle.best.route         = particle.route.slice();
        particle.best.fitness       = particle.fitness;
        // console.log("--->", particle.best.fitness);
        // Atualiza o melhor resultado global
        if (particle.best.fitness < bestParticle.fitness) {
            newBestParticle.routeDiscrete  = particle.best.routeDiscrete.slice();
            newBestParticle.route          = particle.best.route.slice();
            newBestParticle.fitness        = particle.best.fitness;
            // console.log("------>", newBestParticle);
        }
    }
}

/**
 * Inicializa a estrutura do PSO
 * @param {*} bench 
 * @param {*} population 
 * @param {*} bestParticle 
 * @param {*} params 
 */
function initPso(bench, population, bestParticle, params) {
    
    bestParticle.fitness = Number.MAX_VALUE;

    var bestPosition = -1;

    for (var i = 0; i < params.particles; i++) {

        // Calcula o fitness para a partícula
        population[i].fitness = evaluateFitness(bench, population[i].route);

        // Cria rota contínua para a partícula i
        population[i].routeDiscrete = population[i].route.slice();
        toContinuos(bench, population[i].route);

        // Inicializa array de velocidade da partícula com valores aleatórios
        population[i].velocities = Array(bench.customersQtd);
        for (var j = 0; j < bench.customersQtd; j++) {
            population[i].velocities[j] = Math.random();
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

/**
 * Realiza o PSO
 * @param {*} bench 
 * @param {*} population 
 * @param {*} params 
 */
function pso(bench, population, params) {

    var bestParticle = {};
    // Inicializa variáveis do PSO
    initPso(bench, population, bestParticle, params);

    // console.log(population[0].fitness, population[1].fitness, "->" + bestParticle.fitness);

    // Itera até o número máximo de gerações
    for (var t = 0; t < params.generations; t++) {
        // Calcula a constante de inércia w
        var w = params.wMax - params.wMin
        w *= t;
        w /= params.generations;
        w = params.wMax - w;

        var newBestParticle = { fitness: Number.MAX_VALUE };

        // Itera por todas as partículas da população
        population.forEach((particle, iPart)=> {

            // console.log(iPart);
            var route = particle.route;
            var best = particle.best.route;
            var vel = particle.velocities;
            // if (iPart == 0) console.log(particle.route, particle.best.route, particle.velocities);
            // Itera por todos os nós da rota
            for (var i = 0; i < bench.customersQtd; i++) {
                var rand1 = Math.random();
                var rand2 = Math.random();
                // Calcula a velocidade
                vel[i] = w * vel[i] + params.c1 * rand1 * (best[i] - route[i]) + params.c2 * rand2 * (bestParticle.route[i] - route[i]);

                // Para limitar os valores da velocidade descomente as 4 linhas abaixo
                // var vel_min = -0.5;
                // var vel_max = 0.5;
                // if (vel[i] < vel_min) vel[i] = vel_min;
                // else if (vel[i] > vel_max) vel[i] = vel_max;

                // Calcula a nova posição dos nós
                particle.route[i] += vel[i];
            }
            

            // Converte a rota de volta para o espaço discreto
            toDiscrete(bench, particle);

            // Recalcula o fitness da partícula
            particle.fitness = evaluateFitness(bench, particle.routeDiscrete);

            // Escolhe a partícula alvo do path relinking probabilisticamente
            var probabilityToChooseBestGlobalParticle = 0.8;
            var aim = Math.random() < probabilityToChooseBestGlobalParticle
                ? bestParticle
                : particle.best;

            if (!diferentArrays(aim.routeDiscrete, particle.routeDiscrete)) {
                // Faz o path relinking da partícula atual com a alvo escolhida
                pathRelinking(bench, particle, aim);
            }

            // Converte rota para contínua
            toContinuos(bench, particle.route, particle.routeDiscrete);
           
            // Atualiza as melhores partículas locais e a global
            updateBests(particle, bestParticle, newBestParticle);

        });

        if (newBestParticle.fitness < bestParticle.fitness) {
            bestParticle = newBestParticle;
        }

    }

    return bestParticle;
}