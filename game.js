
window.onload = () => {

    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        scene: [Game, GameEnded],
        backgroundColor: 0x222222
    };
    const game = new Phaser.Game(config);
}



class Game extends Phaser.Scene {
    constructor() {

        super('Game');

        this.sizeOfField = 5;
        this.offsetCenter = [230, 132];
        this.firstSprite = null;
        this.zoom = 0;

        this.field = []; //поле
        this.groupField = []; //все спрайты на поле
        this.filled = 0; //кол-во заполненных ячеек

        this.botNextMove = { x: -1, y: -1 }; //ход бота
        this.playerTurn = true;

        this.centralSprite = null;

    }






    preload() {
        this.load.image('field', 'Assets/Sprites/soccet.png');

        this.load.spritesheet('circle',
            'Assets/Sprites/circle_spritesheet.png',
            { frameWidth: 64, frameHeight: 64 }
        );

        this.load.spritesheet('cross',
            'Assets/Sprites/cross_spritesheet.png',
            { frameWidth: 64, frameHeight: 64 }
        );


    }



    create() {

        this.field = this.initField();

        this.createField(this.sizeOfField, this.offsetCenter);
        let mainCamera = this.cameras.main.setSize(800, 600).setName('mainCamera');

        this.cameras.main.setBounds(-1024, -1024, 1024 * 2, 1024 * 2);
        mainCamera.setBackgroundColor(4349639);


        this.anims.create({
            key: 'createdCircle',
            frames: this.anims.generateFrameNumbers('circle', { start: 0, end: 5 }),
            frameRate: 20,
            repeat: 0
        });

        this.anims.create({
            key: 'createdCross',
            frames: this.anims.generateFrameNumbers('cross', { start: 0, end: 5 }),
            frameRate: 20,
            repeat: 0
        });


    }

    //Строим поле из массива
    createField(size = 5, offsetCenter = [0, 0]) {


        this.groupField.forEach(el => el.destroy());

        for (let i = 0; i < this.field.length; i++) {

            for (let n = 0; n < this.field.length; n++) {

                if (this.field[n][i] !== 0) {
                    if (this.field[n][i] === 1) {
                        let spr = this.add.sprite(i * 64 + offsetCenter[0], n * 64 + offsetCenter[1], 'cross', 4).setOrigin(0);
                        this.groupField.push(spr);
                    } else if (this.field[n][i] === 2) {
                        let spr = this.add.sprite(i * 64 + offsetCenter[0], n * 64 + offsetCenter[1], 'circle', 5).setOrigin(0);
                        this.groupField.push(spr);
                    }
                }

                let sprite = this.add.sprite(i * 64 + offsetCenter[0], n * 64 + offsetCenter[1], 'field').setOrigin(0);


                if (n === 0 && i === 0) {
                    this.zoom++;
                    this.firstSprite = sprite;

                } else if (n === this.sizeOfField && i === this.sizeOfField) {
                    this.centralSprite = sprite;
                    this.setCamera();
                }

                sprite.setInteractive();
                sprite.depth = -1;

                sprite.on('pointerdown', () => this.setPlayerMove(sprite, [i, n]), this);
                this.groupField.push(sprite);
            }
        }


    }

    setCamera() {
        let zoom = this.zoom;

        switch (zoom) {
            case 1: {
                this.cameras.main.setZoom(1);
                this.cameras.main.centerOn(this.centralSprite.x - 64, this.centralSprite.y - 64);
                break;
            }
            case 2: {
                this.cameras.main.setZoom(0.9);
                this.cameras.main.centerOn(this.centralSprite.x - 64, this.centralSprite.y - 64);
                break;
            }
            case 3: {

                this.cameras.main.setZoom(0.65);
                this.cameras.main.centerOn(this.centralSprite.x - 128, this.centralSprite.y - 128);
                break;
            }
            case 4: {
                this.cameras.main.setZoom(0.65);
                this.cameras.main.centerOn(this.centralSprite.x - 128, this.centralSprite.y - 270);
                break;
            }
            default: {
                this.cameras.main.setZoom(1);
                this.cameras.main.centerOn(this.centralSprite.x, this.centralSprite.y);
            }
        }
    }

