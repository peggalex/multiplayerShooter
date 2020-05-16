class Pair {
	constructor(x,y){
		this.x=x; this.y=y;
	}

	toString(){
		return "("+this.x+","+this.y+")";
	}

	normalize(){
		var magnitude=Math.sqrt(this.x*this.x+this.y*this.y);
		this.x=this.x/magnitude;
		this.y=this.y/magnitude;
	}

	scale(a){
		this.x*=a; this.y*=a;
	}

	add(other){
		this.x += other.x; 
		this.y += other.y;
	}

	subtract(other){
		this.x -= other.x;
		this.y -= other.y;
	}

	getAngle(){
		let angle = Math.atan(this.y/this.x);
		return (this.x >= 0) ? angle : Math.PI + angle;
	}

	getCopy = () => new Pair(this.x, this.y);

	getDist(other){
		return Math.sqrt((this.x - other.x)**2 + (this.y - other.y)**2);
	}
}

