'use strict';
const express = require('express');

const router = express.Router();

const knex = require('../knex');

router.get('/', function(req, res, next){
    knex
    .select('id', 'name')
    .from('folders')
    .then(results => {
        res.json(results);
    })
    .catch(err => next(err));
});

router.get('/:id', function(req, res, next){
    const whichId = req.params.id;
    knex
    .select('id', 'name')
    .from('folders')
    .where('id', whichId)
    .returning(['id', 'name'])
    .then(function(results) {
        console.log(results);
        if(results.length === 0){
            const err = new Error('id Not Found');
            err.status = 404;
            return next(err);
        }
    res.json(results[0]);
    })
    .catch(err => next(err));
});

router.put('/:id', function(req, res, next){
    const whichId = req.params.id;
    if(!whichId){
        const err = new Error('Invalid `id`');
        err.status = 400;
        return next(err);
    }
    const updateObj = {};
    // const updateableFields = ['name'];
    // updateableFields.name = req.body[name];
    updateObj.name = req.body.name;
    //console.log(req.body);
    knex
    .select('id', 'name')
    .from('folders')
    .where('id', whichId)
    .returning(['id', 'name'])
    .update('name', req.body.name)
    .then(function([results]) { 
        console.log(results);
        res.json(results);})
    .catch(err=> next(err));
});

router.post('/', function(req, res, next){
    const createdObj = req.body;
    if(!createdObj.name){
        const err = new Error('Missing name in request body');
        err.status = 400;
        return next(err);
    }
    knex
    .from('folders')
    .insert(createdObj)
    .returning(['id', 'name'])
    .then(function([results]){
        console.log(results);
        res.json(results);
    })
    .catch(err => next(err));
});

router.delete('/:id', function(req, res, next){
    const bye = req.params.id;
    knex
    .from('folders')
    .del()
    .where('id', bye)
    .then(results=> res.send(204).end())
    .catch(err => next(err));
});

module.exports = router;
