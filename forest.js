function $(s) {
    return document.querySelector(s);
}

function Forest(n) {
    this.size = n;
    this.month = 1;
    this.grid = [];
    this.nbear = 0;
    this.nlumberjack = 0;
    this.ntree = 0;
    for (var i = 0; i < n * n; i++) {
        this.grid.push({
            tree: 0,
            bear: 0,
            lumberjack: 0
        });
    }
    this.lumber = 0;
    this.maws = 0;
    for (var i = 0; i < n * n * 0.10; i++) {
        this.add('lumberjack', -1);
    }
    for (var i = 0; i < n * n * 0.50; i++) {
        this.add('tree', 12);
    }
    for (var i = 0; i < n * n * 0.02; i++) {
        this.add('bear', -1);
    }
    this.timer = null;
    this.ctx = $('#map').getContext('2d');
    this.dateDOM = $('#date');
    this.callbacks = [];
}

Forest.DIRECTIONS = [
    {x:  1, y: -1},
    {x:  1, y:  0},
    {x:  1, y:  1},
    {x:  0, y: -1},
    {x:  0, y:  1},
    {x: -1, y: -1},
    {x: -1, y: 0},
    {x: -1, y:  1},
];

Forest.random = function() {
    var i = Math.floor(Math.random() * Forest.DIRECTIONS.length);
    return Forest.DIRECTIONS[i];
};

Forest.prototype.get = function(x, y) {
    var n = this.size;
    return this.grid[((y + n) % n) * n + ((x + n) % n)];
};

Forest.prototype.maw = function(x, y) {
    this.maws++;
    this.get(x, y).lumberjack = 0;
    this.nlumberjack--;
    while (this.nlumberjack < 1) {
        this.add('lumberjack');
    }
    return this;
};

Forest.prototype.stepBear = function(x, y) {
    var cell = this.get(x, y);
    for (var i = 0; i < 5; i++) {
        var dir = Forest.random();
        x = x + dir.x;
        y = y + dir.y;
        var dest = this.get(x, y);
        if (!dest.bear) {
            cell.bear = 0;
            dest.bear = this.month;
            cell = dest;
            if (cell.lumberjack) {
                this.maw(x, y);
            }
        }
    }
    return this;
};

Forest.prototype.stepLumberjack = function(x, y) {
    var cell = this.get(x, y);
    for (var i = 0; i < 3; i++) {
        var dir = Forest.random();
        x = x + dir.x;
        y = y + dir.y;
        var dest = this.get(x, y);
        if (!dest.lumberjack) {
            cell.lumberjack = 0;
            dest.lumberjack = this.month;
            cell = dest;
            if (cell.bear) {
                this.maw(x, y);
                return this;
            } else if (cell.tree >= 12) {
                this.lumber += 1;
                if (cell.tree >= 120) this.lumber += 1;
                cell.tree = 0;
                this.ntree--;
            }
        }
    }
    return this;
};

Forest.prototype.stepTree = function(x, y) {
    var cell = this.get(x, y), _this = this;
    var chance;
    if (cell.tree < 12) {
        chance = 0;
    } else if (cell.tree >= 120) {
        chance = 0.2;
    } else {
        chance = 0.1;
    }
    if (Math.random() < chance) {
        var avail = Forest.DIRECTIONS.filter(function(d) {
            return _this.get(x + d.x, y + d.y).tree == 0;
        });
        if (avail.length > 0) {
            this.ntree++;
            var d = avail[Math.floor(Math.random() * avail.length)];
            this.get(x + d.x, y + d.y).tree = 1;
        }
    }
    cell.tree++;
    return this;
};

Forest.prototype.all = function(type) {
    var all = [];
    for (var y = 0; y < this.size; y++) {
        for (var x = 0; x < this.size; x++) {
            if (this.get(x, y)[type]) {
                all.push({x: x, y: y});
            }
        }
    }
    return all;
};

Forest.prototype.add = function(type, value) {
    value = value || 1;
    while (true) {
        var x = Math.floor(Math.random() * this.size),
            y = Math.floor(Math.random() * this.size),
            cell = this.get(x, y);
        if (!cell[type]) {
            cell[type] = value;
            this['n' + type]++;
            return this;
        }
    }
    return this;
};

Forest.prototype.remove = function(type) {
    var all = this.all(type);
    if (all.length > 0) {
        var p = all[Math.floor(Math.random() * all.length)];
        this.get(p.x, p.y)[type] = 0;
        this['n' + type]--;
    }
    return this;
};

Forest.prototype.stepYear = function() {
    if (this.maws > 0) {
        this.remove('bear');
    } else {
        this.add('bear');
    }
    this.maws = 0;
    var diff = this.lumber - this.nlumberjack;
    if (diff < 0 && this.nlumberjack > 1) {
        this.remove('lumberjack');
    } else {
        var count = Math.ceil(diff / 10);
        while (count-- > 0) this.add('lumberjack');
    }
    this.lumber = 0;
    return this;
};

Forest.prototype.step = function() {
    for (var y = 0; y < this.size; y++) {
        for (var x = 0; x < this.size; x++) {
            var cell = this.get(x, y);
            if (cell.tree > 0) {
                cell.tree++;
            }
            if (cell.bear && cell.bear < this.month) {
                this.stepBear(x, y);
            }
            if (cell.lumberjack && cell.bear < this.month) {
                this.stepLumberjack(x, y);
            }
            if (cell.tree) {
                this.stepTree(x, y);
            }
        }
    }
    if ((this.month % 12) == 0) {
        this.callbacks.forEach(function(c) { c(); });
        this.stepYear();
    }
    this.month++;
    return this;
};

Forest.prototype.date = function() {
    var year = Math.floor((this.month - 1) / 12);
    var month = ((this.month - 1) % 12) + 1;
    return 'Year ' + year + ', Month ' + month;
};

Forest.prototype.draw = function() {
    var ctx = this.ctx,
        s = ctx.canvas.width / this.size;
    for (var y = 0; y < this.size; y++) {
        for (var x = 0; x < this.size; x++) {
            var style = '#bb7',
                cell = this.get(x, y);
            if (cell.lumberjack) {
                style = '#f00';
            } else if (cell.bear) {
                style = '#872';
            } else if (cell.tree >= 120) {
                style = '#0a0';
            } else if (cell.tree >= 12) {
                style = '#0d0';
            } else if (cell.tree > 0) {
                style = '#7f0';
            }
            ctx.fillStyle = style;
            ctx.fillRect(x * s, y * s, s, s);
        }
    }
    this.dateDOM.innerHTML = this.date();
    return this;
};

Forest.prototype.start = function(speed) {
    var _this = this;
    if (this.timer == null) {
        this.timer = setInterval(function() {
            _this.step().draw();
        }, speed || 100);
    }
    return this;
};

Forest.prototype.stop = function() {
    clearInterval(this.timer);
    this.timer = null;
    return this;
};

Forest.prototype.toggle = function() {
    if (this.timer == null) {
        this.start();
    } else {
        this.stop();
    }
    return this;
};
