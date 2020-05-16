/* 
 * What about serving up static content, kind of like apache? 
 * This time, you are required to present a user and password to the login route
 * before you can read any static content.
 */

var process = require('process');
// run ftd.js as 

// nodejs ftd.js PORT_NUMBER
var port = parseInt(process.argv[2]); 
var express = require('express');
var cookieParser = require('cookie-parser');

var app = express();
app.use(cookieParser()); // parse cookies before processing other middleware

const sqlite3 = require('sqlite3').verbose();

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(express.static('static-content')); 

var db = new sqlite3.Database('db/database.db', (err) => {
	if (err) {
		console.error(err.message);
	}
	console.log('Connected to the database.');
});

// some backend validation
isAlphaNumeric = (str) => RegExp("^[0-9a-zA-Z]+$").test(str);

isColourValid = (colour) => ['coral','violet','cyan','lime','orange','pink','yellow'].some((c)=>c==colour);

isAgeValid = (age) => !isNaN(age) && !age.includes('.') && parseInt(age)>=18;

var id = Math.random().toString(36).substring(2, 15) + 
	Math.random().toString(36).substring(2, 15);

// async func that returns if a username is in the db
isValidUsername = async function(username){
	return new Promise((resolve) => db.get(
		'SELECT username FROM player WHERE username =?;',
		[username], 
		(err, player) => resolve(player != undefined)
	));
}

// async func that returns a user/pass combination exits
isValidAuth = async function(username, password){
	return new Promise((resolve) => db.get(
		'SELECT userpass FROM player WHERE username =?;',
		[username], 
		(err, player) => resolve(
			player != undefined 
			&& player['userpass'] == password
		)	
	));
}

//Delete account API call
app.delete('/AccDelete/:u/password/:p', async function(req,res){
	let username = req.params.u,
		password = req.params.p;

	// input sanitisation
	if (!isAlphaNumeric(req.params.user)
			|| !isAlphaNumeric(req.params.password)){

		res.status(400);
		res.send({'error':'Non alpha-numeric username/password'});
		return;
	}

	// auth
	let validAuth = await isValidAuth(username, password);
	
	if (!validAuth){
		res.status(401);
		res.send({'error':'Invalid username/password'});
		return;
	}

	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// fix this!!!! with promises !!!!!!!!
	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	db.run(
		'DELETE FROM stat WHERE username =?;', 
		[username], 
		(err) => {
			if (err) {
				res.status(500);
				res.send({"error": err.message});
			} 
		}
	);
	db.run(
		'DELETE FROM player WHERE username =?;', 
		[username], 
		(err) => {
			if (err) {
				res.status(500);
				res.send({"error": err.message});
			} 
		}
	);
	res.status(200);
	res.send({});

})

//leaderboard API call
app.get('/score/', async function(req,res){
	
	db.all(
		'SELECT username, kills, deaths, damage FROM stat ORDER BY kills DESC LIMIT 10', 
		[], 
		(err, scores) => {
			if (err) {
				res.status(500);
				res.send({"error": err.message});
			} else { 
				res.status(200);
				res.send(Array.from(scores));
			}
		}
	);
})

// login api
app.get('/login/:u/pass/:p', async function(req, res) {

	let username = req.params.u,
		password = req.params.p;

	// input sanitisation 
	if (!isAlphaNumeric(username)
			|| !isAlphaNumeric(password)){
	
		res.status(400);
		res.send({'error':'Non alpha-numeric username/password'});
		return;
	}
	
	// auth
	let validAuth = await isValidAuth(username, password);
	
	if (!validAuth){
		res.status(401);
		res.send({'error':'Invalid username/password'});
	} else {

		res.cookie("id",id);
		res.status(200);
		res.send({"error":"Loggedin"});
	}
});

