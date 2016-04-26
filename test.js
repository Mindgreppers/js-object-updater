
//In this example we will mutate a single object in steps, demonstrating each update method
//Note: all the different kind of update commands can be executed in one single API call also
//You can copy paste and run this yourself

var updater = require('/home/master/work/code/js-object-updater')
var _ = require('lodash')

var objectToUpdate = { //Can be an array or object
  aTopLevelField: 'foo',
  topLevelArray: [2, 4, {a: 3}],
  arr1: [
    {
      someField: 3, 
      arr2: [
        {
          a: 2, 
          f: 4, 
          x: {
            fieldA: 'someRandomValue'
          }
        }
      ]
    }, 
    {
      someField: 4,
      arr2: [
        {
          a: 23, 
          f: 42, 
          x: {
            fieldA: 'some other random value',
            arrC: [42, 56]
          },
        }
      ]
    }
  ]
}

//Unset
updater(
  {
    doc: objectToUpdate,
    force:true,// In unset, force true or false does not make any difference
    update: {
      unset: [
        {
          _path: ["arr1", {someField: 3}, "arr2", {a: 2, f: 4}, "x"]
        },
        ['aTopLevelField'] //The array of top level fields
      ],
      //set:[], Demonstrated separately below for brevity. But can combine multiple commands into one API call
      //pull: {} or []
    }
  }
)
console.log(JSON.stringify(objectToUpdate))
//{"topLevelArray":[2,4,{"a":3}],"arr1":[{"someField":3,"arr2":[{"a":2,"f":4}]},{"someField":4,"arr2":[{"a":23,"f":42,"x":{"fieldA":"some other random value","arrC":[42,56]}}]}]}

//Set
updater(
  {
    doc: objectToUpdate,
    force:true,//Whether to force creation of nested path if it does not fully exist
    update: {
      set:[
        {
          _path: ["arr1", {someField: 4}, "arr2", {a:23, f:42}, "foo"],
          _value: 6.5 
        },
        {
          someOtherTopLevelField: 42,
          anotherTopLevelField: [42, 65]
        }
      ],
    }
  }
)
console.log(JSON.stringify(objectToUpdate))
//{"topLevelArray":[2,4,{"a":3}],"arr1":[{"someField":3,"arr2":[{"a":2,"f":4}]},{"someField":4,"arr2":[{"a":23,"f":42,"x":{"fieldA":"some other random value","arrC":[42,56]},"foo":6.5}]}],"someOtherTopLevelField":42,"anotherTopLevelField":[42,65]}

//Pull
updater(
  {
    doc: objectToUpdate,
    force:true, // In pull, force true or false does not make any difference
    update: {
      pull:[
        {
          _path: ["arr1", {someField:3}, "arr2", "f"],
          _value: {a: 2} //Remove the objects from nested path where a:2}
        },
        {
          _path: ["arr1", {someField: 3}, "arr2", {a: 23,f: 42},"arrC"],
          _values: [42, 56] //Should have no effect since these do not exist at x in the deep path specified above
        },
        {
          topLevelArray: 2 //Pull just 3 from topLevelArray
        },
        {
          topLevelArray: [{a: 3}, 4] //Pull out one object where a:23 and one object where the number is 4
        },
      ],
    }
  }
)
console.log(JSON.stringify(objectToUpdate))
//{"topLevelArray":[{"a":3}],"arr1":[{"someField":3,"arr2":[{"a":2,"f":4}]},{"someField":4,"arr2":[{"a":23,"f":42,"x":{"fieldA":"some other random value","arrC":[42,56]},"foo":6.5}]}],"someOtherTopLevelField":42,"anotherTopLevelField":[42,65]}

//Push
updater(
  {
    doc: objectToUpdate,
    force:true, 
    update: {
      push:[
        {
          topLevelArray: 21 //Will concat 21 to list of vlaues at topLevelArray. If topLevelArrat does not exist or is not an array, will make it an array
        },
        { 
          topLevelArray: [5, 3] //Will push 5 and 3 to topLevelArray 
        },
        {
          _path: ["arr1",{someField:3},"arr2",{a:2,f:4},"x"], //Do a deep push at x after traversing two arrays
          _values: [6.5, 3.4] //Push both these values one by one
        },
        {
          _path: ["arr1",{someField:3},"arr2",{a:2,f:4}, "arrC"], //Do a deep push at x after traversing two arrays
          _value: 6565 //Set a single value
        }
      ]
    }
  }
)
console.log(JSON.stringify(objectToUpdate))
//{"topLevelArray":[{"a":3},21,5,3],"arr1":[{"someField":3,"arr2":[{"a":2,"f":4,"x":[6.5,3.4],"arrC":[6565]}]},{"someField":4,"arr2":[{"a":23,"f":42,"x":{"fieldA":"some other random value","arrC":[42,56]},"foo":6.5}]}],"someOtherTopLevelField":42,"anotherTopLevelField":[42,65]}

//addToSet
updater(
  {
    doc: objectToUpdate,
    force:true, 
    update: {
      addToSet:[
        {
          topLevelArray: 21 //Will not concat 21 to list of vlaues at topLevelArray as the value already exists
        },
        { 
          topLevelArray: [5, 32] //Will push 32 to topLevelArray. 5 will be ignored
        },
        {
          _path: ["arr1",{someField:3},"arr2",{a:2,f:4}, "arrC"],
          _value: 6565 //Ignored
        }
      ]
    }
  }
)
console.log(JSON.stringify(objectToUpdate))
//{"topLevelArray":[{"a":3},21,5,3,32],"arr1":[{"someField":3,"arr2":[{"a":2,"f":4,"x":[6.5,3.4],"arrC":[6565]}]},{"someField":4,"arr2":[{"a":23,"f":42,"x":{"fieldA":"some other random value","arrC":[42,56]},"foo":6.5}]}],"someOtherTopLevelField":42,"anotherTopLevelField":[42,65]}
//
var o = {a: [{d: 3}, {d:3, f: 3}, {d:2}, {e: 3}]}
updater(
  {
    doc: o, 
    force:true, // In pull, force true or false does not make any difference
    update: {
      pull: [{
        a: [{e: 3}]
      }]
    }
  }
)
console.log(o)
