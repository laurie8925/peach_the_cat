const canvas = document.getElementById("game"); 
const ctx = canvas.getContext("2d"); 

const gameSpeedStart = 1; // 1.0 
const gameSpeedIncrement = 0.00001; 

const gameWidth = 800; 
const gameHeight = 250; 

const playerWidth = 114/ 2; //58
const playerHeight = 114/ 2; //62

const maxJumpHeight = gameHeight; 
const minJumpHeight = 150; 

const groundWidth = 2400; 
const groundHeight = 24; 
const groundAndObjectSpeed = 0.5; 

const endGameImgWidth = 474/4; 
const endGameImgHeight=362/4;  

const startGameImgWidth = 309/ 3.5 ; 
const startGameImgHeight= 191 / 3.5;

// const startAudio = new Audio("medias/match-green-tea.mp3");
// const gameAudio = new Audio("medias/pepperono-pizza.mp3")

const OBJECTS_CONFIG = [ 
  {width:90, height: 47 , image:"images/pink_flower.webp" }, 
  {width:90, height: 55, image:"images/brown_bed.webp" }, 
  {width:85, height: 70, image:"images/white_bed.webp" }, 
  {width:326/4, height: 261/4, image:"images/amazon_box.png" }, 
  {width:100/1.3, height: 105/1.3, image:"images/cat_tree.webp"}
]; 

//Game Objects 
let player = null; 
let ground = null; 
let objectsController = null; 
let score = null; 

let scaleRatio = null; 
let previousTime = null; 
let gameSpeed = gameSpeedStart; 
let gameOver = false; 
let hasAddedEventListenersForRestart = false; 
let waitingToStart = true; 

//player 
class Player { 

    WALK_ANIMATION_TIMER = 200; 
    walkAnimationTimer = this.WALK_ANIMATION_TIMER; 
    peachRunImages =[]; 

    jumpPressed = false; 
    jumpInProgress = false; 
    falling = false; 
    JUMP_SPEED = 0.6; 
    GRAVITY = 0.4; 

    constructor(ctx, width, height, minJumpHeight, maxJumpHeight, scaleRatio) {
      this.ctx = ctx;
      this.canvas = ctx.canvas;
      this.width = width;
      this.height = height;
      this.minJumpHeight = minJumpHeight;
      this.maxJumpHeight = maxJumpHeight;
      this.scaleRatio = scaleRatio;

      this.x = 10 * scaleRatio;
      this.y = this.canvas.height - this.height - 1.5 * scaleRatio;
      this.yStandingPosition =  this.y; // wants dino to go back to original y position after jumping  

      this.standingStillImage = new Image();
      this.standingStillImage.src = "images/standing_peach.png";
      this.image = this.standingStillImage;

      const peachRunImage1 = new Image(); 
      peachRunImage1.src = "images/walking_1.png"; 

      const peachRunImage2 = new Image(); 
      peachRunImage2.src = "images/walking_2.png"; 

      const peachRunImage3 = new Image(); 
      peachRunImage2.src = "images/walking_3.png"; 

      this.peachRunImages.push(peachRunImage1); 
      this.peachRunImages.push(peachRunImage2); 
      this.peachRunImages.push(peachRunImage3); 

      //keyboard 
      window.removeEventListener("keydown", this.keydown); 
      window.removeEventListener("keyup", this.keyup); 

      window.addEventListener("keydown", this.keydown); 
      window.addEventListener("keyup", this.keyup); 

      //touch/ tap (mobile)
      window.removeEventListener("touchstart", this.touchstart); 
      window.removeEventListener("touchend", this.touchend);

      window.addEventListener("touchstart", this.touchstart); 
      window.addEventListener("touchend", this.touchend); 
    }

    //Jumps
    touchstart = ()=> { 
      this.jumpPressed = true; 
    }

    touchend = ()=> { 
      this.jumpPressed = false; 
    }

    keydown = (event)=> { 
      if (event.code === "Space") {       
        this.jumpPressed = true; 
      }
    }

    keyup = (event)=> { 
      if (event.code === "Space") { 
        this.jumpPressed = false; 
      }
    }