// fetch api
app.get('/all/:u/pass/:p', async function(req, res) {
	let username = req.params.u,
		password = req.params.p;

	// input sanitisation
	if (!isAlphaNumeric(req.params.user)
			|| !isAlphaNumeric(req.params.password)){

		res.status(400);
		res.send({'error':'Non alpha-numeric username/password'});
		return;
	}

	// auth
	let validAuth = await isValidAuth(username, password);
	
	if (!validAuth){
		res.status(401);
		res.send({'error':'Invalid username/password'});
		return;
	}

	db.get(
		'SELECT * FROM player WHERE username =?;', 
		[username], 
		(err, player) => {
			if (err) {
				res.status(500);
				res.send({"error": err.message});
			} else {
				res.status(200);
				res.send({
					'password': player['userpass'],
					'age': player['age'],
					'colour': player['colour']
				});
			}
		}
	);
});

// update api
app.put('/update/:u/pass/:p/newPass/:p2/age/:age/colour/:colour', async function(req, res) {

	let username = req.params.u,
		password = req.params.p,
		newPassword = req.params.p2,
		age = req.params.age,
		colour = req.params.colour

	// input sanitisation	
	if (!isAlphaNumeric(req.params.user)
			|| !isAlphaNumeric(req.params.password)){

		res.status(400);
		res.send({'error':'Non alpha-numeric username/password'});
		return;
	}

	// auth	
	let validAuth = await isValidAuth(username, password);
	
	if (!validAuth){
		res.status(401);
		res.send({'error':'Invalid username/password'});
		return;
	}
	
	db.get(
		'UPDATE player SET userpass=?, age=?, colour=? WHERE username =?;', 
		[newPassword, age, colour, username], 
		(err, pass) => {
			if (err) {
				res.status(500);
				res.send({"error": err.message});
			} else {
				res.status(200);
				res.send({});
			}
		}
	)
});


// register api
app.put('/register/:u/pass/:p/age/:age/colour/:colour', async function(req, res) {
	let username = req.params.u,
		password = req.params.p,
		age = req.params.age,
		colour = req.params.colour;

	// backend validation
	if (!isAlphaNumeric(username)
			|| !isAlphaNumeric(password)){
		
		res.status(400);
		res.send({'error':'Non alpha-numeric username/password'});
		return;

	} else if (!isColourValid(colour)) {
		res.status(400);
		res.send({'error':'Invalid colour'});
		return;

	} else if (!isAgeValid(age)) {
		res.status(400);
		res.send({'error':'Invalid age (>18)'});
		return;
	}

	// check if username already exists
	let validUsername = await isValidUsername(username);
	
	if (validUsername){
		res.status(401);
		res.send({'error':'Username taken'});
		return;
	}

	db.run(
		'INSERT INTO player(username, userpass, age, colour) VALUES (?, ?, ?, ?);',
		[username, password, age, colour],
		(err) => {
			if (err) {
				res.status(500);
				res.send({"error": err.message});
			}
		}
	);
	db.run(
		'INSERT INTO stat(username, kills, deaths, damage) VALUES (?, 0, 0, 0);',
		[username],
		(err) => {
			if (err) {
				res.status(500);
				res.send({"error": err.message});
			} else {
				res.status(200);
				res.send({});
			}
		}
	);
});

//This is a checkpoint before allowing access to /zzs
app.use('/', function (req, res,next) {
	//if(req.cookies.id==id){
		next(); // continue processing routes
	//} else {
    //    	res.status(403).send('Not authorized');
	//}
});
// ----------------------------------------------------------------------------------
// END: To restrict access to /
// ----------------------------------------------------------------------------------

app.use('/',express.static('static_files')); // this directory has files to be returned

let obstacles = require('./modules/model/obstacles.js'),
	RectangleObstacle = obstacles.RectangleObstacle,
	CircleObstacle = obstacles.CircleObstacle,
	MapBoundary = obstacles.MapBoundary;

let model = require('./modules/model.js'),
	Stage = model.Stage;

Pair = require('./modules/pair.js').Pair;

