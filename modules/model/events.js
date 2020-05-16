Pair = require('../pair.js').Pair;

// events are appended to an actor's this.events list.
// events are removed once their finish time is up

class Event {
	constructor(name, finishTime) { 
		this.name = name;
		this.finishTime = finishTime;
	}
}

// when an actor is reloading, blocking event for future reloads
class ReloadEvent extends Event{

	constructor(reloadTime) { 
		super('reloadEvent', Date.now() + reloadTime); 
		this.started = this.finishTime - reloadTime; 
		this.reloadTime = reloadTime; 
	}

}

// frame events happen in just one frame, and are removed the next,
// such as shooting or dying
class FrameEvent extends Event{
	constructor(name){ super(name, Date.now()); }
}

// when an actor takes damage, makes actor flash red and displays dmg in view
class HitEvent extends FrameEvent{

	constructor(dmg, isShieldDmg, shooter){ 
		super('hitEvent'); 
		this.dmg = dmg; 
		this.isShieldDmg = isShieldDmg;
		this.shooter = shooter;
	}
}
// when an actor fires, plays sound and draws muzzle flash in view
class FireEvent extends FrameEvent{
	
	constructor(point){ 
		super('fireEvent'); 
		this.point = point; 
	}
}

// when an actor started reloading, plays sound in view
class StartReloadEvent extends FrameEvent{
	
	constructor(gunType) { super('startReloadEvent'); }
}

// when an actor dies, plays sound in view and updates db 
class DeathEvent extends FrameEvent{

	constructor(killer, killed){
		super('deathEvent');
		this.killer = killer;
		this.killed = killed;
	}
}


// when the player presses e and an item is picked up,
// plays sound in view
class PickupItemEvent extends FrameEvent{
	
	constructor(itemClass){
		super('pickupItemEvent');
		this.itemClass = itemClass;
	}
}

// when a player is able to pick up an item, displays text in view
class CanPickupItemEvent extends FrameEvent{ constructor(){super('canPickupItemEvent');} }

module.exports = {
	ReloadEvent: ReloadEvent,
	HitEvent: HitEvent,
	FireEvent: FireEvent,
	StartReloadEvent: StartReloadEvent,
	DeathEvent: DeathEvent,
	PickupItemEvent: PickupItemEvent,
	CanPickupItemEvent: CanPickupItemEvent
};

