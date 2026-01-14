const lerp = (A, B, t) => A + (B - A) * t;

// check if two lines is intersect
const getIntersection = (A, B, C, D) => { 
    const tTop = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
    const uTop = (C.y - A.y) * (A.x - B.x) - (C.x - A.x) * (A.y - B.y);
    const bottom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);
    
    if (bottom !== 0) {
        const t = tTop / bottom;
        const u = uTop / bottom;
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: lerp(A.x, B.x, t),
                y: lerp(A.y, B.y, t),
                offset: t
            };
        }
    }
    return null;
};

// check if two polygons is intersect
const polysIntersect = (poly1, poly2) => {
    for (let i = 0; i < poly1.length; i++) {
        for (let j = 0; j < poly2.length; j++) {
            const touch = getIntersection(
                poly1[i],
                poly1[(i + 1) % poly1.length],
                poly2[j],
                poly2[(j + 1) % poly2.length]
            );
            if (touch) {
                return true;
            }
        }
    }
    return false;
};

const getRGBA = (value) => {
    const alpha = Math.abs(value);
    const R = value < 0 ? 0 : 255;
    const G = R;
    const B = value < 0 ? 255 : 0;
    return `rgba(${R}, ${G}, ${B}, ${alpha})`;
};

const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

const compare = (car1, car2, cmp) => {
    const angle1 = cmp === "left" ? car1.totalLeft : car1.totalRight;
    const angle2 = cmp === "left" ? car2.totalLeft : car2.totalRight;

    if (car1.number > car2.number) {
        return true;
    }
    if (car1.number === car2.number && car1.y < car2.y) {
        return true;
    }
    return false;
};

const save = (bestCar, side) => {
    if (side === "left") {
        localStorage.setItem("bestLeftBrain", JSON.stringify(bestCar.brain));
        localStorage.setItem("bestScore", JSON.stringify(bestCar.number));
    } else {
        localStorage.setItem("bestRightBrain", JSON.stringify(bestCar.brain));
    }
};

const discard = () => {
    localStorage.removeItem("bestLeftBrain");
    localStorage.removeItem("bestRightBrain");
    window.location.reload();
};

const getRandomColor = () => {
    const hue = 60 + Math.random() * 240; 
    return `hsl(${hue}, 100%, 60%)`;
};

const shuffle = (array) => {
    let currentIndex = array.length;
  
    // While there remain elements to shuffle...
    while (currentIndex !== 0) {
  
      // Pick a remaining element...
      const randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
};