    update(gameSpeed, frameTimeDelta){ 

      this.run(gameSpeed, frameTimeDelta);

      if(this.jumpInProgress){ 
        this.image = this.standingStillImage; 
      }

      this.jump(frameTimeDelta); 
    }

    jump(frameTimeDelta) { 
      if(this.jumpPressed){ 
        this.jumpInProgress = true; 
      }

      if(this.jumpInProgress && !this.falling){ //if jumping and not falling 
        if (this.y > this.canvas.height - this.minJumpHeight || //check if jumping more than min-height (y > minheight means it's lower on the board cuz 0,0 starts at the top )
          (this.y > this.canvas.height - this.maxJumpHeight && this.jumpPressed)){ //check the player wants to reach the max height and is still holding the space/ tap (still jumping ) 
          this.y -= this.JUMP_SPEED * frameTimeDelta * this.scaleRatio; 
          //decrease the y -> make us go up 
        } else { 
          this.falling = true; 
        }
      }
      else{ 
        if (this.y < this.yStandingPosition){ 
          //still falling
          this.y += this.GRAVITY * frameTimeDelta * this.scaleRatio; 
          //fall at same rate with different screensize 
          if(this.y + this.height > this.canvas.height) { 
            this.y = this.yStandingPosition; 
            //make sure dino don't fall through the ground -> reset to standing position 
          }
        }
        else { 
          this.falling = false; 
          this.jumpInProgress = false; 
        }
      }
    }

    run(gameSpeed, frameTimeDelta) {
        if (this.walkAnimationTimer <= 0) {
          if (this.image === this.peachRunImages[0]) {
            this.image = this.peachRunImages[1];
          } else {
            this.image = this.peachRunImages[0];
          }
          this.walkAnimationTimer = this.WALK_ANIMATION_TIMER;
        }
        this.walkAnimationTimer -= frameTimeDelta * gameSpeed;
      }

    draw() {
        this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height); 
    }
}; 

//Ground 
class Ground { 
    constructor(ctx, width, height, speed, scaleRatio){ 
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.width = width;
        this.height = height;
        this.speed = speed; 
        this.scaleRatio = scaleRatio; 

        this.x = 0; 
        this.y = this.canvas.height - this.height; 

        this.groundImage = new Image(); 
        this.groundImage.src = "images/wooden_floor.png"
    }

    update(gameSpeed, frameTimeDelta){ 
        this.x -= gameSpeed * frameTimeDelta * this.speed * this.scaleRatio;
    }

    draw() {
        this.ctx.drawImage(
          this.groundImage,
          this.x,
          this.y,
          this.width,
          this.height
        );
    
        this.ctx.drawImage(
          this.groundImage,
          this.x + this.width,
          this.y,
          this.width,
          this.height
        );
    
        if (this.x < -this.width) {
          this.x = 0;
        }
      }
    
    reset() { 
      this.x = 0; 
    }
}; 

// Cacti Controller 
class ObjectsController{ 
  OBJECT_INTERVAL_MIN = 500; 
  OBJECT_INTERVAL_MAX = 2000; 
  
  nextObjectInterval = null; 
  objects = []; 

  constructor(ctx, objectsImages, scaleRatio, speed){ 
    this.ctx = ctx; 
    this.canvas = ctx.canvas; 
    this.objectsImages = objectsImages; 
    this.scaleRatio = scaleRatio; 
    this.speed = speed; 
  }

  setNextObjectTime() { 
    const num = this.getRandomNumber(
      this.OBJECT_INTERVAL_MIN, 
      this.OBJECT_INTERVAL_MAX
    );
    
    this.nextObjectInterval = num; 
    console.log(this.nextObjectInterval)
  }

  getRandomNumber(min, max) { 
    return Math.floor(Math.random() * (max - min + 1) + min); 
    //random num inclusive of min and max integer 
  }

  createObject() { 
    const index = this.getRandomNumber(0, this.objectsImages.length - 1);
    const objectImage = this.objectsImages[index];
    const x = this.canvas.width * 1.5;
    //draw off the screen
    const y = this.canvas.height - objectImage.height;
    const object = new Object(
      this.ctx,
      x,
      y,
      objectImage.width,
      objectImage.height,
      objectImage.image
    );

    this.objects.push(object);

  }

