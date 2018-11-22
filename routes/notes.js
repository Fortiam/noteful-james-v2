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
  const folderId = req.query.folderId;
  knex
  .select('notes.id', 'title', 'content', 'folders.id as folderId')
  .from('notes')
  .leftJoin('folders', 'notes.folder_id', 'folders.id')
  .modify(queryBuilder => {
    if (searchTerm) {
      queryBuilder.where('title', 'like', `%${searchTerm}%`);
    }
  })
  .modify(function(queryBuilder){
    if(folderId){
      queryBuilder.where('folder_id', folderId);
    }
  })
  .orderBy('notes.id')
  .then(results => {
    results.status(200);
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
  .select('notes.id', 'title', 'content', 'folders.id as folderId')
  .from('notes')
  .leftJoin('folders', 'notes.folder_id', 'folders.id')
  .where('notes.id', id)
  .returning(['notes.id', 'notes.title', 'notes.content', 'notes.folder_id', 'folders.id'])
  .then(function(results) { 
    if(results.length === 0){
      const err = new Error('id Not Found');
      err.status = 404;
      return next(err);
    }
    res.json(results[0]);
  })
  .catch(function(err){
    err.status = 404;
    return next(err);});
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
  const updateableFields = ['title', 'content', 'folderId'];
  updateableFields.forEach(field => {
    if (field in req.body) {
      if(field === 'folderId'){
          updateObj['folder_id'] = req.body[field];
        } else {
      updateObj[field] = req.body[field];
      }
    }
  });
  //console.log(updateObj); //this is title, content, and folder_id = '101'
  /***** Never trust users - validate input *****/
  if (!updateObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  knex
  .select('notes.id')
  .from('notes')
  .where('notes.id', id)
  .update(updateObj)
  .then(function(theId){
    console.log(theId);
    return knex
    .select('notes.id', 'notes.title', 'notes.content', 'notes.folder_id as folderId', 'folders.name as folderName')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .where('notes.id', id)
    .then(([results]) =>res.json(results))
    .catch(err => next(err));
  });
});
  
  

// Post (insert) an item
router.post('/', (req, res, next) => {
  const { title, content, folderId } = req.body;

  const newItem = { title: title, content: content, folder_id: folderId };
  /***** Never trust users - validate input *****/
  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  let noteId;
  knex
  .insert(newItem)
  .into('notes')
  .returning('id')
  .then(function([id]){
      noteId = id;
      return knex
        .select('notes.id', 'notes.title', 'notes.content', 'notes.folder_id as folderId', 'folders.name as folderName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .where('notes.id', noteId);
  })
  .then(([results])=>{
    res.location(`http://${req.headers.host}/notes/${results.id}`).status(201).json(results);
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