global.clients = {
	/*username: {
		'keysPressed': new Set(),
		'clicking': false,
		'clientTop': int,
		'clientLeft': int,
		'clientWidth': int,
		'clientHeight': int,
		'x': 0,
		'y': 0
	}*/
};

//var wsPort = parseInt(process.argv[3]); 
var wsPort = port + 2; 

var WebSocketServer = require('ws').Server,
	wss = new WebSocketServer({port: wsPort});

wss.on('close', function() {
    console.log('disconnected');
});

wss.broadcast = function(msg){
	for (let ws of this.clients){
		ws.send(msg);
	}
}

global.socketToUser = {
	// username: ws
}

wss.on('connection', async function(ws) {	
	console.log('new connection, awaiting username...');
	var username = await new Promise((resolve) => ws.on('message', (username) => resolve(username)));
	console.log('\tusername:', username);
	global.socketToUser[username] = ws;
	ws.on('close', function() {
		if (clients[username] !== undefined){
			stage.removeActor(clients[username].player);
			clients[username] = undefined;
			console.log('user:', username, 'forcefully disconnected.');
		} else {
			console.log('user:', username, 'disconnected.');
		}
	});
});


getColour = async function(username){
	return new Promise((resolve) => db.get(
		'SELECT player.colour FROM player WHERE username =?;', 
		[username], 
		(err, player) => {
			let colour = (err) ? null : player['colour'];
			resolve(colour);
		}
	));
}

getKills = async function(username){
	return new Promise((resolve) => db.get(
		'SELECT stat.kills FROM stat WHERE username =?;', 
		[username], 
		(err, player) => {
			let kills = (err) ? null : player['kills'];
			resolve(kills);
		}
	));
}

app.put('/joinGame/:u/pass/:p/top/:top/left/:left/width/:width/height/:height', async function(req, res) {
	
	let username = req.params.u,
		password = req.params.p,
		top = req.params.top,
		left = req.params.left,
		width = req.params.width,
		height = req.params.height;

	// backend validation
	if (!isAlphaNumeric(username) || !isAlphaNumeric(password)){
		
		res.status(400);
		res.send({'error':'Non alpha-numeric username/password'});
		return;

	}
	// auth	
	let validAuth = await isValidAuth(username, password);
	
	if (!validAuth){
		res.status(401);
		res.send({'error':'Invalid username/password'});
		return;
	}
	
	let colour = await getColour(username);
	if (colour === null){
		res.status(500);
		res.send({'error': 'error retrieving colour'});
	}

	let kills = await getKills(username);
	if (kills === null){
		res.status(500);
		res.send({'error': 'error retrieving kills'});
	}

	player = global.stage.addNewPlayer(username, colour, kills);

	let client = {
		'keysDown': new Set(),
		'clicking': false,
		'canvasTop': top,
		'canvasLeft': left,
		'canvasWidth': width,
		'canvasHeight': height,
		'x':  0,
		'y':  0,
		'player': player
	};

	global.clients[username] = client;

	res.status(200);
	res.send({});

});

app.put('/leaveGame/:u/pass/:p',
		async function(req, res) {
	
	let username = req.params.u,
		password = req.params.p;

	// backend validation
	if (!isAlphaNumeric(username) || !isAlphaNumeric(password)){
		
		res.status(400);
		res.send({'error':'Non alpha-numeric username/password'});
		return;

	}
	// auth	
	let validAuth = await isValidAuth(username, password);
	if (!validAuth){
		res.status(401);
		res.send({'error':'Invalid username/password'});
		return;
	}	
	
	stage.removeActor(clients[username].player);
	clients[username] = undefined;

	res.status(200);
	res.send({});

});

app.get('/isGameStarted', async function(req,res){
	res.status(200);
	res.send({'isGameStarted': global.stage !== undefined});
})

