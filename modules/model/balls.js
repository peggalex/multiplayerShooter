let pair = require('../pair.js'),
	Pair = pair.Pair;

function rand(n){ return Math.random()*n; }

let events = require('./events.js'),
	ReloadEvent = events.ReloadEvent,
	HitEvent = events.HitEvent,
	FireEvent = events.FireEvent,
	StartReloadEvent = events.StartReloadEvent,
	DeathEvent = events.DeathEvent,
	PickupItemEvent = events.PickupItemEvent,
	CanPickupItemEvent = events.CanPickupItemEvent;

class Ball {
	constructor(stage, pos, colour, radius){
		this.stage = stage;
		this.pos = pos;
		this.colour = colour;
		this.radius = radius;
		this.events = [];
	}

	step(time){
		this.clearEvents(); // every step, reset events
	}

	clearEvents(){
		let now = Date.now();
		this.events = this.events.filter((evt) => evt.finishTime > now);
	}

	toJSON(){
		let json = {
			'pos': this.pos,
			'colour': this.colour,
			'radius': this.radius,
			'events': []
		}
		this.events.forEach((e) => {
			let eJSON = JSON.parse(JSON.stringify(e));
			json.events.push(eJSON);
		});
		return json;
	}
	
}
NPC_no = 1;

module.exports = {
	Ball: Ball
};

