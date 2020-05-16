Ball = require('./balls.js').Ball;

let pair = require('../pair.js'),
	Pair = pair.Pair;

function rand(n){ return Math.random()*n; }

let guns = require('./guns.js'),
	Gun = guns.Gun;
	Ammo = guns.Ammo;
	AmmoPouch = guns.AmmoPouch;

let events = require('./events.js'),
	ReloadEvent = events.ReloadEvent,
	HitEvent = events.HitEvent,
	FireEvent = events.FireEvent,
	StartReloadEvent = events.StartReloadEvent,
	DeathEvent = events.DeathEvent,
	PickupItemEvent = events.PickupItemEvent,
	CanPickupItemEvent = events.CanPickupItemEvent;


class Actor extends Ball {

	constructor(stage, username, position, colour, hp, shield, gun, kills=0){
		super(stage, position, colour, 25);
		this.username = username;
		this.shield = shield;
		this.hp = hp;
		this.gun = gun;
	
		this.kills = kills;
		this.ammoPouch = new AmmoPouch(stage);
		this.angleFacing = 0; // radians
	}

	step(time){
		super.step(time);
		if (this.hp <= 0) this.die();
	}

	die(){
		this.stage.removeActor(this);
		this.gun.drop(this.pos);
		this.ammoPouch.drop(this.pos);
	}

	takeDamage(shooter, dmg){
		let isShieldDmg = this.shield > 0,
			shield = this.shield;
		
		this.shield = Math.max(shield - dmg, 0);
		
		let healthDmg = Math.max(dmg - shield, 0);
		this.hp = Math.max(this.hp - healthDmg, 0);

		this.events.push(new HitEvent(dmg, isShieldDmg, shooter.username));
		if (this.hp == 0) {
			this.events.push(new DeathEvent(shooter.username, this.username));
			shooter.kills++;
		}
	}

	fire(point){

		if (this.gun.canFire() && !this.isReloading()){

			this.gun.fire(this, this.pos, point);
			this.events.push(new FireEvent(point));
		}
	}
	
	isReloading = () => this.events.some((evt) => evt.name == 'reloadEvent');

	reload(){
		// if the gun is full,
		// or we're out of bullets,
		// or we're already reloading - return
		if (this.gun.bullets == this.gun.magSize
				|| this.ammoPouch.isEmpty(this.gun.type)
				|| this.isReloading()) return;

		this.gun.reload(this.ammoPouch);

		this.events.push(new StartReloadEvent(this));
		this.events.push(new ReloadEvent(this.gun.reloadTime));
	}

	pickupItem(item){
		if (!item.canPickup(this.pos)) return;	
		
		item.pickup();
		this.events.push(new PickupItemEvent(item.type));

		if (item.itemType == 'gun'){
			this.gun.drop(this.pos);
			this.gun = item;

		} else if (item.itemType == 'ammo'){
			this.ammoPouch.addAmmo(item);
		}
	}

	toJSON(){
		let json = super.toJSON();
		json['hp'] = this.hp;
		json['shield'] = this.shield;
		json['gunType'] = this.gun.type;
		json['angleFacing'] = this.angleFacing;
		return json;
	}
	
}
class Player extends Actor {

	constructor(stage, username, position, colour, gun, kills){
		super(stage, username, position, colour, 100, 100, gun, kills);
		this.speed = 2;

		// list for asynchronous events that happen 
		// outside the game loop, like shooting
		this.asyncEvents = [];
	}

	die() {
		super.die();
		stage.gameOver = true;
	}

	move(dx, dy){
		let vel = new Pair(dx,dy);
		// scale with speed
		vel.scale(this.speed);

		// add the velocity to our new position
		let newPos = this.pos.getCopy();
		newPos.add(vel);

		if (!this.stage.isBlocked(newPos, this.radius)){
			this.pos.x = newPos.x;
			this.pos.y = newPos.y;
		}
	}

	manuallyFire(point){
		this.asyncEvents.push(new FireEvent(point));
	}

	manuallyReload(){
		this.asyncEvents.push(new ReloadEvent(this.gun.reloadTime));
	}

	manuallyPickup(){
		this.asyncEvents.push(new PickupItemEvent());
	}

	hover(point){
		point.subtract(this.pos);
		this.angleFacing = point.getAngle();
	}

	step(time){
		super.step(time);
		for (let evt of this.asyncEvents){
			switch (evt.name){

				case 'fireEvent':
					this.fire(evt.point);
					break;

				case 'reloadEvent':
					this.reload();
					break;

				case 'pickupItemEvent':
					let item = this.checkItems();
					if (item !== null){
						this.pickupItem(item);
					}
			}

		}
		// once the queued events have fired,
		// empty the asyncEvents so that they only run once.
		this.asyncEvents = [];
		
		if (this.checkItems() !== null) this.events.push(new CanPickupItemEvent());
	}

	checkItems(){
		for (let item of this.stage.items){
			if (item.canPickup(this.pos)) return item;
		}
		return null;
	}

	toJSON(){
		let json = super.toJSON();
		let gun = this.gun;
		json['kills'] = this.kills;
		json['currentAmmo'] = gun.bullets;
		json['totalAmmo'] = (gun.type == 'noGun') ? 0 : this.ammoPouch.getGunAmmo(gun.type).bullets;
		return json;
	}

}


module.exports = {
	Player: Player,
};

