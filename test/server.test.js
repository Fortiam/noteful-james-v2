'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const knex = require('../knex');
const expect = chai.expect;

chai.use(chaiHttp);

describe('Sanity check', function () {

  it('true should be true', function () {
    expect(true).to.be.true;
  });

  it('2 + 2 should equal 4', function () {
    expect(2 + 2).to.equal(4);
  });
});

describe('Static Server', function () {

    it('GET request "/" should return the index page', function () {
      return chai.request(app)
        .get('/')
        .then(function (res) {
          expect(res).to.exist;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
        });
    });
});

describe('Noteful all API endpoints', function () {
    const seedData = require('../db/seedData');
  
    beforeEach(function () {
       
      return seedData('./db/noteful.sql');
    });
  

    after(function () {
      return knex.destroy(); // destroy the connection
    });
  

describe('GET /api/notes', function () {
    it('should return the default of 10 Notes ', function () {
      return chai.request(app)
        .get('/api/notes')
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(10);
        });
    });

    it('should return correct search results for a valid searchTerm', function () {
       return chai.request(app)
        .get('/api/notes?searchTerm=about%20cats')
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(4);
          expect(res.body[0]).to.be.an('object');
        });
    });
});

describe('404 handler', function () {

    it('should respond with 404 when given a bad path', function () {
        return chai.request(app)
            .get('/someurlthatdoesntexistandactuallydoesnt')
            .catch(function(err){
                expect(err).to.have.status(404);
            });
    });
});

describe('GET /api/notes', function () {

    it('should return an array of objects where each item contains id, title, and content', function () {
       return chai.request(app)
        .get('/api/notes')
        .then(function(res){
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array');
            expect(res.body.length).to.equal(10);
            expect(res.body[0].hasOwnProperty('id')).to.be.true;
            expect(res.body[0].hasOwnProperty('title')).to.be.true;
            expect(res.body[0].hasOwnProperty('content')).to.be.true;
            expect(Object.getOwnPropertyNames(res.body[0])).to.include('id', 'title', 'content');
            expect(res.body[3].title).to.include('lady gaga');
        });
    });

   it('should return an empty array for an incorrect searchTerm', function () {
        return chai.request(app)
        .get('/api/notes?searchTerm=sfdsfdf')
        .then(function(res){
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array');
            expect(res.body.length).to.equal(0);
   });
});

describe('GET /api/notes/:id', function () {

    it('should return correct note when given an id', function () {
        return chai.request(app)
            .get('/api/notes/1000')
            .then(function(res){
                expect(res).to.have.status(200);
                expect(res.body).to.be.an('object');
                expect(res.body.title).to.include('5 life lessons learned from cats');
                expect(res.body.id).to.equal(1000);
            });
    });

    it('should respond with a 404 for an invalid id', function () {
        return chai.request(app)
        .get('/api/notes/999999')
        .then(function(err){
            expect(err).to.have.status(404);
            expect(err.body.message).to.include('id Not Found');
        })
        .catch(()=> {});
    });
});

describe('POST /api/notes', function () {
    it('should create and return a new item when provided valid data', function () {
        const testValidData = {"title": "valid", "content": "alsoValid", "folderId": 100, "tags": [102]};
        return chai.request(app)
        .post('/api/notes/')
        .send(testValidData)
        .then(function(res){
            expect(res).to.have.status(201);
            expect(res.body).to.be.an('object');
            expect(res.body.title).to.include('valid');
            expect(res.body.content).to.include('alsoValid');
            expect(res.body.id).to.equal(1010);
        });
    });

    it('should return an error when missing "title" field', function () {
        const testBadData = {"content" : "missing the title"};
        return chai.request(app)
        .post('/api/notes/')
        .send(testBadData)
        .then(function(res){
            expect(res).to.have.status(400);
            expect(res.body.message).to.include('Missing `title` in request body');
        })
        .catch((err)=>{console.log(err);});
    });
});

describe('PUT /api/notes/:id', function () {

    it('should update the note', function () {
        const testValidData = {"title": "The updated note still valid", "content": "also still very Valid", "folderId": 100, "tags": [102]};
        const resultsDataExpected = {"id": 1001, "title": "The updated note still valid", "content": "also still very Valid", "folderId": 100, "folderName" :"Archive","tags": [{"id": 102, "name": "tag three"}]};
        return chai.request(app)
        .put('/api/notes/1001')
        .send(testValidData)
        .then(function(res){
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('object');
            expect(res.body.title).to.have.include('The updated note still valid');
            expect(res.body.content).to.have.include('also still very Valid');
            expect(res.body).to.deep.equal(resultsDataExpected);
            expect(res.body.id).to.equal(1001);
        });
    });

    it('should respond with a 404 for an invalid id', function () {
        return chai.request(app)
        .put('/api/notes/abcdef')
        .then(function(res){
            expect(res).to.have.status(404);
            expect(res.body.message).to.include('Invalid `id`');
        })
        .catch(()=>{});
    });

    it('should return an error when missing "title" field', function () {
       const testBadData = {"content" : "missing the title"};
       return chai.request(app)
       .put('/api/notes/1004')
       .send(testBadData)
       .then(function(res){
           expect(res).to.have.status(400);
           expect(res.body.message).to.have.include('Missing `title` in request body');
       });
    });
});

describe('DELETE  /api/notes/:id', function () {

    it('should delete an item by id', function () {
        return chai.request(app)
        .delete('/api/notes/1007')
        .then(function(res){
            expect(res).to.have.status(204);
        });
    });
});
});

});