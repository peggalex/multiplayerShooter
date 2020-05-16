Ball = require('./balls.js').Ball;

let pair = require('../pair.js'),
	Pair = pair.Pair;

class Bullet extends Ball {

	constructor(stage, shooter, pos, vel, dmg, range){
		super(stage, pos, 'rgb(0,0,0)', 3);
		this.shooter = shooter;
		this.vel = vel;
		this.dmg = dmg;
		this.range = range;
		this.origin = pos.getCopy();

		let speed = 0.5;
		vel.scale(speed);
		this.lastUpdate = Date.now();
	}
	
	handleHit(){	
		let actorHit = this.stage.getActor(this.pos, this.radius);
	
		if (actorHit !== null){
			actorHit.takeDamage(this.shooter, this.dmg);
			this.stage.removeBullet(this);
		}
	}

	move(timeElapsed){
		let vel = this.vel.getCopy();
		// scale velocity based on last update
		vel.scale(timeElapsed);

		this.pos.add(vel);

		// if the new position is blocked, destory bullet
		if (this.stage.isBlocked(this.pos, this.radius) 
				|| this.pos.getDist(this.origin) > this.range){

			this.stage.removeBullet(this);	
		}
	}

	step(time){
		super.step(time);
		
		let timeElapsed = (time - this.lastUpdate);
		this.lastUpdate = time;

		this.move(timeElapsed);
		this.handleHit();
	}
}

module.exports = {
	Bullet: Bullet
};
