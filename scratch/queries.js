'use strict';

const knex = require('../knex');

let searchTerm = req.query;
knex
  .select('notes.id', 'title', 'content')
  .from('notes')
  .modify(queryBuilder => {
    if (searchTerm) {
      queryBuilder.where('title', 'like', `%${searchTerm}%`);
    }
  })
  .orderBy('notes.id')
  .then(results => {
    JSON.stringify(results);
  })
  .catch(err => {
    next(err);
  });

let myId = req.params.id;
  knex
    .select()
    .from('notes')
    .where('id', myId)
    .returning('id', 'title', 'content')
    .then(results => JSON.stringify(results))
    .catch(err => next(err));

let userID = req.params.id;
let updateObj = req.body;
  knex
    .from('notes')
    .where('id', userID)
    .update(updateObj)
    .then(results => res.json(results))
    .catch(err => next(err));

let myObj = req.body;
knex
  .from('notes')
  .insert(myObj)
  .returning('id', 'name', 'title')
  .then(results=> res.send(results))
  .catch(err=> next(err));

let IdtoDelete = req.params.id;
knex
  .from('notes')
  .where('id', IdtoDelete)
  .del()
  .then(results=> res.json(results))
  .catch(err=> next(err));




