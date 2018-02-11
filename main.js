window.onload = function(){
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    var W = canvas.width = window.innerWidth;
    var H = canvas.height = window.innerHeight;
    var colors = ["#3fc778","#00a383","#007dc7","#bcb7c5","#ea71bd","#e1534a","#ad3e50","#f29546","#e33247"];
    var link_color = "#6c3b4f";

    class Point{
        constructor(x, y){
            var color_id = Math.floor(Util.random(0, colors.length));
            this.pos = {
                x: x,
                y: y
            };
            this.old_pos = {
                x: x,
                y: y
            };
            this.target = {
                x: W/2,
                y: H/2
            };
            this.radius = Util.random(20, 40);
            this.color = colors[color_id];
            this.linked = false;
            this.connected_to = [];
        }
        draw(){
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2*Math.PI, false);
            ctx.fill();
            ctx.closePath();
        }
        update(){
            var vx = (this.pos.x - this.old_pos.x) * 0.96;
            var vy = (this.pos.y - this.old_pos.y) * 0.96;
            this.old_pos.x = this.pos.x;
            this.old_pos.y = this.pos.y;
            this.pos.x += vx;
            this.pos.y += vy;

            if(!this.linked){
                var angle = Util.angleFrom(this.pos,this.target)
                this.pos.x += Math.cos(angle) * 0.2;
                this.pos.y += Math.sin(angle) * 0.2;
            }

            if(this.pos.x + this.radius > W) {
                this.pos.x = W - this.radius;
                this.old_pos.x = this.pos.x + vx * 0.2;
            }
            else if(this.pos.x < this.radius) {
                this.pos.x = this.radius;
                this.old_pos.x = this.pos.x + vx * 0.2;
            }

            if(this.pos.y + this.radius > H) {
                this.pos.y = H - this.radius;
                this.old_pos.y = this.pos.y + vy * 0.2;
            }
            else if(this.pos.y < this.radius) {
                this.pos.y = this.radius;
                this.old_pos.y = this.pos.y + vy * 0.2;
            }
        }
    }

    class Stick{
        constructor(points, sticks, p0, p1, min_distance){
            this.points = points;
            this.sticks = sticks;
            this.p0 = this.points[p0];
            this.p1 = this.points[p1];
            var distance = Util.distance(this.p0.pos, this.p1.pos);
            this.min_distance = min_distance;
            this.length = Math.max(min_distance,distance) + Util.random(70,80);
            this.maxLength = this.length + 100;
            this.max_link_width = Math.min(this.p0.radius,this.p1.radius);
        }
        update(){
            var dx = this.p1.pos.x - this.p0.pos.x;
            var dy = this.p1.pos.y - this.p0.pos.y;
            var distance = Math.sqrt(dx * dx + dy * dy);
            if(distance  > this.maxLength){
                this.p0.connected_to[this.point_array.indexOf(this.p1)] = false;
                this.p1.connected_to[this.point_array.indexOf(this.p0)] = false;
                this.stick_array.splice(this.stick_array.indexOf(this), 1);
            }
            var difference = this.length - distance,
            percent = difference / distance /60,
            offsetX = dx * percent,
            offsetY = dy * percent;
            this.p0.pos.x -= offsetX;
            this.p0.pos.y -= offsetY;
            this.p1.pos.x += offsetX;
            this.p1.pos.y += offsetY;
        }
        draw(){
            var distance = Util.distance(this.p1.pos,this.p0.pos);
            ctx.lineWidth = Util.map(distance,this.min_distance,this.maxLength,this.max_link_width,0);
            ctx.strokeStyle=link_color;
            ctx.beginPath();
            ctx.moveTo(this.p0.pos.x,this.p0.pos.y);
            ctx.lineTo(this.p1.pos.x,this.p1.pos.y);
            ctx.stroke();
        }
    }

    Util = {};
    Util.random = function(min, max){
        return min + Math.random()*(max-min);
    }
    Util.angleFrom = function(p1, p2){
        return Math.atan2(p2.y - p1.y, p2.x - p1.x);
    }
    Util.distance = function(p1, p2){
        return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }
    Util.map = function(a,b,c,d,e){
        return(a-b)/(c-b)*(e-d)+d;
    }

    class Synapse{
        constructor(){
            this.points = [];
            this.sticks = [];
            this.number_point = 30;
            for (var i = 0; i < this.number_point; i++) {
                this.points.push(new Point(Util.random(0,W),Util.random(0,H)));
            }
        }
        updatePoints(){
            for (var p = this.points.length - 1; p >= 0; p--) {
                this.points[p].update();
                    for (var others = this.points.length - 1; others >= 0; others--) {
                        if(this.points[p] === this.points[others]) continue;
                        var min_distance = this.points[p].radius + this.points[others].radius;
                        if(Util.distance(this.points[p].pos,this.points[others].pos) < min_distance){
                            if(this.points[p].connected_to[others] === true) continue;
                            this.sticks.push(new Stick(this.points,this.sticks,p,others,min_distance));
                            this.points[p].linked = true;
                            this.points[p].connected_to[others] = true;
                        }
                    }
            }
        }
        renderPoints() {
            for (var i = this.points.length - 1; i >= 0; i--) {
                this.points[i].draw();
            }
        }
        renderSticks(){
            for (var i = this.sticks.length - 1; i >= 0; i--) {
                this.sticks[i].draw();
            }
        }
        updateSticks(){
            for (var i = this.sticks.length - 1; i >= 0; i--) {
                this.sticks[i].update();
            }
        }
        update(){
            this.updatePoints();
            this.updateSticks();
        }
        draw(){
            this.renderSticks();
            this.renderPoints();
        }
    }

    var memory_cloud = new Synapse();
    function main_loop() {
    ctx.clearRect(0,0,W,H);
    memory_cloud.update();
    memory_cloud.draw();
    requestAnimationFrame(main_loop);
    }
    main_loop();
}