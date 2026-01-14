class Car {
    constructor(number, x, y, width, height, controlType, time, maxSpeed, color = "red") {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.number = number;
        this.lastTime = time;
        this.totalLeft = 0;
        this.totalRight = 0;

        this.speed = 0;
        this.acceleration = 0.2;
        this.maxSpeed = maxSpeed;
        this.friction = 0.05;
        this.angle = 0;
        this.stop = false;
        this.angleSpeed = 0.03;

        this.useBrain = controlType === "AI";

        if (controlType === "AI") {
            this.sensor = new Sensor(this);
            this.brain = new NeuralNetwork([this.sensor.rayCount, 7, 8, 4]);
        }
        this.controls = new Controls(controlType);

        this.img = new Image();
        this.img.src = "assets/car.png";

        this.mask = document.createElement("canvas");
        this.mask.width = width;
        this.mask.height = height;

        const maskCtx = this.mask.getContext("2d");
        this.img.onload = () => {
            maskCtx.fillStyle = color;
            maskCtx.rect(0, 0, this.width, this.height);
            maskCtx.fill();

            maskCtx.globalCompositeOperation = "destination-atop";
            maskCtx.drawImage(this.img, 0, 0, this.width, this.height);
        };
    }

    #createPolygon() {
        const points = [];
        const rad = Math.hypot(this.width, this.height) / 2;
        const alpha = Math.atan2(this.width, this.height);
        points.push({
            x: this.x - Math.sin(this.angle - alpha) * rad,
            y: this.y - Math.cos(this.angle - alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(this.angle + alpha) * rad,
            y: this.y - Math.cos(this.angle + alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad
        });
        return points;
    }

    #assetDamage(roadBorders, traffic) {
        for (let i = 0; i < roadBorders.length; i++) {
            if (polysIntersect(this.polygon, roadBorders[i])) {
                return true;
            }
        }
        for (let i = 0; i < traffic.length; i++) {
            if (polysIntersect(this.polygon, traffic[i].polygon)) {
                return true;
            }
        }
        return false;
    }

    update(roadBorders, traffics, time) {
        if (this.stop) return;

        if (this.useBrain) { // if the car doesn't pass any traffic after 8s then stop
            for (let i = 0; i < traffics.length; i++) {
                if (this.y < traffics[i].y) {
                    if (this.number < traffics[i].number) {
                        this.number = traffics[i].number;
                        this.lastTime = time;
                    }
                } else {
                    break;
                }
            }
            if (time - this.lastTime >= 10000) {
                this.stop = true;
                return;
            }
        }
        this.#move();
        this.polygon = this.#createPolygon();
        this.stop = this.#assetDamage(roadBorders, traffics);

        if (this.sensor) {
            this.sensor.update(roadBorders, traffics);
            const offsets = this.sensor.readings.map(s => s === null ? 0 : 1 - s.offset);
            const outputs = NeuralNetwork.feedForward(offsets, this.brain);
            if (this.useBrain) {
                this.controls.forward = outputs[0];
                this.controls.left = outputs[1];
                this.controls.right = outputs[2];
                this.controls.backwards = outputs[3];
            }
        }
    }

    #move() {
        // up and down controls
        if (this.controls.forward) {
            this.speed += this.acceleration;
        }
        if (this.controls.backwards) {
            this.speed -= this.acceleration;
        }

        if (this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed;
        }
        if (this.speed < -this.maxSpeed / 1.5) {
            this.speed = -this.maxSpeed / 1.5;
        }

        if (this.speed > 0) {
            this.speed -= this.friction;
        }
        if (this.speed < 0) {
            this.speed += this.friction;
        }
        if (Math.abs(this.speed) < this.friction) {
            this.speed = 0;
        }

        // if the car is moving backwards then flip the left and right controls
        const flip = this.speed >= 0 ? 1 : -1;

        // left and right controls
        if (Math.abs(this.speed) !== 0) {
            if (this.controls.left) {
                this.angle += this.angleSpeed * flip;
                this.totalLeft += this.angleSpeed;
            }
            if (this.controls.right) {
                this.angle -= this.angleSpeed * flip;
                this.totalRight += this.angleSpeed;
            }
        }

        // Adjust the direction when the car is not turning
        if (!this.controls.left && !this.controls.right) {
            if (this.angle > 0) {
                this.angle -= this.angleSpeed;
            }
            if (this.angle < 0) {
                this.angle += this.angleSpeed;
            }
            if (Math.abs(this.angle) < 0.02)
                this.angle = 0;
        }

        this.x -= Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
    }

    draw(ctx, drawSensor = false) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle);

        if (!this.stop) {
            ctx.drawImage(this.mask, -this.width / 2, -this.height / 2, this.width, this.height);
            ctx.globalCompositeOperation = "multiply";
        }
        ctx.drawImage(this.img, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();

        if (this.sensor && drawSensor) {
            this.sensor.draw(ctx);
        }
    }
}