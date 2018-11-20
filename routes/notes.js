'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

// TEMP: Simple In-Memory Database
// const data = require('../db/notes');
// const simDB = require('../db/simDB');
// const notes = simDB.initialize(data);
const knex = require('../knex');

// Get All (and search by query)
router.get('/', (req, res, next) => {
  const searchTerm = req.query.searchTerm;
  knex
  .select('id', 'title', 'content')
  .from('notes')
  .modify(queryBuilder => {
    if (searchTerm) {
      queryBuilder.where('title', 'like', `%${searchTerm}%`);
    }
  })
  .orderBy('id')
  .then(results => {
    //results.status(200);
    res.json(results);
  })
  .catch(err => {
    next(err);
  });
});

// Get a single item
router.get('/:id', (req, res, next) => {
  const id = req.params.id;

  knex
  .select()
  .from('notes')
  .where('id', id)
  .returning('id', 'title', 'content')
  .then(function(results) { 
    if(results.length === 0){
      const err = new Error('id Not Found');
      err.status = 404;
      next(err);
    }
    res.json(results[0]);
  })
  .catch(function(err){
    err.status = 404;
    next(err);});
});

// Put update an item
router.put('/:id', (req, res, next) => {
  const id = req.params.id;
  if(!id){
    const err = new Error('Invalid `id`');
    err.status = 400;
    return next(err);
  }
  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['title', 'content'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  // if (!updateObj.title) {
  //   const err = new Error('Missing `title` in request body');
  //   err.status = 400;
  //   return next(err);
  // }
  knex
  .from('notes')
  .where('id', id)
  .update(updateObj)
  .returning(['id', 'title', 'content'])
  .then(results => res.json(results))
  .catch(err => next(err));
});

// Post (insert) an item
router.post('/', (req, res, next) => {
  const { title, content } = req.body;

  const newItem = { title, content };
  /***** Never trust users - validate input *****/
  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  knex
  .from('notes')
  .insert(newItem)
  .returning(['title', 'content', 'id'])
  .then(function(results){
    res.location(`http://${req.headers.host}/notes/${results[0].id}`).status(201).json(results);
  })
  .catch(err=> next(err));
});

// Delete an item
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;
  knex
  .from('notes')
  .where('id', id)
  .del()
  .then(results=> res.status(204).end())
  .catch(err=> next(err));
});

module.exports = router;
