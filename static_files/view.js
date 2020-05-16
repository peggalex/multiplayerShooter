// this module accesses a lot of files from viewAssets.js

playAudio = function(audio){
	try {
		audio.cloneNode('true').play();
	} catch (err) {
		console.log('cant play audio on this browser');
	}
}

drawRect = function(context,x,y,w,h,colour){
	context.fillStyle = colour;
	context.beginPath();
	context.rect(x,y,w,h);
	context.fill();
}

drawText = function(context,text,x,y,colour){
	context.fillStyle = colour;
	context.fillText(text,x,y);
}
var canvas,
	canvasWidth,
	canvasHeight,
	context;

setCanvas = function(canvas){
	window.canvas = canvas;
	window.canvasWidth = $('#stage').width();
	window.canvasHeight = $('#stage').height();
	/*window.canvasWidth = 1200;
	window.canvasHeight = 500;*/
	document.querySelector('#stage').width = canvasWidth;
	document.querySelector('#stage').height = canvasHeight;
	window.context = canvas.getContext('2d');
}

drawMap = function(stage){
	if (canvas === undefined) return;
	context.clearRect(0, 0, canvasWidth, canvasHeight);
	context.font = "bold 12px Arial";
	
	let player = stage.actors[username];

	// draw everything with an offset
	let offset = new Pair(
		canvasWidth/2-player.pos.x,
		canvasHeight/2-player.pos.y
	);

	// draw the text with an offset
	let ballRadius = 30;
	let textOffset = Math.sqrt((ballRadius**2)/2);

	drawRect(
		context,
		0,
		0,
		canvasWidth,
		canvasHeight,
		'#22B573'
	);
	// draw background image
	context.drawImage(
		BACKGROUND_IMG,
		offset.x,
		offset.y
	);
	
	// draw the bullets
	for (let bullet of stage.bullets){
		drawBullet(context, bullet, offset);
	}

	// draw the items (guns and ammo)
	for (let item of stage.items){
		if (item.isPickedup) continue;	
		let pos = new Pair(item.pos.x, item.pos.y);
			pos.add(offset);
			
		ItemView.getItemView(item.type).draw(context, pos);
	}
	
	// draw the actors (players & NPC's)
	for (let username in stage.actors){
		let actor = stage.actors[username];
		drawActor(context, actor, offset, textOffset);
	}

	// draw the GUI (minimap, health, inventory)
	drawGUI(
		context,  
		player, 
		stage.width, 
		stage.height, 
		stage.server_size
	);

	if (player.hp <= 0){
		context.font = "bold 36px Arial";
		drawRect(
			context,
			0,
			0,
			canvasWidth,
			canvasHeight,
			'rgba(0,0,0,0.5)'
		);
		drawText(
			context,
			'You died.',
			canvasWidth/2-100,
			canvasHeight/2,
			'white'
		);
	}
}

drawMinimap = function(context, player, width, height, server_size){	
	
	context.save();
	
	scale = 0.1;
	len = stage.width*scale;
	topLeft = new Pair(
		canvasWidth-len-20,
		20
	);

	minimapOffset = new Pair(
		(stage.width-player.pos.x),
		(stage.height-player.pos.y)
	);
	minimapOffset.scale(scale);
	
	context.fillStyle = '#22B573';
	context.beginPath();
	context.rect(
		topLeft.x,
		topLeft.y,
		len,
		len
	);

	context.fill()
	context.stroke();
	context.clip();
	
	context.translate(
		topLeft.x + len/2, 
		topLeft.y + len/2
	);
	context.drawImage(
		BACKGROUND_IMG,
		-len + minimapOffset.x,
		-len + minimapOffset.y,
 		len,
		len
	);
	
	context.restore();
	
	context.drawImage(
		KILL_ICON,
		topLeft.x + len/3 - 12,
		topLeft.y + len + 6,
		28,
		28
	);

	context.font = "bold 24px Arial";

	drawText(context,
		`${player.kills}`, 
		topLeft.x + len/3 + KILL_ICON.width - 12, 
		topLeft.y + len + 28, 
		'white'
	);
	
	context.drawImage(
		PEOPLE_LEFT_ICON,
		topLeft.x + len*2/3 - 12,
		topLeft.y + len + 6
	)
	
	drawText(context,
		`${server_size}`, 
		topLeft.x + len*2/3 + PEOPLE_LEFT_ICON.width - 10, 
		topLeft.y + len + 28, 
		'white'
	);
	
	context.font = "bold 12px Arial";
}