  update(gameSpeed, frameTimeDelta) {
    if(this.nextObjectInterval <= 0 ) { 
      //creat cactus 
      this.createObject(); 
      this.setNextObjectTime()
    }

    this.nextObjectInterval -= frameTimeDelta; 

    this.objects.forEach((object) => {
      object.update(this.speed, gameSpeed, frameTimeDelta, this.scaleRatio);
    });

    this.objects = this.objects.filter((object)=> object.x > -object.width); 
  }

  draw() {
    this.objects.forEach((object) => object.draw());
  }

  collideWith(sprite) { 
    //sprite is a general term for player
    return this.objects.some((object)=> object.collideWith(sprite)); 
    //some() returns true if function return true for one of the array element 
    //returns false if the function returns false for all the array element 
    //check if at least one of the cactus is colliding 

    //ask if cactus is colliding with the spirite 
  }

  reset() { 
    this.objects = []; 
  }
}; 

//Cactus 
class Object{ 
  constructor(ctx, x, y, width, height, image){ 
    this.ctx = ctx; 
    this.x = x; 
    this.y = y; 
    this.width = width; 
    this.height = height; 
    this.image = image; 
  }

  update(speed, gameSpeed, frameTimeDelta, scaleRatio) {
    this.x -= speed * gameSpeed * frameTimeDelta * scaleRatio;
  }

  draw() {
    this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  collideWith(sprite) { 
    const adjustByX= 1.3; 
    const adjustByY = 1.2
    //want the objects to overlay a little 
    // 2d collision detection: https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
    if (
      sprite.x < this.x + this.width / adjustByX && 
      sprite.x + sprite.width / adjustByX > this.x && 
      //check if player x is before the obj (x + width) AND passed the obj x 
      sprite.y < this.y + this.height / adjustByY &&
      sprite.height + sprite.y / adjustByY > this.y
      //check if player y is higher than the obj (y + height) AND passed the obj y 
    ) {
      return true;
    } else {
      return false;
    }
  }
}

//Score 
class Score {
  score = 0;
  HIGH_SCORE_KEY = "highScore";

  constructor(ctx, scaleRatio) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.scaleRatio = scaleRatio;
  }

  update(frameTimeDelta) {
    this.score += frameTimeDelta * 0.01;
  }

  reset() {
    this.score = 0;
  }

  setHighScore() {
    const highScore = Number(localStorage.getItem(this.HIGH_SCORE_KEY));
    if (this.score > highScore) {
      localStorage.setItem(this.HIGH_SCORE_KEY, Math.floor(this.score));
    }
  }

  draw() {
    const highScore = Number(localStorage.getItem(this.HIGH_SCORE_KEY));  
    const scorePadded = Math.floor(this.score).toString().padStart(6, 0);
    const highScorePadded = highScore.toString().padStart(6, 0);

    if (gameOver){ 
      const textfontSize = 14 * scaleRatio;
      ctx.font =  `${textfontSize}px Verdana`;
      let highScoreText = `Current high Score: ${highScorePadded}`;
      ctx.fillStyle = "grey";
      const highScoreTextWidth = ctx.measureText(highScoreText).width; 
      const highScoreTextX = canvas.width/2  - highScoreTextWidth/2 ;
      const highScoreTextY = canvas.height / 8; 
      ctx.fillText(highScoreText, highScoreTextX, highScoreTextY );

      let currentScoreText = `Score: ${scorePadded}`
      const currentScoreTextWidth = ctx.measureText(currentScoreText).width; 
      ctx.fillStyle = "red";
      const currentScoreTextX = canvas.width/2  - currentScoreTextWidth/2 ;
      const currentScoreTextY = canvas.height * 5 / 12; 
      ctx.fillText(currentScoreText, currentScoreTextX, currentScoreTextY );

    } 
    else { 
      const y = 20 * this.scaleRatio;

      const fontSize = 20 * this.scaleRatio;
      this.ctx.font = `${fontSize}px serif`;
      this.ctx.fillStyle = "#525250";
      const scoreX = this.canvas.width - 75 * this.scaleRatio;
      const highScoreX = scoreX - 225 * this.scaleRatio;

      this.ctx.fillText(scorePadded, scoreX, y);
      this.ctx.fillText(`High Score: ${highScorePadded}`, highScoreX, y);
    }; 
  }
}; 