    //Строим начальный массив поля
    initField() {

        let field = [];

        for (let i = 0; i < this.sizeOfField; i++) {

            field[i] = [];

            for (let n = 0; n < this.sizeOfField; n++) {
                field[i][n] = 0;
            }
        }
        return field;

    }





    //Расширяем поле добавляя в массив элементы и перестраивая поле
    extendFied(add = 3) {

        if (this.filled > (Math.pow(this.sizeOfField, 2) * 0.6)) {

            let tmp;

            for (let j = 0; j < add; j++) {
                tmp = [];
                for (let t = 0; t < this.sizeOfField; t++) {
                    tmp.push(0);
                }
                this.field.unshift(tmp);
            }

            this.field.forEach(el => {
                el.push(0);
                el.push(0);
                el.unshift(0);
            });

            this.createField();

            this.sizeOfField += add;
            this.offsetCenter[0] = this.firstSprite.x;
            this.offsetCenter[1] = this.firstSprite.y;


        }


    }


    setPlayerMove(gameObject, pos) {

        if (!this.playerTurn) return;

        if (typeof gameObject !== 'object') return;

        if (this.field[pos[1]][pos[0]] === 0) {
            this.field[pos[1]][pos[0]] = 1;

            let sprite = this.add.sprite(gameObject.x, gameObject.y, 'cross', 4).setOrigin(0);

            sprite.anims.load('createdCross');
            sprite.anims.play('createdCross');

            this.groupField.push(sprite);
            this.filled++;
            this.extendFied();


            this.isWin(pos[1], pos[0], 'player');

            this.setBotMove();
        }

    }




    setBotMove() {

        let posX = -1;
        let posY = -1;


        if (this.botNextMove.x > -1) {
            posX = this.botNextMove.x;
            posY = this.botNextMove.y;
        }


        const getRandomPosition = () => {

            let x = this.getRandomInt(this.sizeOfField);
            let y = this.getRandomInt(this.sizeOfField);

            if (this.field[x][y] === 0) {
                posX = x;
                posY = y;
            } else {
                getRandomPosition();
            }

        }

        if (posX === -1) {
            getRandomPosition();
        }

        const placeSymbol = () => {

            if (this.field[posY] && this.field[posY][posX] === 0) {

                let sprite = this.add.sprite((posX * 64) + this.offsetCenter[0], (posY * 64) + this.offsetCenter[1], 'createdCircle').setOrigin(0);

                sprite.anims.load('createdCircle');
                sprite.anims.play('createdCircle');

                this.field[posY][posX] = 2;
                this.filled++;
                this.groupField.push(sprite);

                this.isWin(posY, posX, 'computer');

                this.botNextMove = {};
                this.playerTurn = true;

            } else {
                this.setBotMove();
            }

        }

        placeSymbol();

    }

    isWin(x, y, mover) {

        let symbol = this.getSymbol(y, x);

        if (!symbol) return false;


        const checkLine = (x, y, dx, dy, symbol, mover) => {

            let sx = x - dx;
            let sy = y - dy;

            x = +x;
            y = +y;

            let score = 0;

            while (this.getSymbol(x - dx, y - dy) == symbol) {
                x -= dx;
                y -= dy;
            }

            while (this.getSymbol(x, y) == symbol) {
                x += dx;
                y += dy;
                score++;

                //Записываем ход который помешает игроку
                if (score >= 3 && !this.botNextMove.x) {
                    if (this.field[y] && this.field[y][x] === 0) {
                        this.botNextMove.x = x;
                        this.botNextMove.y = y;
                    } else if (this.field[sy] && this.field[sy][sx] === 0) {
                        this.botNextMove.x = sx;
                        this.botNextMove.y = sy;
                    }
                }
            }

            if (score >= 5) {
                this.game.scene.remove('GameEnded');
                this.game.scene.add('GameEnded', GameEnded);
                this.scene.start('GameEnded', { id: 1, winner: mover });
            }

        }


        let res;

        res = res || checkLine(y, x, 1, 0, symbol, mover);
        res = res || checkLine(y, x, 0, 1, symbol, mover);
        res = res || checkLine(y, x, 1, 1, symbol, mover);
        res = res || checkLine(y, x, 1, -1, symbol, mover);

        return res;




    }





