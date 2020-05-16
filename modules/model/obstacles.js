Pair = require('../pair').Pair;

class Obstacle {


	isBlocked(x, y, radius){
		throw new TypeError('unimplemented abstract method');
	}
}

class CircleObstacle extends Obstacle {
	
	constructor(x,y,r){
		super();
		this.pos = new Pair(x,y);
		this.r = r;
	}

	isBlocked(x,y, radius){
		return this.pos.getDist(new Pair(x,y)) < this.r+radius; 
	}

}

class Storm extends CircleObstacle {

	isBlocked = (x, y, radius) => !super.isBlocked(x,y-radius);
}

class RectangleObstacle extends Obstacle {
	
	constructor(x,y,w,h){
		super();
		this.x1 = x;
		this.x2 = x+w;
		this.y1 = y;
		this.y2 = y+h;
	}

	isBlocked(x, y, radius){
		return this.x1-radius <= x
			&& x <= this.x2+radius
			&& this.y1-radius <= y
			&& y <= this.y2+radius;
	}
}

class MapBoundary extends RectangleObstacle {

	isBlocked = (x, y, radius) => !super.isBlocked(x,y,-radius);
}

module.exports = {
	CircleObstacle: CircleObstacle,
	RectangleObstacle: RectangleObstacle,
	MapBoundary: MapBoundary
};

