'use strict';
const crypto = require('crypto');

const likesDB = {}; // { SYMBOL: Set of hashed IPs }
const hashIp = ip => crypto.createHash('sha256').update(ip).digest('hex');

async function getPrice(symbol) {
  const res = await fetch(
    `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`
  );
  const data = await res.json();
  return data.latestPrice;
}

function getLikes(symbol) {
  return likesDB[symbol] ? likesDB[symbol].size : 0;
}

function addLike(symbol, ip) {
  if (!likesDB[symbol]) likesDB[symbol] = new Set();
  likesDB[symbol].add(hashIp(ip)); // Set ignores duplicates
}

module.exports = function (app) {
  app.route('/api/stock-prices').get(async (req, res) => {
    let { stock, like } = req.query;
    const doLike = like === 'true';
    const ip = req.ip;

    const stocks = Array.isArray(stock) ? stock : [stock];
    const symbols = stocks.map(s => s.toUpperCase());

    if (doLike) symbols.forEach(s => addLike(s, ip));

    const prices = await Promise.all(symbols.map(getPrice));

    if (symbols.length === 1) {
      return res.json({
        stockData: {
          stock: symbols[0],
          price: prices[0],
          likes: getLikes(symbols[0])
        }
      });
    }

    const l0 = getLikes(symbols[0]);
    const l1 = getLikes(symbols[1]);
    res.json({
      stockData: [
        { stock: symbols[0], price: prices[0], rel_likes: l0 - l1 },
        { stock: symbols[1], price: prices[1], rel_likes: l1 - l0 }
      ]
    });
  });
};