
//  scramble-text =======================================================================================
// ——————————————————————————————————————————————————
// Помехи
// ——————————————————————————————————————————————————
class TextScramble {
    constructor(el) {
        this.el = el
        this.chars = '!<>-_\\/[]{}—=+*^?#________'
        this.update = this.update.bind(this)
    }
    setText(newText) {
        const oldText = this.el.innerText
        const length = Math.max(oldText.length, newText.length)
        const promise = new Promise((resolve) => this.resolve = resolve)
        this.queue = []
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || ''
            const to = newText[i] || ''
            const start = Math.floor(Math.random() * 40)
            const end = start + Math.floor(Math.random() * 40)
            this.queue.push({ from, to, start, end })
        }
        cancelAnimationFrame(this.frameRequest)
        this.frame = 0
        this.update()
        return promise
    }
    update() {
        let output = ''
        let complete = 0
        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i]
            if (this.frame >= end) {
                complete++
                output += to
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.randomChar()
                    this.queue[i].char = char
                }
                output += '<span class="dud-text">' + char + '</span>'
            } else {
                output += from
            }
        }
        this.el.innerHTML = output
        if (complete === this.queue.length) {
            this.resolve()
        } else {
            this.frameRequest = requestAnimationFrame(this.update)
            this.frame++
        }
    }
    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)]
    }
}
// ——————————————————————————————————————————————————
// Фразы
// ——————————————————————————————————————————————————
const phrases = [
    'Привет!',
    'Это эффект скремблирования',
    'или перемешивание текста',
    'на JavaScript'
]
const el = document.querySelector('.scramble-text')
const fx = new TextScramble(el)
let counter = 0
const next = () => {
    fx.setText(phrases[counter]).then(() => {
        setTimeout(next, 1000)
    })
    counter = (counter + 1) % phrases.length
}
next()

/* ======================================== WIGHT NOISY ============================================== */
let canvas2 = document.getElementById('noisy-canvas'),
    ctx = canvas2.getContext('2d');
function main() {
    window.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();
    render();
}
function getRandom() {
    return Math.random() * 255;
}
function render() {
    let imageData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
        const color = getRandom();
        imageData.data[i] = color;
        imageData.data[i + 1] = color;
        imageData.data[i + 2] = color;
        imageData.data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    requestAnimationFrame(render);
}
function updateCanvasSize() {
    ctx.canvas.height = canvas2.offsetHeight;
    ctx.canvas.width = canvas2.offsetWidth;
}
main();
/* ======================================== WIGHT NOISY ============================================== */

/* ================ РАЗЛЕТАЮЩИЕСЯ ЧАСТИЦЫ ПРИ НАЖАТИИ НА КНОПКУ ========================= */
function pop(e) {
    let amount = 30;
    switch (e.target.dataset.type) {
        case 'shadow':
        case 'line':
            amount = 60;
            break;
    }
    if (e.clientX === 0 && e.clientY === 0) {
        const bbox = e.target.getBoundingClientRect();
        const x = bbox.left + bbox.width / 2;
        const y = bbox.top + bbox.height / 2;
        for (let i = 0; i < 30; i++) {
            createParticle(x, y, e.target.dataset.type);
        }
    } else {
        for (let i = 0; i < amount; i++) {
            createParticle(e.clientX, e.clientY, e.target.dataset.type);
        }
    }
}
function createParticle(x, y, type) {
    const particle = document.createElement('particle');
    document.body.appendChild(particle);
    let width = Math.floor(Math.random() * 30 + 8);
    let height = width;
    let destinationX = (Math.random() - 0.5) * 300;
    let destinationY = (Math.random() - 0.5) * 300;
    let rotation = Math.random() * 520;
    let delay = Math.random() * 200;
    switch (type) {
        case 'square':
            particle.style.background = `hsl(${Math.random() * 50 + 200}, 70%, 60%)`; // Цвет квадратов
            particle.style.border = '1px solid white'; // Бордюр квадратов
            break;
        case 'symbol':
            particle.innerHTML = ['&#9884;', '&#9731;', '&#10084;', '&#10052;', '&#10054;', '&#9733;', '&#9787;'][Math.floor(Math.random() * 7)]; // Символы
            particle.style.color = `hsl(${Math.random() * 50 + 200}, 70%, 60%)`; // Цвет символов
            particle.style.fontSize = `${Math.random() * 24 + 10}px`; // Размер символов
            width = height = 'auto';
            break;
        case 'logo':
            particle.style.backgroundImage = 'url(https://atuin.ru/images/favicon.png)'; // Ссылка на картинку
            break;
        case 'shadow':
            var color = `hsl(${Math.random() * 50 + 200}, 70%, 50%)`; // Цвет 
            particle.style.boxShadow = `0 0 ${Math.floor(Math.random() * 10 + 10)}px ${color}`; // Тень
            particle.style.background = color;
            particle.style.borderRadius = '50%'; // Радиус
            width = height = Math.random() * 5 + 4; // Размеры
            break;
        case 'line':
            particle.style.background = `hsl(${Math.random() * 50 + 200}, 70%, 50%)`; // Цвет линий
            height = 1; // Размер
            rotation += 1000;
            delay = Math.random() * 1000;
            break;
    }
    particle.style.width = `${width}px`;
    particle.style.height = `${height}px`;
    const animation = particle.animate([
        {
            transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(0deg)`,
            opacity: 1
        },
        {
            transform: `translate(-50%, -50%) translate(${x + destinationX}px, ${y + destinationY}px) rotate(${rotation}deg)`,
            opacity: 0
        }
    ], {
        duration: Math.random() * 1000 + 5000, // Продолжительность всех эффектов
        easing: 'cubic-bezier(0, .9, .57, 1)',
        delay: delay
    });
    animation.onfinish = removeParticle;
}
function removeParticle(e) {
    e.srcElement.effect.target.remove();
}
if (document.body.animate) {
    document.querySelectorAll('button').forEach(button => button.addEventListener('click', pop));
}
/* ================ РАЗЛЕТАЮЩИЕСЯ ЧАСТИЦЫ ПРИ НАЖАТИИ НА КНОПКУ ========================= */