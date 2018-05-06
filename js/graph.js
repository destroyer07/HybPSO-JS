/**
 * Funções relacionadas com a impressão do gráfico de saída na tela
 */

function plotGraph(bench, best) {

    var route = insertDepotReturns(bench, best.routeDiscrete);
    var distance = evaluateFitnessWithDepots(bench, route);

    // console.log("Rota: " + route);
    // console.log("Distância: " + distance);
    
    var time = best.time;
    // Mostra tempo decorrido no teste no console
    console.log("Distância: " + distance, "Tempo: " +
        time.getUTCHours() + " h " +
        time.getMinutes() + " m " +
        time.getSeconds() + "." +
        time.getMilliseconds() + " s"
    );

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