//Images 
class gameImg{
  gameImg =[]; 

  constructor(ctx, x, y, width, height, image){ 
    this.ctx = ctx; 
    this.x = x; 
    this.y = y; 
    this.width = width; 
    this.height = height; 
    this.image = image; 

    const endImg = new Image(); 
    img.src = "./images/sleepy_peach.png"; 
    this.gameImg.push(endImg); 

    const startImg = new Image(); 
    img.src = "./images/distracted_peach.webp"; 
    this.gameImg.push(startImg); 
    
  }

  update(frameTimeDelta, scaleRatio) {
    this.x -= frameTimeDelta * scaleRatio;
  }

  draw() {
    this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }
}

function createSprites() { 
    //create ratio of the game off the size of the browser 
    const playerWidthInGame = playerWidth * scaleRatio;
    const playerHeightInGame = playerHeight * scaleRatio;
    const minJumpHeightInGame = minJumpHeight * scaleRatio;
    const maxJumpHeightInGame = maxJumpHeight * scaleRatio;

    const groundWidthInGame = groundWidth * scaleRatio; 
    const groundHeightInGame = groundHeight * scaleRatio; 

    const endGameImgHeightInGame = endGameImgHeight * scaleRatio; 
    const endGameImgWidthInGame = endGameImgWidth * scaleRatio; 

    player = new Player(
        ctx, 
        playerWidthInGame, 
        playerHeightInGame, 
        minJumpHeightInGame, 
        maxJumpHeightInGame, 
        scaleRatio
    ); 

    ground = new Ground(
        ctx,
        groundWidthInGame,
        groundHeightInGame,
        groundAndObjectSpeed,
        scaleRatio
    ); 

    const objectsImages = OBJECTS_CONFIG.map((object) => {
      const image = new Image();
      image.src = object.image;
      return {
        image: image,
        width: object.width * scaleRatio,
        height: object.height * scaleRatio,
      };
    });

    objectsController = new ObjectsController(
      ctx,
      objectsImages, 
      scaleRatio, 
      groundAndObjectSpeed
    );

    score = new Score(ctx, scaleRatio); 

}; 

function setScreen() { 
    scaleRatio = getScaleRatio(); 
    canvas.width = gameWidth * scaleRatio; 
    canvas.height = gameHeight * scaleRatio; 
    createSprites();
}

setScreen(); 


//setTimeout for safari mobile rotation  
window.addEventListener("resize", ()=>setTimeout(setScreen, 500)); 

if (screen.orientation) {
    screen.orientation.addEventListener("change", setScreen);
}

window.addEventListener("DOMContentLoaded", event => {
  const startAudio = document.getElementById("startAudio");
  const gametAudio = document.getElementById("gamneAudio");
  startAudio.volume = 0.5;
});

function getScaleRatio() { // use to make sure our game fit on the screen 
    //find which size is smaller 
    const screenHeight = Math.min (
      window.innerHeight, 
      document.documentElement.clientHeight); 
        
    const screenWidth = Math.min(
      window.innerWidth,
      document.documentElement.clientWidth
  );

    //window is wider than the game width
    if (screenWidth / screenHeight < gameWidth / gameHeight) {
        return screenWidth / gameWidth;
    } else { // window is taller 
        return screenHeight / gameHeight;
    }
}

function updateGameSpeed(frameTimeDelta) { 
  gameSpeed += frameTimeDelta * gameSpeedIncrement; 
}

function clearScreen() { 
  // const background = new Image(); 
  // background.src ="./images/background.png"
  // ctx.drawImage(background,0,0,canvas.width, canvas.height); 
    ctx.fillStyle = "rgba(255, 225, 168)"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height); 
}

