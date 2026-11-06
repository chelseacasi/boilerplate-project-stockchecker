const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
  this.timeout(5000);

  suite('5 functional get request tests', function () {
    let likesBefore;

    test('Viewing one stock', done => {
      chai.request(server).get('/api/stock-prices').query({ stock: 'GOOG' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.stock, 'GOOG');
          assert.isNumber(res.body.stockData.price);
          assert.isNumber(res.body.stockData.likes);
          done();
        });
    });

    test('Viewing one stock and liking it', done => {
      chai.request(server).get('/api/stock-prices').query({ stock: 'GOOG', like: true })
        .end((err, res) => {
          assert.equal(res.body.stockData.stock, 'GOOG');
          assert.isAtLeast(res.body.stockData.likes, 1);
          likesBefore = res.body.stockData.likes;
          done();
        });
    });

    test('Viewing the same stock and liking it again', done => {
      chai.request(server).get('/api/stock-prices').query({ stock: 'GOOG', like: true })
        .end((err, res) => {
          assert.equal(res.body.stockData.likes, likesBefore); // no increase
          done();
        });
    });

    test('Viewing two stocks', done => {
      chai.request(server).get('/api/stock-prices').query({ stock: ['GOOG', 'MSFT'] })
        .end((err, res) => {
          assert.isArray(res.body.stockData);
          assert.equal(res.body.stockData.length, 2);
          assert.property(res.body.stockData[0], 'rel_likes');
          assert.property(res.body.stockData[1], 'rel_likes');
          done();
        });
    });

    test('Viewing two stocks and liking them', done => {
      chai.request(server).get('/api/stock-prices').query({ stock: ['GOOG', 'MSFT'], like: true })
        .end((err, res) => {
          assert.isArray(res.body.stockData);
          assert.property(res.body.stockData[0], 'rel_likes');
          assert.equal(
            res.body.stockData[0].rel_likes + res.body.stockData[1].rel_likes, 0
          );
          done();
        });
    });
  });
});