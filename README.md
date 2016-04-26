# js-object-updater
Set, unset, push, addToSet, pull at a deep path in a JS hash (or an array).

* Mutates objects in memory
* Can update top level fields or fields at any depth. 
* Uses conditional matching within array items so that one can do deep update within matched array item too.
* addToSet command is like push, but different in a way that it adds the new value only if it does not exist in existing collection 

```Javascript
  
  var updater = require('js-object-updater')
  updater({
    doc: objectToBeUpdated,
    force: true, //Default false. Whether to force create the (possibly deep) paths during this update, if they don't exist
    update: {
      <command>: [],  // Instructions
      <commandB>: {},  // Single instruction 
    }
  })
```


###Format of set, push, addToSet, pull commands
``` Javascript
{
  <commandA>: {     // Where command can be either of set, push, addToSet, pull

    _path: ['deep nested path', 'leading to an array field', {'arrayItemsFieldX': 'should match this value'}, 'within that item', 'fieldY', 'and so on and so forth'],
    _value: 'the value to be set, pushed, pulled, addedToSet'
  },

  <commandB>: [     // Use array of instructions if they are more than one instructions against one update command

    {
      _path: ['deep', 'nested', 'path'], //_path is always expected to be an array
      _value: 'the value you want to set, pull, push, addToSet'
    },
    {
      _path: ['deep', 'nested', 'path'],    // _path is always expected to be an array
      _values: ['any value A', 'some value B']    // Specify _values for dealing with a list of values one by one
    },
  ],

  <commandC>: [

    {     //For updating top level fields in the object, just specifying <key>:<val> pairs works

      'topLevelFieldA': 'valueA for top Level field',
      'topLevelFieldB': ['valueB', 'valueC'] //In case commandC is pull, addToSet or push, each value will be dealt one by one, independently. In case of set, the whole array will replace previous value of topLevelFieldB
    },
    {     // You can mix and match with _path style in the array of instructions, as need be

      _path: ['deep', 'nested', 'path'], //_path is always expected to be an array
      _values: ['any value A', 'some value B'] //Specify _values for dealing with a list of values one by one
    },
  ]
}
```

###Format for unset
Same as others, except that there is no concept/use of _value/_values in unset. We simply want to remove a field from an object

```Javascript
  //  Give an array if multiple instructions are to be run against unset command
  unset: [ 
    'topLevelField',
    {_path: ['fieldA', 'nestedFieldB', 'arrayFieldInB', {'itemField1': 'matches this value'}, 'fieldZ of matched array item']}
    ['topLevelFieldB', 'topLevelFieldC'] //Give an array of fields to unset, if they are top level fields
  ]
  
```

## API example

```Javascript
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
            fieldA: 'some other random value'
          }
        }
      ]
    }
  ]
}
var originalObjectToUpdate = _.cloneDeep(objectToUpdate)

updater(

  {
    doc: objectToUpdate,
    force:true,//Whether to force creation of nested path if it does not fully exist
    update: {
      unset: [
        {
          _path: ["arr1", {someField: 3}, "arr2", {a: 2, f: 4}, "x"]
        },
        ['topLevelField'] //The array of top level fields
      ],
      set:[
        {
          _path: ["arr1", {someField: 4}, "arr2", {a:23, f:42}, "x"],
          _value: 6.5 //Will replace previous value which was {fieldA: 'some random value'}
        },
        {
          someTopLevelField: 42,
          someOtherTopLevelField: [42, 65]
        }
      ],
      pull:[
        {
          _path: ["arr1",{someField:3},"arr2",{a:2,f:4},"x"],
          _value: {a:2}
        },
        {
          _path: ["arr1",{someField:3},"arr2",{a:2,f:4},"x"],
          _values: [{a:2}, {a:4}]
        },
        {
          someArray: [6.5, 2.3] //Pull 6.5 and 2.3 one by one from array called yy at top level of object
        },
        {
          topLevelArray: 3 //Pull just 3 from topLevelArray
        },
        {
          topLevelArray: [{a: 23}, 4] //Pull out one object where a:23 and one object where the number is 4
        },
      ],
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
          _path: ["arr1",{someField:3},"arr2",{a:2,f:4},"x"], //Do a deep push at x after traversing two arrays
          _value: 6.5 //Set a single value
        }
      ]
    }

  }
)

console.log(JSON.stringify(originalObjectToUpdate))
console.log(JSON.stringify(objectToUpdate))
```