function showGameOver() { 
  // scaleRatio = getScaleRatio();
  const headerfontSize = 50 * scaleRatio;
  //text
  score.draw(); 
  ctx.beginPath();
  ctx.font = `${headerfontSize}px Verdana`;
  let header = "Game Over"
  ctx.fillStyle = "grey";
  const headerWidth = ctx.measureText(header).width; 
  const x = canvas.width/2  - headerWidth/2 ;
  const y = canvas.height/3;  // 2;
  ctx.fillText(header, x, y );
  ctx.closePath(); 

  ctx.beginPath();
  const textfontSize = 10 * scaleRatio;
  ctx.font =  `${textfontSize}px Verdana`;
  let text = "Peach got distracted and now it's going to take nap."
  ctx.fillStyle = "grey";
  const textWidth = ctx.measureText(text).width; 
  const textX = canvas.width/2  - textWidth/2 ;
  const textY = canvas.height/2;  
  ctx.fillText(text, textX, textY );
  ctx.closePath(); 

  ctx.beginPath();
  ctx.font =  `${textfontSize}px Verdana`;
  let text2 = "~Goodnight~"
  ctx.fillStyle = "#14697F";
  const text2Width = ctx.measureText(text2).width; 
  const text2X = canvas.width/2  - text2Width/2 ;
  const text2Y = canvas.height * 9 / 16;  // 2 + canvas.height /8; 
  ctx.fillText(text2, text2X, text2Y );
  ctx.closePath(); 

  ctx.beginPath();
  ctx.font =  `${textfontSize}px Verdana`;
  let text3 = "Press Space or Tap to play again! "
  ctx.fillStyle = "red";
  const text3Width = ctx.measureText(text3).width; 
  const text3X = canvas.width/2  - text3Width/2 ;
  const text3Y = canvas.height * 15 / 16;  // 2 + canvas.height /8; 
  ctx.fillText(text3, text3X, text3Y );
  ctx.closePath(); 

  //image
  const gameOverImg = new Image(); 
  gameOverImg.src = "./images/sleepy_peach.png"; 
  const imgX = (canvas.width - endGameImgWidth * scaleRatio) * 0.5; 
  const imgY = canvas.height - endGameImgHeight * 1.15  * scaleRatio ; 

  const endGameImgWidthInGame = endGameImgWidth * scaleRatio; 
  const endGameImgHeightInGame = endGameImgHeight * scaleRatio; 
  ctx.drawImage(gameOverImg, imgX, imgY, endGameImgWidthInGame, endGameImgHeightInGame);
}

function setupGameReset() { 
  if (!hasAddedEventListenersForRestart) {
    hasAddedEventListenersForRestart = true;


    setTimeout(()=>{ // set delay for reset popup 
      window.addEventListener("keyup", reset, {once:true}); 
      window.addEventListener("touchstart", reset, {once:true}); 
    }, 1000); 
  }
}

function reset(){ 
  hasAddedEventListenersForRestart = false; 
  gameOver = false; 
  waitingToStart = false; 
  ground.reset(); 
  objectsController.reset(); 
  score.reset(); 
  gameSpeed = gameSpeedStart; 
}

