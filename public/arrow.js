function vector(x, y){
  this.x = x;
  this.y = y;
  this.rotateByDeg = function(deg) {
    rad = toRadians(deg)
    ca = Math.cos(rad)
    sa = Math.sin(rad)
    this.x = ca*this.x - sa*this.y
    this.y = sa*this.x + ca*this.y
  }
  this.speed = function(){
    return Math.sqrt(Math.pow(this.x, 2)+Math.pow(this.y, 2))
  }
  this.normalise = function(){
    this.x = this.x / this.speed()
    this.y = this.y / this.speed()
  }
}
