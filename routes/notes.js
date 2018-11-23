'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

// TEMP: Simple In-Memory Database
// const data = require('../db/notes');
// const simDB = require('../db/simDB');
// const notes = simDB.initialize(data);
const knex = require('../knex');
const hydrateNotes = require('../utils/hydrateNotes');

// Get All (and search by query)
router.get('/', (req, res, next) => {
  const searchTerm = req.query.searchTerm;
  const folderId = req.query.folderId;
  const tagId = req.query.tagId;
  knex
  .select('notes.id', 'title', 'content', 'folders.id as folderId', 'tags.name as tagName', 'tags.id as tagId')
  .from('notes')
  .leftJoin('folders', 'notes.folder_id', 'folders.id')
  .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
  .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
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
  .modify(function(queryBuilder){
    if(tagId){
      queryBuilder.where('tag_id', tagId);
    }
  })
  .orderBy('notes.id')
  .then(result => {
    if(result){
      const hydrated = hydrateNotes(result);
      res.json(hydrated);
    } else {
      next();
    }
  })
  .catch(err => {
    next(err);
  });
});

// Get a single item
router.get('/:id', (req, res, next) => {
  const id = req.params.id;
  if(isNaN(parseInt(id))){
    const err = new Error('id Invalid Number');
    err.status = 404;
    return next(err);
  }
  knex
  .select('notes.id', 'title', 'content', 'folders.id as folderId', 'tags.name as tagName', 'tags.id as tagId')
  .from('notes')
  .leftJoin('folders', 'notes.folder_id', 'folders.id')
  .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
  .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
  .where('notes.id', id)
  .returning(['notes.id', 'notes.title', 'notes.content', 'notes.folder_id', 'folders.id', 'tags.name as tagName', 'tags.id as tagId'])
  .then(function(result) { 
    if(result.length === 0){
      const err = new Error('id Not Found');
      err.status = 404;
      return next(err);
    }
    const hydrated = hydrateNotes(result);
    res.json(hydrated[0]);
  })
  .catch(function(err){
    err.status = 404;
    return next(err);});
});

// Put update an item
router.put('/:id', (req, res, next) => {
  const id = req.params.id;
  if(isNaN(id)){
    const err = new Error('Invalid `id`');
    err.status = 404;
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
  /***** Never trust users - validate input *****/
  if (!updateObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  return knex
  .select('notes.id')
  .from('notes')
  .where('notes.id', id)
  .update(updateObj)
  .then(function(){
    //delete related tags from notes_tags table
    return knex
    .from('notes_tags')
    .where('note_id', id)
    .delete();
  })
  .then(function(){
    //insert tags into notes_tags table
    const tagsInsert = req.body.tags.map(tagId => ({ note_id: id, tag_id: tagId }));
    return knex
    .from('notes_tags')
    .insert(tagsInsert);
  })
  .then(function(){
    //select new note and leftjoin on folders And tags
    return knex
    .select('notes.id', 'notes.title', 'notes.content', 'notes.folder_id as folderId', 'folders.name as folderName', 'tags.id as tagId', 'tags.name as tagName')
    .from('notes_tags')
    .leftJoin('notes', 'notes_tags.note_id', 'notes.id')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
    .where('notes.id', id);
    })
    .then((results) =>{
      //hydrate results if they exist
      if(results){
        const hydro = hydrateNotes(results);
      res.status(200).json(hydro[0]);
      }
      else {
      next();
      }
    })
    .catch(err => next(err));
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
  let tags = req.body.tags;
  knex
  .insert(newItem)
  .into('notes')
  .returning('id')
  .then(function([id]){
      noteId = id;  //now we have our new Note 'notes.id'
      const tagsInsert = tags.map(tagId => ({ note_id: noteId, tag_id: tagId }));
      return knex
      .into('notes_tags')
      .insert(tagsInsert);
  })
  .then(function (){
      return knex
        .select('notes.id', 'notes.title', 'notes.content', 'notes.folder_id as folderId', 'folders.name as folderName', 'tags.id as tagId', 'tags.name as tagName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes_tags.note_id', 'notes.id')
        .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
        .where('notes.id', noteId);
  })
  .then((results)=>{
    if(results){
    const newResults = hydrateNotes(results)[0];
    res.location(`http://${req.headers.host}/notes/${results[0].id}`).status(201).json(newResults);
    } else {
      next();
    }
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
