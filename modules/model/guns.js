Pair = require('../pair.js').Pair;
Bullet = require('./bullets.js').Bullet;

function rand(n){ return Math.random()*n; }

class Item {

	constructor(stage, name, itemType){
		this.itemType = itemType;
		this.type = name;
		this.stage = stage;
		this.pos = null;
	}

	canPickup = (point) => this.pos != null && this.pos.getDist(point) < 50;
	
	isPickedUp = () => this.pos == null;

	pickup = () => this.pos = null;

	drop = (point) => this.pos = point.getCopy();

	toJSON = () => {
		return {
			'isPickedup': this.isPickedUp(),
			'pos': this.pos,
			'type': this.type
		}
	};
}

class Gun extends Item{

	constructor(stage, name, dmg, fireRate, range, reloadTime, magSize){
		super(stage, name, 'gun');
		this.dmg = dmg;
		this.fireRate = fireRate;
		this.range = range;
		this.reloadTime = reloadTime;
		this.magSize = magSize;
		
		this.bullets = magSize;
		this.barrelLength = 60; // how much the barrel extends
					// from the player in px
		this.lastShot = Date.now() - this.fireRate;
	}

	shootBullet(shooter, origin, point){
		let vel = point.getCopy();
		vel.subtract(origin);
		vel.normalize();

		// add an offset to the origin,
		// so the bullet comes out of the barrel
		let offset = vel.getCopy();
		offset.scale(this.barrelLength);
		
		let pos = origin.getCopy();
		pos.add(offset);
		
		let bullet = new Bullet(
			this.stage,
			shooter,
			pos,
			vel,
			this.dmg,
			this.range
		);
	
		this.stage.addBullet(bullet);
	}

	reload(ammoPouch){
		if (ammoPouch.isEmpty(this.type)) return;

		let newBullets = ammoPouch.getBullets(
			this.type,
			this.magSize - this.bullets
		);

		setTimeout(
			() => this.bullets += newBullets,
			this.reloadTime
		);
	}

	fire(shooter, origin, point){
		if (!this.canFire()) return;

		this.lastShot = Date.now();
		this.shootBullet(shooter, origin, point);
		this.bullets--; 
	}

	canFire = () => Date.now() - this.lastShot >= this.fireRate 
		&& this.bullets > 0;

}

class Scar extends Gun{

	constructor(stage){
		super(stage, 'scar', 36, 1000/5.5, 400, 1800, 30);
	}
}

class Deagle extends Gun{

	constructor(stage){
		super(stage, 'deagle', 78, 1000/0.8, 500, 2000, 7);
	}
}

class Pump extends Gun{

	constructor(stage){
		super(stage, 'pump', 11, 1000/0.7, 200, 3600, 5);
		this.variance = 20;
		this.pellets = 10;
	}

	shootBullet(shooter, origin, point){
		
		for (let i=0; i<this.pellets; i++){	
			let target = new Pair(
				rand(this.variance*2) - this.variance,
				rand(this.variance*2) - this.variance
			);
			target.add(point);
			super.shootBullet(shooter, origin, target);
		}
	}

}

class NoGun extends Gun{

	constructor(stage){ super(stage, 'noGun', 0, 0, 0, 0, 0); }
	canFire = () => false;
}

class Ammo extends Item{
	
	constructor(stage, name, bullets){
		super(stage, name, 'ammo');
		this.bullets = bullets;
	}
	
	isEmpty = () => this.bullets == 0;

	getBullets(bulletsMissing){
		// we may not have enough for a full mag
		let bullets = Math.min(this.bullets, bulletsMissing);
		this.bullets -= bullets;
		return bullets;
	}

	pop(){
		this.stage.removeItem(this);
		return this.bullets;
	}

	consume(otherAmmo){
		this.bullets += otherAmmo.pop();
	}
}

class MediumAmmo extends Ammo{ constructor(stage,bullets){super(stage, 'mediumAmmo', bullets)} }

class HeavyAmmo extends Ammo{ constructor(stage,bullets){super(stage, 'heavyAmmo', bullets)} }

class ShotgunAmmo extends Ammo{ constructor(stage,bullets){super(stage, 'shotgunAmmo', bullets)} }

class AmmoPouch {
	
	constructor(stage){
		this.mediumAmmo = new MediumAmmo(stage, 0);
		this.heavyAmmo = new HeavyAmmo(stage, 0);
		this.shotgunAmmo = new ShotgunAmmo(stage, 0);
		
		this.ammunition = [this.mediumAmmo, this.heavyAmmo, this.shotgunAmmo];
		this.ammunition.forEach((ammo) => stage.addItem(ammo));
	}

	getGunAmmo(gunClass){
		switch (gunClass){
			case 'scar':
				return this.mediumAmmo;
			case 'deagle':
				return this.heavyAmmo;
			case 'pump':
				return this.shotgunAmmo;
			case 'noGun':
				return null;
		}
	}

	getAmmo(ammoClass){
		switch (ammoClass){
			case 'mediumAmmo':
				return this.mediumAmmo;
			case 'heavyAmmo':
				return this.heavyAmmo;
			case 'shotgunAmmo':
				return this.shotgunAmmo;
		}
	}

	addAmmo(otherAmmo){
		this.getAmmo(otherAmmo.type).consume(otherAmmo);
	}

	getBullets(gunClass, magSize){
		return this.getGunAmmo(gunClass).getBullets(magSize);
	}

	drop = (point) => this.ammunition.forEach((ammo)=>{
		if (ammo.bullets > 0){
			ammo.drop(point);
		} else {
			ammo.pop();
		}
	});

	isEmpty = (gunClass) => this.getGunAmmo(gunClass).isEmpty();

}

module.exports = {
	Scar: Scar,
	Deagle: Deagle,
	Pump: Pump,
	NoGun: NoGun,
	MediumAmmo: MediumAmmo,
	HeavyAmmo: HeavyAmmo,
	ShotgunAmmo: ShotgunAmmo,
	Gun: Gun,
	Ammo: Ammo,
	AmmoPouch: AmmoPouch
};

