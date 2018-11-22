'use strict';

const express = require('express');
const router = express.Router();
const knex = require('../knex');

router.get('/', function(req, res, next){
    knex
      .select('tags.name', 'tags.id','notes.title', 'notes_tags.note_id')
      .from('notes_tags')
      .join('notes', 'notes.id', 'notes_tags.note_id')
      .join('tags', 'notes_tags.tag_id', 'tags.id')
      .returning(['tags.name', 'tags.id','notes.title', 'notes_tags.note_id'])
      .then(function(results){
          res.json(results);
      })
      .catch(err=> next(err));
});

router.get('/:id', function(req, res, next){
  const theId = req.params.id;
  if(isNaN(parseInt(theId))){
    const err = new Error('Tag number not valid');
    err.status = 404;
    return next(err);
  }
  knex
    .select('tags.name', 'tags.id')
    .from('tags')
    .where('tags.id', theId)
    .then(([results]) => {
      if(!results){
        const err = new Error('Tag Not Found');
        err.status = 404;
        return next(err);
      }
      res.json(results);
    })
    .catch(err=> next(err));
});

router.post('/', function(req, res, next){
  const { name } = req.body;
  /***** Never trust users. Validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
  const newItem = { name };
  knex
  .insert(newItem)
  .into('tags')
  .returning(['id', 'name'])
  .then(function(results){
    const result = results[0];
    res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
  })
  .catch(err => next(err));
});

router.put('/:id', function(req, res, next){
  const id = req.params.id;
  const { name } = req.body;
   /***** Never trust users. Validate input *****/
   if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
  if(isNaN(parseInt(id))){
    const err = new Error('Tag number not valid');
    err.status = 404;
    return next(err);
  }
  knex
    .into('tags')
    .update('name', name)
    .where('id', id)
    .returning(['id', 'name'])
    .then(function([results]){
      res.json(results);
    })
    .catch(err=> next(err));
});

router.delete('/:id', function(req, res, next){
  const idGone = req.params.id;
  knex
    .from('tags')
    .del()
    .where('id', idGone)
    .then(function(){
      res.status(204).end();
    })
    .catch(err=>next(err));
});

module.exports = router;