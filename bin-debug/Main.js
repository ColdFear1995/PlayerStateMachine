var Main = (function (_super) {
    __extends(Main, _super);
    function Main() {
        _super.call(this);
        this.page1 = new egret.DisplayObjectContainer();
        this.page2 = new egret.DisplayObjectContainer();
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
    }
    var d = __define,c=Main,p=c.prototype;
    p.onAddToStage = function (event) {
        //设置加载进度界面
        //Config to load process interface
        this.loadingView = new LoadingUI();
        this.stage.addChild(this.loadingView);
        //加载人物贴图
        this.load();
        //初始化Resource资源加载库
        //initiate Resource loading library
        RES.addEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.loadConfig("resource/default.res.json", "resource/");
    };
    /**
     * 配置文件加载完成,开始预加载preload资源组。
     * configuration file loading is completed, start to pre-load the preload resource group
     */
    p.onConfigComplete = function (event) {
        RES.removeEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
        RES.addEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);
        RES.loadGroup("preload");
    };
    /**
     * preload资源组加载完成
     * Preload resource group is loaded
     */
    p.onResourceLoadComplete = function (event) {
        if (event.groupName == "preload") {
            this.stage.removeChild(this.loadingView);
            RES.removeEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
            RES.removeEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);
            this.createGameScene();
        }
    };
    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    p.onItemLoadError = function (event) {
        console.warn("Url:" + event.resItem.url + " has failed to load");
    };
    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    p.onResourceLoadError = function (event) {
        //TODO
        console.warn("Group:" + event.groupName + " has failed to load");
        //忽略加载失败的项目
        //Ignore the loading failed projects
        this.onResourceLoadComplete(event);
    };
    /**
     * preload资源组加载进度
     * Loading process of preload resource group
     */
    p.onResourceProgress = function (event) {
        if (event.groupName == "preload") {
            this.loadingView.setProgress(event.itemsLoaded, event.itemsTotal);
        }
    };
    /**
     * 创建游戏场景
     * Create a game scene
     */
    p.createGameScene = function () {
        this.player = new Player(this);
        var stageW = this.stage.stageWidth;
        var stageH = this.stage.stageHeight;
        //this.scrollRect= new egret.Rectangle(0 ,0 , stageW * 3, stageH);
        //有可能使画面显示不完整
        //this.cacheAsBitmap = true;
        this.touchEnabled = true;
        this.addChild(this.page1);
        //this.addChild(this.page2);
        var bg1 = this.createBitmapByName("bg_jpg");
        //var bg2:egret.Bitmap = this.createBitmapByName("bg_jpg");
        this.page1.addChild(bg1);
        //this.page2.x = 640;
        //this.page2.addChild(bg2);
        this.mcDataFactory = new egret.MovieClipDataFactory(this._mcData, this._mcTexture);
        this.role = new egret.MovieClip(this.mcDataFactory.generateMovieClipData("attack"));
        this.mcDataFactory = new egret.MovieClipDataFactory(this._mcData, this._mcTexture);
        this.page1.addChild(this.role);
        this.role.x = 300;
        this.role.y = 500;
        //当抬起接触点时调用
        this.stage.addEventListener(egret.TouchEvent.TOUCH_TAP, function (e) {
            this.player.move(e.stageX, e.stageY);
        }, this);
    };
    /**
     * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
     * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
     */
    p.createBitmapByName = function (name) {
        var result = new egret.Bitmap();
        var texture = RES.getRes(name);
        result.texture = texture;
        return result;
    };
    //加载人物贴图
    p.load = function () {
        var loader = new egret.URLLoader();
        loader.addEventListener(egret.Event.COMPLETE, function loadOver(e) {
            var loader = e.currentTarget;
            this._mcTexture = loader.data;
        }, this);
        loader.dataFormat = egret.URLLoaderDataFormat.TEXTURE;
        var request = new egret.URLRequest("resource/assets/mc/animation.png");
        loader.load(request);
        var loader = new egret.URLLoader();
        loader.addEventListener(egret.Event.COMPLETE, function loadOver(e) {
            var loader = e.currentTarget;
            this._mcData = JSON.parse(loader.data);
        }, this);
        loader.dataFormat = egret.URLLoaderDataFormat.TEXT;
        var request = new egret.URLRequest("resource/assets/mc/animation.json");
        loader.load(request);
    };
    return Main;
}(egret.DisplayObjectContainer));
egret.registerClass(Main,'Main');
var Player = (function () {
    function Player(main) {
        this.main = main;
        this.stateMachine = new StateMachine();
    }
    var d = __define,c=Player,p=c.prototype;
    //判断是否到达目的地
    p.check = function () {
        if (this.main.role.x == this.playerTargetX && this.main.role.y == this.playerTargetY) {
            this.idle();
        }
        else {
            egret.setTimeout(this.check, this, 100);
        }
    };
    p.move = function (targetX, targetY) {
        //将当前状态设置为move
        this.stateMachine.setState(new PlayerMoveState(this));
        this.playerTargetX = targetX;
        this.playerTargetY = targetY;
        this.main.role.gotoAndPlay(1, 3);
        egret.Tween.get(this.main.role).to({ x: this.playerTargetX, y: this.playerTargetY }, 1000, egret.Ease.circIn);
        this.check();
    };
    p.idle = function () {
        //将当前状态设置为idle
        this.stateMachine.setState(new PlayerMoveState(this));
        this.main.role.gotoAndStop(1);
    };
    return Player;
}());
egret.registerClass(Player,'Player');
var StateMachine = (function () {
    function StateMachine() {
    }
    var d = __define,c=StateMachine,p=c.prototype;
    p.setState = function (e) {
        if (this.CurrentState != null) {
            this.CurrentState.onExit();
        }
        this.CurrentState = e;
        e.onEnter();
    };
    return StateMachine;
}());
egret.registerClass(StateMachine,'StateMachine');
var PlayerIdleState = (function () {
    function PlayerIdleState(player) {
        this.player = player;
    }
    var d = __define,c=PlayerIdleState,p=c.prototype;
    p.onEnter = function () {
        this.player.isIdle = true;
        //this.player.idle;
    };
    p.onExit = function () {
        this.player.isIdle = false;
    };
    return PlayerIdleState;
}());
egret.registerClass(PlayerIdleState,'PlayerIdleState',["State"]);
var PlayerMoveState = (function () {
    function PlayerMoveState(player) {
        this.player = player;
    }
    var d = __define,c=PlayerMoveState,p=c.prototype;
    p.onEnter = function () {
        this.player.isMove = true;
        //this.player.move;
    };
    p.onExit = function () {
        this.player.isIdle = false;
    };
    return PlayerMoveState;
}());
egret.registerClass(PlayerMoveState,'PlayerMoveState',["State"]);
//# sourceMappingURL=Main.js.map