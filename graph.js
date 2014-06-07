function Graph(forest) {
    var _this = this;
    this.forest = forest;
    this.ctx = $('#graph').getContext('2d');
    forest.callbacks.push(function() {
        _this.step().draw();
    });
    this.ntree = [];
    this.nbear = [];
    this.nlumberjack = [];
    this.max = 0;
    this.draw();
}

Graph.prototype.record = function(name) {
    var value = this.forest[name] ;
    this[name].push(value);
    if (value > this.max) {
        this.max = value;
    }
    var maxname = 'max' + name, minname = 'min' + name;
    if (this[maxname] == null || this[maxname] < value) {
        this[maxname] = value;
    }
    if (this[minname] == null || this[minname] > value) {
        this[minname] = value;
    }
};

Graph.prototype.step = function() {
    var forest = this.forest;
    this.record('ntree');
    this.record('nbear');
    this.record('nlumberjack');
    return this;
};

Graph.prototype.plot = function(ys, ymax) {
    var ctx = this.ctx, w = ctx.canvas.width, h = ctx.canvas.height,
        sx = w / ys.length, sy = h / ymax;
    ctx.beginPath();
    ctx.moveTo(0, h - ys[0] * sy);
    for (var x = 1; x < ys.length; x++) {
        ctx.lineTo(x * sx, h - ys[x] * sy);
    }
    ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.arc((ys.length - 1) * sx, h - ys[ys.length - 1] * sy, 3,
            0, Math.PI * 2);
    ctx.fill();
};

Graph.prototype.draw = function() {
    var ctx = this.ctx, w = ctx.canvas.width, h = ctx.canvas.height;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#f00';
    this.plot(this.nlumberjack, this.maxnlumberjack);
    ctx.strokeStyle = '#872';
    this.plot(this.nbear, this.maxnbear);
    ctx.strokeStyle = '#0d0';
    this.plot(this.ntree, this.maxntree);
    return this;
};
