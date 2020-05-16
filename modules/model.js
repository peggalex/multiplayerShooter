let pair = require('./pair.js'),
	Pair = pair.Pair;

Player = require('./model/actors.js').Player;

let gun = require('./model/guns.js'),
	Scar = gun.Scar,
	Deagle = gun.Deagle,
	Pump = gun.Pump,
	NoGun = gun.NoGun,
	MediumAmmo = gun.MediumAmmo,
	HeavyAmmo = gun.HeavyAmmo,
	ShotgunAmmo = gun.ShotgunAmmo,
	AmmoPouch = gun.AmmoPouch;

function randint(n){ return Math.round(Math.random()*n); }
function rand(n){ return Math.random()*n; }

function arrayRemove(array, element){

	let index = array.indexOf(element);
	if(index!=-1) array.splice(index,1);
}

class Stage {
	constructor(mapBoundary, obstacles){
		this.mapBounday = mapBoundary;
		this.width = mapBoundary.x2;
		this.height = mapBoundary.y2;
		
		this.obstacles = [mapBoundary, ...obstacles];
		this.bullets = [];
		this.items = [];
		this.actors = [];
		this.gameOver = false;

		this.initMap();
	}

	addNewPlayer(username, colour, kills){
		let newPlayer = new Player(
			this,
			username,
			this.getRandomSpot(), 
			colour,
			new NoGun(),
			kills
		);
		this.addActor(newPlayer);
		return newPlayer;
	}

	initMap(){
		let guns = [Scar, Deagle, Pump];
		let colours = ['coral','violet','cyan','lime','orange','pink','yellow'];
		
		for (let i=0; i<16; i++){
			let gun_i = Math.floor(rand(guns.length)),
				gun = new guns[gun_i](this);
			this.addItem(gun);
			gun.pos = this.getRandomSpot();
		}
		
		for (let i=0; i<32; i++){
			let ammunition = [
				new MediumAmmo(this, 15),
				new HeavyAmmo(this, 7),
				new ShotgunAmmo(this, 5)
			],
				ammo_i = Math.floor(rand(guns.length)),
				ammo = ammunition[ammo_i];
			this.addItem(ammo);
			ammo.pos = this.getRandomSpot();
		}

	}
	
	getRandomSpot(){
		let pos = new Pair(
			randint(this.width), 
			randint(this.height)
		);
		while (this.isBlocked(pos, 30)){	
			pos = new Pair(
				randint(this.width), 
				randint(this.height)
			);
		}
		return pos;
	}

	step(time){
		let steppables = [...this.actors, ...this.bullets];

		for (let steppable of steppables){
			steppable.step(time);
		}

	}
	
	getActor(point, radius=0){
		for (let actor of this.actors){

			if (actor.pos.getDist(point) <= actor.radius + radius){
				return actor;
			}
		}
		return null;
	}

	isBlocked(point, radius){
		for (let obstacle of this.obstacles){
			
			if (obstacle.isBlocked(point.x, point.y, radius)){
				return true;
			}
		}
		return false;
	}

	addActor = (actor) => this.actors.push(actor);
	
	removeActor = (actor) => arrayRemove(this.actors, actor);

	
	addBullet = (bullet) => this.bullets.push(bullet);

	removeBullet = (bullet) => arrayRemove(this.bullets, bullet);

		
	addItem = (item) => this.items.push(item);

	removeItem = (item) => arrayRemove(this.items, item);

	toJSON(){
		let json = {
			'items': [],
			'bullets': [],
			'actors': {},
			'width': this.width,
			'height': this.height
		};

		this.items.forEach((item) => json['items'].push(item.toJSON()));
		this.bullets.forEach((bullet) => json['bullets'].push(bullet.toJSON()));
		this.actors.forEach((actor) => json['actors'][actor.username] = actor.toJSON());

		return json;
	}
}

module.exports = {
	Stage: Stage,
	rand: rand
};
