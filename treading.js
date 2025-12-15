const canvas = document.getElementById("chart");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 100;

let balance = 10000;
let price = 100;
let candles = [];
let activeBets = [];
let yOffset = 0;
let targetOffset = 0;

const BET_DURATION = 10;
const scale = 3; 
const candleWidth = 12;
const gap = 3;

// Плавность линий ставок
const lineAlpha = 0.6;

// Загрузка сохранённых данных
function loadData() {
    const savedBalance = localStorage.getItem("balance");
    const savedCandles = localStorage.getItem("candles");
    const savedBets = localStorage.getItem("activeBets");
    const savedPrice = localStorage.getItem("price");

    if(savedBalance) balance = parseFloat(savedBalance);
    if(savedCandles) candles = JSON.parse(savedCandles);
    if(savedBets) activeBets = JSON.parse(savedBets);
    if(savedPrice) price = parseFloat(savedPrice);
}

// Сохранение всех данных
function saveData() {
    localStorage.setItem("balance", balance);
    localStorage.setItem("candles", JSON.stringify(candles));
    localStorage.setItem("activeBets", JSON.stringify(activeBets));
    localStorage.setItem("price", price);
}

// Создание новой свечи
function createCandle() {
    let open = price;
    let close = open + (Math.random() - 0.5) * 20;
    let high = Math.max(open, close) + Math.random() * 8;
    let low = Math.min(open, close) - Math.random() * 8;
    price = close;
    candles.push({ open, close, high, low });
    if (candles.length > 80) candles.shift();
    saveData();
}

// Рисуем график и линии ставок
function drawChart() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2;

    let prices = candles.map(c => [c.high, c.low]).flat();
    let minPrice = Math.min(...prices);
    let maxPrice = Math.max(...prices);

    const upperLimit = 50;
    const lowerLimit = canvas.height - 50;

    let maxY = canvas.height - maxPrice * scale + yOffset;
    let minY = canvas.height - minPrice * scale + yOffset;

    // Плавное смещение графика
    if(maxY < upperLimit) targetOffset += upperLimit - maxY;
    else if(minY > lowerLimit) targetOffset -= minY - lowerLimit;
    else targetOffset = 0;

    yOffset += (targetOffset - yOffset) * 0.08; // плавнее

    // Рисуем свечи
    candles.forEach((c, i) => {
        const x = centerX + (i - candles.length + 1) * (candleWidth + gap);
        const yOpen = canvas.height - c.open * scale + yOffset;
        const yClose = canvas.height - c.close * scale + yOffset;
        const yHigh = canvas.height - c.high * scale + yOffset;
        const yLow = canvas.height - c.low * scale + yOffset;

        ctx.strokeStyle = "#94a3b8";
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, yHigh);
        ctx.lineTo(x + candleWidth / 2, yLow);
        ctx.stroke();

        ctx.fillStyle = c.close >= c.open ? "#22c55e" : "#ef4444";
        ctx.fillRect(x, Math.min(yOpen, yClose), candleWidth, Math.abs(yOpen - yClose));
    });

    // линии ставок с плавностью (альфа)
    activeBets.forEach(bet => {
        ctx.strokeStyle = bet.type === "buy" ? `rgba(0,255,0,${lineAlpha})` : `rgba(255,0,0,${lineAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        let currentY = canvas.height - bet.price * scale + yOffset;
        ctx.moveTo(0, currentY);
        ctx.lineTo(canvas.width, currentY);
        ctx.stroke();
    });

    document.getElementById("price").innerText = price.toFixed(2);
    document.getElementById("balance").innerText = balance.toFixed(2);
}

// Автоматическая ставка по текущей цене
function autoBet(type) {
    const betPrice = price;
    if(balance < betPrice) return;
    balance -= betPrice;

    const bet = {
        type: type,
        price: betPrice,
        timeLeft: BET_DURATION
    };

    activeBets.push(bet);
    saveData();

    const interval = setInterval(() => {
        bet.timeLeft--;
        if(bet.timeLeft <= 0){
            if((bet.type === "buy" && price > bet.price) || (bet.type === "sell" && price < bet.price)) {
                balance += bet.price * 2;
            }
            activeBets = activeBets.filter(b => b !== bet);
            saveData();
            clearInterval(interval);
        }
    }, 1000);
}

// Кнопки
function buy() { autoBet("buy"); }
function sell() { autoBet("sell"); }

// Загрузка данных при старте
loadData();

// Обновление графика каждые 600 мс
setInterval(() => {
    createCandle();
    drawChart();
}, 600);