    getSymbol(y, x) {
        return this.field[x] && this.field[x][y] ? this.field[x][y] : false;
    }

    getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }


}



class GameEnded extends Phaser.Scene {

    constructor() {
        super('GameEnded');
        this.info = null;
    }


    init(data) {
        this.info = data;
    }

    preload() {

        this.load.image('field', 'Assets/Sprites/soccet.png');


        this.load.spritesheet('buttonAgain',
            'Assets/Sprites/button_repeat.png',
            { frameWidth: 400, frameHeight: 80 }
        );

        this.load.spritesheet('particles',
            'Assets/Sprites/paticles_spritesheet.png',
            { frameWidth: 16, frameHeight: 20 }
        );

    }

    create() {


        if (this.info.winner == 'player') {

            const particles = this.add.particles('particles');

            const emitter = particles.createEmitter({
                x: -10,
                y: 610,
                angle: { min: 280, max: 360 },
                speed: 350,
                gravityY: 150,
                tint: [0xffff00, 0xff0000, 0x00ff00, 0x0000ff],
                lifespan: 6000,
                quantity: 10,
                scale: { start: 0.3, end: 1.2 },
                blendMode: 'ADD'
            });

            const emitter2 = particles.createEmitter({
                x: 400,
                y: -10,
                angle: { min: 0, max: -180 },
                speed: 90,
                gravityY: 40,
                tint: [0xffff00, 0xff0000, 0x00ff00, 0x0000ff],
                lifespan: 6000,
                quantity: 20,
                scale: { start: 0.4, end: 1 },
                blendMode: 'ADD'
            });

            const emitter3 = particles.createEmitter({
                x: 400,
                y: 610,
                angle: { min: 180, max: 360 },
                speed: 450,
                gravityY: 150,
                tint: [0xffff00, 0xff0000, 0x00ff00, 0x0000ff],
                lifespan: 6000,
                quantity: 10,
                scale: { start: 0.4, end: 1.2 },
                blendMode: 'ADD'
            });

            const emitter4 = particles.createEmitter({
                x: 600,
                y: 610,
                angle: { min: 180, max: 360 },
                speed: 450,
                gravityY: 100,
                tint: [0xffff00, 0xff0000, 0x00ff00, 0x0000ff],
                lifespan: 6000,
                quantity: 10,
                scale: { start: 0.4, end: 1.2 },
                blendMode: 'ADD'
            });




            setTimeout(() => {
                emitter.stop();
                emitter2.stop();
                emitter3.stop();
                emitter4.stop();
            }, 500);

            this.add.text(245, 150, 'ПОБЕДА!', { fontFamily: 'Microsoft YaHei UI, "Goudy Bookletter 1911", Times, serif', fontSize: '70px' });

        } else {

            this.add.text(200, 150, 'ИИ Победил', { fontFamily: 'Microsoft YaHei UI, "Goudy Bookletter 1911", Times, serif', fontSize: '70px' });

        }

        let buttonRepeat = this.add.sprite(400, 450, 'buttonAgain');
        buttonRepeat.setInteractive();


        let mainCamera = this.cameras.main.setSize(800, 600).setName('mainCamera');
        mainCamera.setBackgroundColor(4349639);


        buttonRepeat.on('pointerover', () => buttonRepeat.setTexture('buttonAgain', 1));
        buttonRepeat.on('pointerout', () => buttonRepeat.setTexture('buttonAgain', 0));

        buttonRepeat.on('pointerdown', () => {

            this.game.scene.remove('Game');
            this.game.scene.add('Game', Game, true);
            this.scene.start('Game');

        });




    }

}


