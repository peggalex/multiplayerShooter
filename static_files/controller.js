stage = null;
view = null;

username = "";
password = "";

socket = null;

function setupSocket(){
	window.socket = new WebSocket(`ws://${location.hostname}:${parseInt(location.port)+2}`);
	socket.onopen = function (event) {
		console.log("connected to websocket");
		socket.send(username);
	};
	socket.onclose = function (event) {
		//pass
	};
	socket.onmessage = function (event) {
		window.stage = JSON.parse(event.data);
		if (stage.actors[username] !== undefined) drawMap(stage);
		//console.log(event.data);
	}
}

function removeSocket(){
	socket.close();
	window.socket = null;
}

alertError = (data,_,error) => alert(`${error}: ${data.responseJSON['error']}`);

function setInfo(username, password){
	this.username = username;
	this.password = password;
}

function getUsername(){
	return this.username;
}

function getPassword(){
	return this.password;
}

async function getUserColour(){
	return new Promise((resolve) => {
	
	$.ajax({
		method: "GET", 
		url: `/all/${username}/pass/${password}`
	})
	.done((data) => resolve(data['colour']))
	.fail((data,_,error) => resolve(alertError(data,_,error)));

	});
}

function handleTouchstart(e){
	hovering({
		'x': e.touches[0].clientX,
		'y': e.touches[0].clientY
	});
	handleMousedown();

}

function handleTouchmove(e){
	hovering({
		'x': e.touches[0].clientX,
		'y': e.touches[0].clientY
	});
}

function handleTouchend(e){
	handleMosueup();
}

async function startGame(){

	var isGameStarted = await getIsGameStarted();
	
	if (!isGameStarted) await loadMap();

	await joinGame();
	setupSocket();

	// add keys to keysDown when pressed,
	// and remove them when they are released.
	document.addEventListener('keydown', addKeydown);
	document.addEventListener('keyup', removeKeydown);

	document.addEventListener('mousemove', hovering); 
	document.addEventListener('mousedown', handleMousedown);
	document.addEventListener('mouseup', handleMouseup);

	document.addEventListener('touchstart',handleTouchstart);
	document.addEventListener('touchmove',handleTouchmove);
	document.addEventListener('touchend',handleTouchend);

	$('#upButton').on('touchstart', () => addKeydown({'key': 'w'}));
	$('#leftButton').on('touchstart', () => addKeydown({'key': 'a'}));
	$('#rightButton').on('touchstart', () => addKeydown({'key': 'd'}));
	$('#downButton').on('touchstart', () => addKeydown({'key': 's'}));
	$('#interactButton').on('touchstart', () => { 
		addKeydown({'key': 'r'}); 
		addKeydown({'key': 'e'});
	});

	$('#upButton').on('touchend', () => removeKeydown({'key': 'w'}));
	$('#leftButton').on('touchend', () => removeKeydown({'key': 'a'}));
	$('#rightButton').on('touchend', () => removeKeydown({'key': 'd'}));
	$('#downButton').on('touchend', () => removeKeydown({'key': 's'}));
	$('#interactButton').on('touchend', () => { 
		removeKeydown({'key': 'r'}); 
		removeKeydown({'key': 'e'})
	});

}

async function exitGame(){
	document.removeEventListener('keydown', addKeydown);
	document.removeEventListener('keyup', removeKeydown);

	document.removeEventListener('mousemove', hovering); 
	document.removeEventListener('mousedown', handleMousedown);
	document.removeEventListener('mouseup', handleMouseup);
	
	document.removeEventListener('touchstart',handleTouchstart);
	document.removeEventListener('touchmove',handleTouchmove);
	document.removeEventListener('touchend',handleTouchend);
	
	await new Promise((resolve) => $.ajax({
		method: "PUT", 
		url: `/leaveGame/${username}
			/pass/${password}`
	})
	.done((data) => resolve())
	.fail((data,_,err) => resolve(alertError(data,_,err))));
	
	removeSocket();
}

joinGame = function(){
	let canvas = document.getElementById('stage'),
		canvasBounds = canvas.getBoundingClientRect(),
		top = canvasBounds.top,
		left = canvasBounds.left,
		width = $('#stage').width(),
		height = $('#stage').height()
	return new Promise((resolve) => {

	$.ajax({
		method: "PUT", 
		url: `/joinGame/${username}
			/pass/${password}
			/top/${top}
			/left/${left}
			/width/${width}
			/height/${height}`
	})
	.done((data) => resolve())
	.fail((data,_,err) => resolve(alertError(data,_,err)));

	});
}

