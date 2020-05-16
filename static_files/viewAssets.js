const BACKGROUND_IMG = new Image();
BACKGROUND_IMG.src = "images/map.svg";

const PEOPLE_LEFT_ICON = new Image();
PEOPLE_LEFT_ICON.src = "images/peopleLeftIcon.png";

const KILL_ICON = new Image();
KILL_ICON.src = "images/killIcon.png";

const MUZZLE_FLASH_IMG = new Image();
MUZZLE_FLASH_IMG.src = "images/muzzle_flash.png";

const SCAR_IMG = new Image();
SCAR_IMG.src = "images/scar.png";
const SCAR_ICON = new Image();
SCAR_ICON.src = "images/scarIcon.png";

const DEAGLE_IMG = new Image();
DEAGLE_IMG.src = "images/deagle.png";
const DEAGLE_ICON = new Image();
DEAGLE_ICON.src = "images/deagleIcon.png";

const PUMP_IMG = new Image();
PUMP_IMG.src = "images/pump.png";
const PUMP_ICON = new Image();
PUMP_ICON.src = "images/pumpIcon.png";

const SCAR_SOUND = new Audio("sounds/scarShot.mp3");
const SCAR_RELOAD_SOUND = new Audio("sounds/scarReload.mp3");
const SCAR_EQUIP_SOUND = new Audio("sounds/scarEquip.mp3");

const DEAGLE_SOUND = new Audio("sounds/deagleShot.mp3");
const DEAGLE_RELOAD_SOUND = new Audio("sounds/deagleReload.mp3");
const DEAGLE_EQUIP_SOUND = new Audio("sounds/deagleEquip.mp3");

const PUMP_SOUND = new Audio("sounds/pumpShot.mp3");
const PUMP_RELOAD_SOUND = new Audio("sounds/pumpReload.mp3");
const PUMP_EQUIP_SOUND = new Audio("sounds/pumpEquip.mp3");

const MEDIUM_AMMO_IMG = new Image();
MEDIUM_AMMO_IMG.src = "images/mediumAmmo.png";
const MEDIUM_AMMO_PICKUP_SOUND = new Audio("sounds/mediumAmmoPickup.mp3");

const HEAVY_AMMO_IMG = new Image();
HEAVY_AMMO_IMG.src = "images/heavyAmmo.png";
const HEAVY_AMMO_PICKUP_SOUND = new Audio("sounds/heavyAmmoPickup.mp3");

const SHOTGUN_AMMO_IMG = new Image();
SHOTGUN_AMMO_IMG.src = "images/shotgunAmmo.png";
const SHOTGUN_AMMO_PICKUP_SOUND = new Audio("sounds/shotgunAmmoPickup.mp3");

const DEATH_SOUND = new Audio("sounds/kill.mp3");

[	SCAR_SOUND,
	SCAR_RELOAD_SOUND,
	DEAGLE_SOUND,
	DEAGLE_RELOAD_SOUND,
	PUMP_SOUND,
	PUMP_RELOAD_SOUND,
	DEATH_SOUND
].forEach((audio) => {
	audio.volume = 0.5;
	audio.preload = 'auto';
});
	

class ItemView {
	constructor(img, pickupSound){
		this.img = img;
		this.pickupSound = pickupSound;
	}

	draw(context, point){
		let offset = new Pair(
			-this.img.width/2,
			-this.img.height/2
		);
		context.drawImage(
			this.img,
			point.x + offset.x,
			point.y + offset.y
		)
	}

	playPickupSound = () => playAudio(this.pickupSound);

	static getItemView(itemClass){
		switch (itemClass){
			case 'noGun':
				return NOGUN;
			case 'scar':
				return SCAR;
			case 'deagle':
				return DEAGLE;
			case 'pump':
				return PUMP;
			case 'mediumAmmo':
				return MEDIUM_AMMO;
			case 'heavyAmmo':
				return HEAVY_AMMO;
			case 'shotgunAmmo':
				return SHOTGUN_AMMO;
			default:
				throw TypeError(`invalid item class ${itemClass}`);
		}
	}
	
};


class GunView extends ItemView{
	
	constructor(img, icon, fireSound, reloadSound, equipSound){
		super(img, equipSound);
		this.icon = icon;
		this.fireSound = fireSound;
		this.reloadSound = reloadSound;
		this.equipSound = equipSound;
	}

	playReloadSound = () => playAudio(this.reloadSound);

	fire = (context, angle, point) => {	
		context.save();
		
		context.translate(point.x, point.y);
		context.rotate(angle);
		context.drawImage(MUZZLE_FLASH_IMG, 60, -10);
		
		context.restore();
		playAudio(this.fireSound);
	}

	drawGun(context, angle, point, isReloading){
		context.save();
		
		context.translate(point.x, point.y);
		let isLeft = Math.PI*0.5 < angle && angle <Math.PI*1.5;
		let rotateAngle = angle;

		if (isReloading){
			rotateAngle = (isLeft) ? Math.PI*0.75 : Math.PI*0.25;
		}
		context.rotate(rotateAngle);

		// if we're in quadrants 2 or 3, flip image
		if (isLeft) {
			context.scale(1,-1);
		}

		context.drawImage(
			this.img,
			-30,
			-10
		);
		
		context.restore();	
	}
}

// maybe later noGun will look like fists or a pickaxe,
// so it's a placeholder rather than an exception
const NOGUN = new GunView();
NOGUN.draw = (context, point) => {}
NOGUN.playPickupSound = () => {}

const SCAR = new GunView(
	SCAR_IMG,
	SCAR_ICON,
	SCAR_SOUND,
	SCAR_RELOAD_SOUND,
	SCAR_EQUIP_SOUND
);

const DEAGLE = new GunView(
	DEAGLE_IMG,
	DEAGLE_ICON,
	DEAGLE_SOUND,
	DEAGLE_RELOAD_SOUND,
	DEAGLE_EQUIP_SOUND
);
const PUMP = new GunView(
	PUMP_IMG,
	PUMP_ICON,
	PUMP_SOUND,
	PUMP_RELOAD_SOUND,
	PUMP_EQUIP_SOUND
);

const MEDIUM_AMMO = new ItemView(
	MEDIUM_AMMO_IMG,
	MEDIUM_AMMO_PICKUP_SOUND
);

const HEAVY_AMMO = new ItemView(
	HEAVY_AMMO_IMG,
	HEAVY_AMMO_PICKUP_SOUND
);

const SHOTGUN_AMMO = new ItemView(
	SHOTGUN_AMMO_IMG,
	SHOTGUN_AMMO_PICKUP_SOUND
);