function showStartGameText() { 
  //text
  const headerfontSize = 30 * scaleRatio;
  ctx.font = `${headerfontSize}px Verdana`;
  let header = "Peach the Cat - Try to not get distracted"
  ctx.fillStyle = "#FFA200";
  const headerWidth = ctx.measureText(header).width; 
  const x = canvas.width/2  - headerWidth/2 ;
  const y = canvas.height/3;  // 2;
  ctx.fillText(header, x, y );

  ctx.beginPath();
  const textfontSize = 10 * scaleRatio;
  ctx.font =  `${textfontSize}px Verdana`;
  let text = "Peach's owner just got home and Peach is on her way to meet her owner... "
  ctx.fillStyle = "grey";
  const textWidth = ctx.measureText(text).width; 
  const textX = canvas.width/2  - textWidth/2 ;
  const textY = canvas.height * 5 /12;  
  ctx.fillText(text, textX, textY );
  ctx.closePath(); 

  
  ctx.beginPath();
  ctx.font =  `${textfontSize}px Verdana`;
  let text2 = "but there are so fun things in it's way to distract her. "
  ctx.fillStyle = "grey";
  const text2Width = ctx.measureText(text2).width; 
  const text2X = canvas.width/2  - text2Width/2 ;
  const text2Y = canvas.height /2;    // 2 + canvas.height /8; 
  ctx.fillText(text2, text2X, text2Y );
  ctx.closePath(); 

  
  ctx.beginPath();
  ctx.font =  `${textfontSize}px Verdana`;
  let text3 = "Avoid as many distractions for as long as possible so Peach can greet her owner!"
  ctx.fillStyle = "#14697F";
  const text3Width = ctx.measureText(text3).width; 
  const text3X = canvas.width/2  - text3Width/2 ;
  const text3Y = canvas.height * 10 / 16;  // 2 + canvas.height /8; 
  ctx.fillText(text3, text3X, text3Y );
  ctx.closePath(); 

  ctx.beginPath();
  ctx.font =  `${textfontSize}px Verdana`;
  let text4 = "Inspired by Neko Atusme: Kitty Collector. "
  ctx.fillStyle = "grey";
  const text4Width = ctx.measureText(text4).width; 
  const text4X = canvas.width/2  - text4Width/2 ;
  const text4Y = canvas.height * 15 / 16;  // 2 + canvas.height /8; 
  ctx.fillText(text4, text4X, text4Y );
  ctx.closePath(); 


  const textStartFont = 14 * scaleRatio;
  ctx.font =  `${textStartFont}px Verdana`;
  let textStart = `Press Space or Tap the screen to start the game!`;
  ctx.fillStyle = "red";
  const textStartWidth = ctx.measureText(textStart).width; 
  const textStartX = canvas.width/2  - textStartWidth/2 ;
  const textStartY = canvas.height / 8; 
  ctx.fillText(textStart, textStartX, textStartY );



  //images 
  const gameOverImg = new Image(); 
  gameOverImg.src = "./images/logo.png"; 
  const imgX = (canvas.width - startGameImgWidth * scaleRatio) * 0.5; 
  const imgY = canvas.height - startGameImgHeight * 1.5  * scaleRatio ; 

  const startGameImgWidthInGame = startGameImgWidth * scaleRatio; 
  const startGameImgHeightInGame = startGameImgHeight * scaleRatio; 
  ctx.drawImage(gameOverImg, imgX, imgY, startGameImgWidthInGame, startGameImgHeightInGame);
  
}

function gameLoop(currentTime) { 
//update the screen
//use current time to check time between frames 
  
    if (previousTime === null) {
      
        previousTime = currentTime;

        //call gameloop over and over
        requestAnimationFrame(gameLoop);
        //passes currenttime in gameloop
        
        return;
      }

    const frameTimeDelta = currentTime - previousTime;
    //frametimedelta is the framerate :D
    previousTime = currentTime;

    clearScreen(); 

      
    if (!gameOver && !waitingToStart) { 
      //Update game objects 
        ground.update(gameSpeed, frameTimeDelta); 
        objectsController.update(gameSpeed, frameTimeDelta); 
        score.update(frameTimeDelta); 
        player.update(gameSpeed, frameTimeDelta); 
        updateGameSpeed(frameTimeDelta); 
    }
   
    if(!gameOver && objectsController.collideWith(player)) { //gameover
      gameOver = true; 
      setupGameReset(); 
      score.setHighScore(); 
    }

    
    // if(gameOver) { 
    //   showGameOver(); 
    // }

    if(waitingToStart) { 
      clearScreen(); 
      showStartGameText(); 
      startAudio.play(); 
    } 
      else if(gameOver){
      gameAudio.pause(); 
      gameAudio.currentTime = 0;
      clearScreen(); 
      showGameOver(); 
      startAudio.play(); 
    } 
      else { 
      startAudio.pause(); 
      startAudio.currentTime = 0;
      ground.draw(); 
      objectsController.draw(); 
      player.draw(); 
      score.draw(); 
      gameAudio.play(); 
    }

    // Draw game objects 
   

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

window.addEventListener("keyup", reset, {once:true}); 
window.addEventListener("touchstart", reset, {once:true}); 

