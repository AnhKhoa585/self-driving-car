class NeuralNetwork{
    constructor(neuronCounts){
        this.levels = [];
        for(let i = 0; i < neuronCounts.length - 1; i++){
            this.levels.push(new Level(neuronCounts[i], neuronCounts[i + 1]));
        }
    }

    static feedForward(inputs, network){
        let outputs = Level.feedForward(inputs, network.levels[0]);

        for(let i = 1; i < network.levels.length; i++){
            outputs = Level.feedForward(outputs, network.levels[i]);
        }

        for(let i = 0; i < outputs.length; i++){
            outputs[i] = outputs[i] <= 0 ? 0 : 1;
        }
        return outputs;
    }

    static mutate(network, amount = 0.1){
        network.levels.forEach(level => {
            for(let i = 0;i < level.biases.length; i++){
                level.biases[i]=lerp(
                    level.biases[i],
                    Math.random() * 2 - 1,
                    amount
                )
            }
            for(let i = 0;i < level.weights.length; i++){
                for(let j = 0;j < level.weights[i].length; j++){
                    level.weights[i][j] = lerp(
                        level.weights[i][j],
                        Math.random() * 2 - 1,
                        amount
                    )
                }
            }
        });
    }

    static crossover(childNetwork, networkA, networkB) {
        for (let i = 0; i < networkA.levels.length; i++) {
            const levelA = networkA.levels[i];
            const levelB = networkB.levels[i];
            const childLevel = childNetwork.levels[i];
            

            // Crossover biases
            for (let j = 0; j < levelA.biases.length; j++) {
                childLevel.biases[j] = Math.random() < 0.5 ? levelA.biases[j] : levelB.biases[j];
            }

            // Crossover weights
            for (let j = 0; j < levelA.weights.length; j++) {
                for (let k = 0; k < levelA.weights[j].length; k++) {
                    childLevel.weights[j][k] = Math.random() < 0.5 ? levelA.weights[j][k] : levelB.weights[j][k];
                }
            }
        }
    }
}

class Level{
    constructor(inputCount, outputCount){
        this.inputs = new Array(inputCount);
        this.outputs = new Array(outputCount);
        this.biases = new Array(outputCount);

        this.weights = [];
        for(let i = 0; i < inputCount; i++){
            this.weights[i] = new Array(outputCount);
        }

        Level.#randomize(this);
    }

    static #randomize(level){
        for(let i = 0; i < level.inputs.length; i++){
            for(let j = 0; j < level.outputs.length; j++){
                level.weights[i][j] = Math.random() * 2 - 1;
            }
        } 

        for(let i = 0; i < level.biases.length; i++)
            level.biases[i] = Math.random() * 2 - 1;
    }

    static activation(x){
        return Math.tanh(x);
    }

    static feedForward(inputs, level){
        for(let i = 0; i < level.inputs.length; i++){
            level.inputs[i] = inputs[i];
        }
        
        // matrix multiplication
        for(let i = 0; i < level.outputs.length; i++){
            let sum = 0;
            for(let j = 0; j < level.inputs.length; j++){
                sum += level.inputs[j] * level.weights[j][i];
            }
            level.outputs[i] = Level.activation(sum + level.biases[i]);
        }
        return level.outputs;
    }
}