app.put('/startGame/:u/pass/:p/mapBoundaryJSON/:mapBoundary/circleObstacleJSONs/:circles/rectObstacleJSONs/:rects/',
		async function(req, res) {
	
	let username = req.params.u,
		password = req.params.p,
		mapBoundaryJSON = JSON.parse(req.params.mapBoundary),
		circleObstacleJSONs = JSON.parse(req.params.circles),
		rectObstacleJSONs = JSON.parse(req.params.rects);

	// backend validation
	if (!isAlphaNumeric(username) || !isAlphaNumeric(password)){
		
		res.status(400);
		res.send({'error':'Non alpha-numeric username/password'});
		return;

	}
	// auth	
	let validAuth = await isValidAuth(username, password);
	if (!validAuth){
		res.status(401);
		res.send({'error':'Invalid username/password'});
		return;
	}	
	
	let mapBoundary = new MapBoundary(
		mapBoundaryJSON['x'],
		mapBoundaryJSON['y'],
		mapBoundaryJSON['width'],
		mapBoundaryJSON['height']
	);

	let obstacles = [];

	for (circleObstacleJSON of circleObstacleJSONs){
		obstacles.push(new CircleObstacle(
				circleObstacleJSON['x'],
				circleObstacleJSON['y'],
				circleObstacleJSON['r']
			)
		);
	}

	for (rectObstacleJSON of rectObstacleJSONs){
		let rectObstacle = new RectangleObstacle(
			rectObstacleJSON['x'],
			rectObstacleJSON['y'],
			rectObstacleJSON['width'],
			rectObstacleJSON['height'],
		);
		obstacles.push(rectObstacle);
	}

	global.stage = new Stage(mapBoundary, obstacles);

	startGameLoop();

	res.status(200);
	res.send({});

});

function handleKeyPresses(keysDown, client, player){
	
	let moveMap = { 
		'a': { "dx": -1, "dy": 0},
		's': { "dx": 0, "dy": 1},
		'd': { "dx": 1, "dy": 0},
		'w': { "dx": 0, "dy": -1}
	},
		dx = 0,
		dy = 0;

	for (let key of keysDown){
		switch (key) {
			case 'w':
			case 'a':
			case 's':
			case 'd':	
				dx += moveMap[key].dx;
				dy += moveMap[key].dy;
				// we need to recalculate where the player is
				// looking when we move, even if the mouse is stable
				let point = getModelPoint(
					client.x,
					client.y,
					player.pos,
					client.canvasLeft,
					client.canvasTop,
					client.canvasWidth,
					client.canvasHeight
				);
				player.hover(point);	
				break;
			case 'r':
				player.manuallyReload();
				keysDown.delete(key);
				break;
			case 'e':
				player.manuallyPickup();
				keysDown.delete(key);
				break;
		}
	}
	player.move(dx,dy);
}

function handleFiring(clicking, client, player) {
	if (clicking) {
		let point = getModelPoint(
			client.x,
			client.y,
			player.pos,
			client.canvasLeft,
			client.canvasTop,
			client.canvasWidth,
			client.canvasHeight
		);
		player.manuallyFire(point);
	}
}

app.put('/handleMouseHover/:u/pass/:p/x/:x/y/:y',
		async function(req, res) {
	
	let username = req.params.u,
		password = req.params.p,
		x = req.params.x;
		y = req.params.y;

	// backend validation
	if (!isAlphaNumeric(username) || !isAlphaNumeric(password)){
		
		res.status(400);
		res.send({'error':'Non alpha-numeric username/password'});
		return;

	}
	// auth	
	let validAuth = await isValidAuth(username, password);
	if (!validAuth){
		res.status(401);
		res.send({'error':'Invalid username/password'});
		return;
	}
	var client = global.clients[username];
	if (client !== undefined){
		
		client.x = x;
		client.y = y;

		let point = getModelPoint(
			x,
			y,
			client.player.pos,
			client.canvasLeft,
			client.canvasTop,
			client.canvasWidth,
			client.canvasHeight
		);

		client.player.hover(point);	
	}
	res.status(200);
	res.send({});

});

