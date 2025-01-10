const carCanvas = document.getElementById('carCanvas');
carCanvas.width = 300;
const networkCanvas = document.getElementById('networkCanvas');
networkCanvas.width = 700;

const carCtx = carCanvas.getContext('2d');
const networkCtx = networkCanvas.getContext('2d');

const laneCount = 6;
const road = new Road(carCanvas.width / 2, carCanvas.width * 0.87, laneCount);
const carSpeed = 9;
const training = true;
const maxTrial = 8;

var genCount = 1;
var drawSensor = false;
var trials = 1;
var traffics = [];
var traficsPos = [];
var trafficsLane = [];
var passCount = 0;
var cars = [];
var bestLeftCar;
var bestRightCar;
var viewer;

reset(0);
function reset(time){
    cars = generateCars(training ? 500 : 1, time);
    traffics = [];
    viewer = cars[0];
    bestLeftCar = cars[0];
    bestRightCar = cars[1];
    loadBrain(cars);
    
    if(passCount >= 100 || trials > maxTrial){
        traficsPos = [];
        trafficsLane = [];
        trials = 1;
    }
    else{
        for(let i = 0; i < traficsPos.length; i++){
            traffics.push(new Car(
                i + 1,
                road.getLaneCenter(trafficsLane[i]),
                traficsPos[i],
                30, 50,
                "DUMMY",
                0,
                carSpeed / 3,
                getRandomColor()
            ));
        }
    }
}

function loadBrain(cars){
    if(localStorage.getItem("bestLeftBrain")){
        let bestScore = JSON.parse(localStorage.getItem("bestScore"))

        let similarRate = parseInt(bestScore / 10) + 1;
        cars[0].brain = JSON.parse(localStorage.getItem("bestLeftBrain"));
        cars[1].brain = JSON.parse(localStorage.getItem("bestRightBrain"));
        for(let i = 2; i < cars.length; i++){
            NeuralNetwork.crossover(cars[i].brain, cars[0].brain, cars[1].brain);
            if(i < cars.length * 1 / 5){
                NeuralNetwork.mutate(cars[i].brain, 0.1 / similarRate);
            }
            else if(i < cars.length * 2 / 5){
                NeuralNetwork.mutate(cars[i].brain, 0.2 / similarRate);
            }
            else if(i < cars.length * 3 / 5){
                NeuralNetwork.mutate(cars[i].brain, 0.3 / similarRate);
            }
            else if(i < cars.length * 4 / 5){
                NeuralNetwork.mutate(cars[i].brain, 0.5 / similarRate);
            }
            else{
                NeuralNetwork.mutate(cars[i].brain, 0.7 / similarRate);
            }
        }
    }
}

function generateTraffic(carY){
    // removed passed traffics for efficiency
    while(traffics.length > 0 && (carY - traffics[0].y) <= -1200){
            traffics.shift();
    }

    var trafficDis = 300;
    // generate new traffics
    while(traffics.length == 0 || (carY - traffics[traffics.length - 1].y) / trafficDis <= 4){
        
        let lastPos = traficsPos.length == 0 ? 0 : traficsPos[traficsPos.length - 1];
        let lastY = traffics.length == 0 ? 0 : traffics[traffics.length - 1].y;
        let trafficY = lastY - trafficDis;
        let trafficCount = randInt(1, laneCount - 3);
        
        let lane = [...Array(trafficCount).fill(1), ...Array(laneCount - trafficCount).fill(0)];
        shuffle(lane);

        for(let i = 0; i < laneCount; i++) {
            if(lane[i] == 1){
                traffics.push(new Car(
                    traficsPos.length + 1,
                    road.getLaneCenter(i),
                    trafficY,
                    30, 50,
                    "DUMMY",
                    0,
                    carSpeed / 3,
                    getRandomColor()
                ));
                trafficsLane.push(i);
                traficsPos.push(lastPos - trafficDis);
            }
        }
    }
}

function generateCars(N, time){
    const cars = [];
    for(let i = 1; i <= N; i++){
        cars.push(new Car(0, road.getLaneCenter(parseInt(laneCount / 2)), 
        100, 30, 50, training ? "AI" : "KEYS", time, carSpeed
        ));
    }
    return cars;
}

function switchSensor(){
    drawSensor = !drawSensor;
}

animate();
function animate(time){
    // generate new traffics
    generateTraffic(viewer.y);

    // updates and find best car
    for(let i = 0; i < traffics.length; i++){
        traffics[i].update(road.borders, [], 0);
    }
    for(let i = 0; i < cars.length; i++){
        cars[i].update(road.borders, traffics, time);
    }
    
    // find best left and right car
    bestLeftCar = cars.reduce((best, current, index) => {
        if(compare(current, best, "left"))
            return current;
        return best;
    }, cars[0]);
    
    bestRightCar = cars.reduce((best, current, index) => {
        if(compare(current, best, "right"))
            return current;
        return best;
    }, cars[0]);

    // find farthest car to watch
    viewer = cars.find(c => c.y == Math.min(...cars.map(c => c.y)));
    
    // draw
    networkCanvas.height = window.innerHeight;
    carCanvas.height = window.innerHeight;
    carCtx.save();
    carCtx.translate(0, -viewer.y + carCanvas.height * 0.75);
    
    road.draw(carCtx);
    for(let i = 0; i < traffics.length; i++){
        traffics[i].draw(carCtx, "red");
    }
    
    carCtx.globalAlpha = 0.2;
    for(let i = 0; i < cars.length; i++){
        cars[i].draw(carCtx);
    }
    carCtx.globalAlpha = 1;
    viewer.draw(carCtx, drawSensor);
    
    carCtx.restore();

    networkCtx.lineDashOffset= -parseInt(time / 50);
    Visualizer.drawNetwork(networkCtx, viewer.brain);

    // reset if all cars are down
    const countStoppedCars = cars.filter(car => car.stop).length;
    if(countStoppedCars == cars.length){
        trials++;
        genCount++;
        save(compare(bestLeftCar, cars[0], "left") ? bestLeftCar : cars[0], "left");
        save(compare(bestRightCar, cars[1], "right") ? bestRightCar : cars[1], "right");
        reset(time);
    }
    
    // display score
    networkCtx.save();
    networkCtx.fillStyle = "white";
    networkCtx.font = "48px serif";
    let text = "Score: " + viewer.number + "        Gen: " + genCount;
    networkCtx.fillText(text, networkCanvas.width / 2, 30);
    networkCtx.restore();
    passCount = viewer.number;

    requestAnimationFrame(animate);
}
