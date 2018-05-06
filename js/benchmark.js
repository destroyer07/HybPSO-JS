
/**
 * Caminho relativo para o arquivo de benchmark
 * @param {string} benchmark - Número do benchmark
 */
function benchmarkPath(benchmark) {
    return "benchmark/vrpnc" + benchmark + ".txt";
}

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

/**
 * Monta objeto que representa um cliente
 * @param {number} x - Coordenada X do cliente
 * @param {number} y - Coordenada Y do cliente
 * @param {number} request - Valor de carga requerido pelo cliente
 */
function customer(x, y, request) {
    return {
        x: x,
        y: y,
        request: request
    }
}

/**
 * Monta o objeto com os dados do benchmark
 * @param {string[]} parameters - Parâmetros da primeira linha do arquivo de benchmark
 */
function buildBenchmarkObject(parameters) {
    return {
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
    };
}

function calculateDistances(bench) {
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

    // Ordena o array de distâncias
    bench.ordenatedDistances.sort((a, b) => a.distance > b.distance);
}

function readCustomers(bench, lines) {
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
}

/**
 * Lê o benchmark
 * @param {string} benchmark - Número do benchmark
 * @param {*} cb - Função de callback que recebe o objeto com os dados do benchmark como parâmetro
 */
function readBenchmark(benchmark, cb) {
    readTextFile(
        benchmarkPath(benchmark),
        (rawText) => {
            // Separa texto em linhas
            var lines = rawText.split("\r\n ");

            // Lê valores da primeira linha
            var parameters = lines.shift().trim().split(" ");

            // Monta o objeto com os dados do benchmark
            var bench = buildBenchmarkObject(parameters);
            
            // Lê valores da segunda linha
            var depot = lines.shift().trim().split(" ");

            // Guarda as coordenadas do depósito na posição 0 do array de clientes
            bench.customers[0] = customer(parseInt(depot[0]), parseInt(depot[1]), 0);

            // Lê os clientes do benchmark
            readCustomers(bench, lines);

            // Calcula as distâncias entre os clientes
            calculateDistances(bench);

            // Chama a função de callback passando o
            // objeto com os dados do benchmark por parâmetro
            cb(bench);
        }
    );
}