app.put('/handleMouseClick/:u/pass/:p/clicking/:clicking',
		async function(req, res) {
	
	let username = req.params.u,
		password = req.params.p,
		clicking = JSON.parse(req.params.clicking);
			
	// backend validation
	if (!isAlphaNumeric(username) || !isAlphaNumeric(password)){
		
		res.status(400);
		res.send({'error':'Non alpha-numeric username/password'});
		return;

	}
	// auth	
	let validAuth = await isValidAuth(username, password);
	if (!validAuth){
		res.status(401);
		res.send({'error':'Invalid username/password'});
		return;
	}
	global.clients[username].clicking = clicking;
	
	res.status(200);
	res.send({});

});

app.put('/handleKeyPress/:u/pass/:p/key/:key/pressed/:pressed',
		async function(req, res) {
	
	let username = req.params.u,
		password = req.params.p,
		key = req.params.key,
		pressed = JSON.parse(req.params.pressed);
			
	// backend validation
	if (!isAlphaNumeric(username) || !isAlphaNumeric(password)){
		
		res.status(400);
		res.send({'error':'Non alpha-numeric username/password'});
		return;

	}
	// auth	
	let validAuth = await isValidAuth(username, password);
	if (!validAuth){
		res.status(401);
		res.send({'error':'Invalid username/password'});
		return;
	}
	client = global.clients[username];
	if (client !== undefined) {
		if (pressed){
			client.keysDown.add(key);
		} else {
			client.keysDown.delete(key);
		}
	}
	
	res.status(200);
	res.send({});

});

function incrementKills(user){
	db.run(
		'UPDATE stat SET kills=kills+1 WHERE username=?;',
		[user],
		(err) => {
			if (err) {
				console.log({"error": err.message});
			}
		}
	);
	console.log(`incremented ${user}'s kills`);
}
function incrementDeaths(user){
	db.run(
		'UPDATE stat SET deaths=deaths+1 WHERE username=?;',
		[user],
		(err) => {
			if (err) {
				console.log({"error": err.message});
			}
		}
	);
	console.log(`incremented ${user}'s deaths`);
}

function addDamage(user, dmg){
	db.run(
		'UPDATE stat SET damage=damage+? WHERE username=?;',
		[dmg, user],
		(err) => {
			if (err) {
				console.log({"error": err.message});
			}
		}
	);
}

function updateScores(){
	for (let username in global.stage.actors){
		for (let evt of global.stage.actors[username].events){
			
			switch(evt.name){
			
				case 'deathEvent':
					incrementDeaths(evt.killed);
					incrementKills(evt.killer);
					break;

				case 'hitEvent':
					addDamage(
						evt.shooter,
						evt.dmg
					);
					break;
			}
		}
	}
}

getModelPoint = function(x, y, playerPos, left, top, width, height){
	let canvasX = x - left,
		canvasY = y - top;

	let offsetX = width/2 - playerPos.x,
		offsetY = height/2 - playerPos.y;

	return new Pair(
		canvasX - offsetX,
		canvasY - offsetY
	);
}
fps = 60;
interval = 1000/fps;
function startGameLoop(){

	animationFunc = () => {
		// every frame, see which keys are held down
		
		for (let player of global.stage.actors){
			client = global.clients[player.username];
			handleKeyPresses(
				client.keysDown,
				client,
				player
			);
			handleFiring(
				client.clicking,
				client,
				player
			);
		}	

		global.stage.step(Date.now());
		updateScores();

		let stageJSON = global.stage.toJSON();
		stageJSON['server_size'] = wss.clients.size;
		stageJSONStr = JSON.stringify(stageJSON);

		wss.broadcast(stageJSONStr);
	}

	setInterval(animationFunc, interval);
}

app.listen(port, function () {
  console.log('Example app listening on port '+port);
});