drawInventory = function(context, player){

	let itemOffsetX = 15,
		itemSize = 64,
		x = canvasWidth - itemSize - itemOffsetX,
		y = canvasHeight*0.75 - itemSize
	
	context.strokeStyle = 'white';
	drawRect(
		context, 
		x,
		y,
		itemSize,
		itemSize,
		'rgba(255,255,255,0.5)'
	);
	context.stroke();

	gunView = ItemView.getItemView(player.gunType);
	
	
	if (gunView == NOGUN) return;
	context.drawImage(
		gunView.icon,
		x,
		y
	);
	let gunBullets = player.currentAmmo,
		totalAmmo = player.totalAmmo;
	drawText(
		context,
		`${gunBullets}/${totalAmmo}`,
		x + 32,
		y + 55,
		'white'
	);
}

drawGUI = function(context, player, width, height, server_size){

	// for health bar and shield bar
	drawBar = function(val, colour, offset){

		let textOffsetX = 10,
			textOffsetY = 14,
			totalOffset = 22;

		let barHeight = 20,
			fullBarLen = 600,
			barX = canvasWidth/2 - fullBarLen/2;
			barY = canvasHeight*3/4 + offset,
			barLen = fullBarLen * (val/100);

		drawRect(context, barX, barY, fullBarLen, barHeight, 'rgb(50,50,50)');
		drawRect(context, barX, barY, barLen, barHeight, colour);
		
		drawText(
			context,
			`${val}`, 
			barX + textOffsetX, 
			barY + textOffsetY,
			'white' 
		);

		drawText(
			context,
			'/100',
			barX + textOffsetX + totalOffset,
			barY + textOffsetY,
			'rgba(255,255,255,0.8)'
		);
	}

	drawBar(player.shield, 'cyan', 0);
	drawBar(player.hp, 'lime', 25);


	context.textAlign = 'center';
	drawText(
		context,
		username,
		canvasWidth/2,
		canvasHeight/2 - 35,
		'white'
	);
	context.textAlign = 'start';

	drawMinimap(context, player, width, height, server_size);
	
	drawInventory(context, player);
}


drawBullet = function(context, ball, offset){
	
	context.fillStyle = ball.colour;
	context.beginPath(); 	
	context.arc(
		ball.pos.x + offset.x,
		ball.pos.y + offset.y,
		ball.radius, 
		0, 2 * Math.PI, 
		false
	); 
	context.fill();
}

drawActor = function(context, ball, offset, textOffset){
	let canvasPos = new Pair(ball.pos.x, ball.pos.y);
	canvasPos.add(offset);

	gun = ItemView.getItemView(ball.gunType);
	let damage = 0,
		isShieldDmg = false,
		isReloading = false;

	for (let evt of ball.events){	
		switch (evt.name){

			case 'hitEvent':
				isHit = true;
				damage += evt.dmg;
				isShieldDmg = isShieldDmg || evt.isShieldDmg;
				break;

			case 'fireEvent':
				gun.fire(context, ball.angleFacing, canvasPos);
				break;

			case 'startReloadEvent':
				gun.playReloadSound();
				break;

			case 'reloadEvent':
				isReloading = true;
				context.fillStyle = 'white';
				context.fillText(
					'Reloading', 
					canvasPos.x + textOffset, 
					canvasPos.y - textOffset
				);
				break;

			case 'canPickupItemEvent':
				context.fillStyle = 'white';
				context.fillText(
					'Press E', 
					canvasPos.x + 40 + textOffset, 
					canvasPos.y - textOffset
				);
				break;
			
			case 'pickupItemEvent':
				let itemClass = evt.itemClass;
				ItemView.getItemView(itemClass).playPickupSound();
				break;

			case 'deathEvent':
				playAudio(DEATH_SOUND);
				break;
		}
	}

	if (damage>0) {
		context.fillStyle = (isShieldDmg) ? 'cyan' : 'white';
		context.fillText(
			`${damage}`, 
			canvasPos.x + textOffset, 
			canvasPos.y - textOffset
		);
	}

	context.fillStyle = (damage>0) ? 'red' :  ball.colour;
	context.beginPath(); 	
	context.arc(
		canvasPos.x,
		canvasPos.y,
		ball.radius, 
		0,
		2 * Math.PI, 
		false
	); 
	context.fill();
	
	if (gun == NOGUN) return;
	gun.drawGun(
		context, 
		ball.angleFacing, 
		canvasPos,
		isReloading
	);
}