svgRectToObstacle = function(r){
	return {
		'x': parseFloat(r.getAttribute('x')),
		'y': parseFloat(r.getAttribute('y')),
		'width': parseFloat(r.getAttribute('width')),
		'height': parseFloat(r.getAttribute('height'))
	};
}

svgCircleToObstacle = function(c){
	return {
		'x': parseFloat(c.getAttribute('cx')),
		'y': parseFloat(c.getAttribute('cy')),
		'r': parseFloat(c.getAttribute('r'))
	};
}

async function getIsGameStarted() {
	return new Promise((resolve) => {
	
	$.ajax({
		method: "GET", 
		url: '/isGameStarted'
	})
	.done((data) => resolve(JSON.parse(data['isGameStarted'])))
	.fail((data,_,error) => resolve(alertError(data,_,error)));
	
	});
}


async function loadMap() {
	return new Promise((resolve)=>{
	
	// load our map svg into the html dom.
	// this way we can access the xml elements like
	// rectangles and circles to create obstacles dynamically

	let svg = document.createElement('object');
	svg.setAttribute('data', '/images/map.svg');
	document.querySelector('body').appendChild(svg);
 
	svg.onload = () => {
		// hide the svg 
		svg.setAttribute('style','display: none;');
		let svgDocument = svg.contentDocument,
			border = svgDocument.querySelector('#border');
	
		let width = parseFloat(border.getAttribute('width')),
			height = parseFloat(border.getAttribute('height'));
		
		// get the map boundary from #border in the svg
		let mapBoundary = {
			'x': 0,
			'y': 0,
			'width': width,
			'height': height
		};
		mapBoundaryJSON = encodeURI(JSON.stringify(mapBoundary));
		let rectObstacles = [];

		// add all rectangles in the svg as obstacles
		// don't count the border
		let rectangles = svgDocument.querySelectorAll('#map rect:not(#border)');
		for (let r of rectangles){
			rectObstacles.push(
				svgRectToObstacle(r)
			);
		}
		let rectObstacleJSONs = encodeURI(JSON.stringify(rectObstacles));

		let circleObstacles = [];
		let circles = svgDocument.querySelectorAll('#map circle');
		for (let c of circles){	
			circleObstacles.push(
				svgCircleToObstacle(c)
			);
		}
		let circleObstacleJSONs = encodeURI(JSON.stringify(circleObstacles));

		console.log('circleObstacleJSONs', circleObstacleJSONs);
		$.ajax({
			method: "put", 
			url: `/startGame/${username}
			/pass/${password}
			/mapBoundaryJSON/${mapBoundaryJSON}
			/circleObstacleJSONs/${circleObstacleJSONs}
			/rectObstacleJSONs/${rectObstacleJSONs}`
		})
		.done(()=>resolve())
		.fail((data,_,err)=>resolve(alertError(data,_,err)));

	}

	});
}

addKeydown = (event) => $.ajax({
	method: "put", 
	url: `/handleKeyPress/${username}
	/pass/${password}
	/key/${event.key}
	/pressed/${true}`
}).fail(alertError);

removeKeydown = (event) => $.ajax({
	method: "put", 
	url: `/handleKeyPress/${username}
	/pass/${password}
	/key/${event.key}
	/pressed/${false}`
}).fail(alertError);


handleMousedown = (e) => $.ajax({
	method: "put", 
	url: `/handleMouseClick/${username}
	/pass/${password}
	/clicking/${true}`
}).fail(alertError);

handleMouseup = (e) => $.ajax({
	method: "put", 
	url: `/handleMouseClick/${username}
	/pass/${password}
	/clicking/${false}`
}).fail(alertError);

lastHover = performance.now();
fps = 60
minInterval = 1000/fps;

function hovering(e){
	if (stage == null) return;
	// mousemove is called very frequently
	// reduce traffic by applying a minimum time between calls
	now = performance.now();
	if (now - lastHover < minInterval) return;
	lastHover = now;

	$.ajax({
		method: "put", 
		url: `/handleMouseHover/${username}
		/pass/${password}
		/x/${e.x}
		/y/${e.y}`
	}).fail(alertError);
}



