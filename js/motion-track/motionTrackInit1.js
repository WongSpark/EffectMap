let stars = []
let ctx = document.querySelector('#cvs').getContext('2d')

class Star{
    constructor(x, y, vx, vy, r = 4){
        this.x = x || rand(-100, 600)
        this.y = y || -20 * Math.random()
        this.a = 0.01
        this.vx = vx || 2 * Math.random()
        this.vy = vy || 3 * Math.random()
        this.r = r
    }
    move(){
        // this.x += this.vx
        // this.r *= 0.992
        this.y += this.vy
        // if(this.x < 0) this.x = 900
        // if(this.y > 600) {
        //     stars.forEach((star,i) => {
        //         if(star === this){
        //             stars.splice(i,1)
        //             stars.push(new Star())
        //         }
        //     })
        // }
    }
    draw(){
        let {x, y} = this
        ctx.beginPath()
        // var grad=ctx.createRadialGradient(x,y,1,x,y,18)
        // grad.addColorStop(0,"rgb(193,255,255)")
        // grad.addColorStop(1,"rgb(1,1,1)")
        ctx.fillStyle = "red"
        ctx.arc(x,y,this.r,0,2*Math.PI)
        ctx.fill()
        ctx.closePath()

    }
}
function initStars(){
    for (let i = 0; i < 1000; i++) {
        stars.push(new Star(Math.floor(rand(0, 800)), Math.floor(rand(0, 100)), rand(-3, 3), rand(1, 2)))
    }
}
function rand(min, max){
    return min + Math.random() * (max - min)
}
function draw() {
    for(let star of stars){
        star.draw()
        star.move()
    }
    // 这里在不断加半透明蒙层，使上一帧的流星变淡
    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    ctx.rect(0,0,800,600)
    ctx.fill()
    requestAnimationFrame(draw)
}
function main(){
    ctx.fillRect(0,0,800,600)
    initStars()
    draw()
}

main()
