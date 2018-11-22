'use strict';
function hydrateNotes(input){   //input is an array of all notes(notes are each objects)
    const hydrated = [], lookup = {};   //hydrated is our array goal to return, full of objects(filling on line 8)
    for (let note of input) {   //loop through each object in our array
      if (!lookup[note.id]) {   //if the obj we are currently looping has a New id: then do stuff
        lookup[note.id] = note; //create a new object in our lookup obj with the new id
        lookup[note.id].tags = [];  //create a nested array in our new object ^
        hydrated.push(lookup[note.id]); //now push our new object with tags array into our goal
      }
  
      if (note.tagId && note.tagName) { //current obj in loop has tag data?
        lookup[note.id].tags.push({     //add into that tags array
          id: note.tagId,               //add data into lookup obj, nested in a tags key
          name: note.tagName            // ^
        });
      }
      delete lookup[note.id].tagId;     //remove the evidence, un-nested
      delete lookup[note.id].tagName;   //^ & this was added in line 6
    }
    return hydrated;//our goal array includes the 'lookup' obj from line 8
}// but only 1 lookup object exists per note.id because of line 5.
//but because of line 11 multiple notes with the same tags&& tagnames data get stacked in the nested array '.tags'
//line 12 ensures the tag-data gets matched to the note with the correct ID: the note's id
module.exports = hydrateNotes;