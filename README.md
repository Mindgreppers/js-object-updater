js-object-updater
=================

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
    update: {//Can run multiple commands in one call
      <command>: [],  // Can give instructions for a command
      <commandB>: {},  // Can give single instruction for a command
    }
  })
```

###How to use push, addToSet, pull commands


``` Javascript
{
  //Run one instruction against a command
  <commandA>: {

    _path: ['deep', 'nested', 'array', {'arrayItemsFieldX': 'should match this value', 'arrayFieldY': 'should be this'}, 'so on and so forth'],    // _path is always expected to be an array
    _value: 'a single value to be pushed, pulled, addedToSet'
  },

  //Run multiple instructions against a command
  <commandB>: [

    {
      _path: ['deep', 'nested', 'path'],
      _values: ['any value A', 'some value B']    // Specify _values for dealing with a list of values one by one
    },

    {
      _path: ['deep', 'nested', 'path'],
      _value: ['any value A', 'some value B']     // Since we are saying _value now, entire array as a single Object will be pushed, pulled, addedToSet 
    },

    {     //For updating top level fields in the object, just specifying <key>:<val> pairs works

      'topLevelFieldA': 'valueA for top Level field',

      'topLevelFieldB': ['valueB', 'valueC']      //Each value in array will be treated independently. Same as _values
    },
  ]
}
```

###How to use set

Same way as addToSet, push, pull except that \_value must be used. \_values does not make any sense in case of set on a field, and is hence ignored 

```Javascript
{
  set: [ 
    {topLevelField: 'value'} , //A single top level field to be unset

    {
      _path: ['fieldA', 'nestedFieldB', 'arrayFieldInB', {'itemField1': 'matches this value'}, 'fieldZ of matched array item']
      _value: '65'
    }
  ]
} 
```

###How to use unset
Same as others, except that there is no concept/use of _value/_values in unset. We simply want to remove a field from an object

```Javascript
{
  unset: [ 
    'topLevelField', //A single top level field to be unset

    ['topLevelFieldB', 'topLevelFieldC'] //A list of top level fields to be unset

    {_path: ['fieldA', 'nestedFieldB', 'arrayFieldInB', {'itemField1': 'matches this value'}, 'fieldZ of matched array item']}
  ]
} 
```

##Examples

In these examples we will mutate a single object in steps, demonstrating each update command one by one  
All the different kind of update commands can be executed in one single API call also

###Setup
```Javascript

var updater = require('js-object-updater')

var objectToUpdate = { //Can be an array or object
  aTopLevelField: 'foo',
  topLevelArray: [2, 4, {a: 3}],
  anotherTopLevelArray: [
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
```
####Unset

```Javascript
updater(
  {
    doc: objectToUpdate,
    force:true,// As far as unset command is concerned, force true or false does not make any difference
    update: {
      unset: [
        {
          _path: ["anotherTopLevelArray", {someField: 3}, "arr2", {a: 2, f: 4}, "x"]
        },
        ['aTopLevelField'] //The array of top level fields
      ],
    }
  }
)
console.log('after unset', JSON.stringify(objectToUpdate))
//{"topLevelArray":[2,4,{"a":3}],"anotherTopLevelArray":[{"someField":3,"arr2":[{"a":2,"f":4}]},{"someField":4,"arr2":[{"a":23,"f":42,"x":{"fieldA":"some other random value","arrC":[42,56]}}]}]}
```

###Set
```Javascript
updater(
  {
    doc: objectToUpdate,
    force:true,//Whether to force creation of nested path if it does not fully exist
    update: {
      set:[
        {
          _path: ["anotherTopLevelArray", {someField: 4}, "arr2", {a:23, f:42}, "foo"],
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
console.log('after set', JSON.stringify(objectToUpdate))
//{"topLevelArray":[2,4,{"a":3}],"anotherTopLevelArray":[{"someField":3,"arr2":[{"a":2,"f":4}]},{"someField":4,"arr2":[{"a":23,"f":42,"x":{"fieldA":"some other random value","arrC":[42,56]},"foo":6.5}]}],"someOtherTopLevelField":42,"anotherTopLevelField":[42,65]}
```

###Pull
```Javascript
updater(
  {
    doc: objectToUpdate,
    force:true, // In pull, force true or false does not make any difference
    update: {
      pull:[
        {
          _path: ["anotherTopLevelArray", {someField:3}, "arr2"],
          _value: {a: 2} //Remove the objects from nested path where a:2}
        },
        {
          _path: ["anotherTopLevelArray", {someField: 3}, "arr2", {a: 23,f: 42},"arrC"],
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
console.log('after pull', JSON.stringify(objectToUpdate))
//{"topLevelArray":[],"anotherTopLevelArray":[{"someField":3,"arr2":[]},{"someField":4,"arr2":[{"a":23,"f":42,"x":{"fieldA":"some other random value","arrC":[42,56]},"foo":6.5}]}],"someOtherTopLevelField":42,"anotherTopLevelField":[]}
```

###Push
```Javascript
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
          _path: ["anotherTopLevelArray",{someField:3},"arr2",{a:2,f:4},"x"], //Do a deep push at x after traversing two arrays
          _values: [6.5, 3.4] //Push both these values one by one
        },
        {
          _path: ["anotherTopLevelArray",{someField:3},"arr2",{a:2,f:4}, "arrC"], //Do a deep push at x after traversing two arrays
          _value: 6565 //Set a single value
        }
      ]
    }
  }
)
console.log('after push', JSON.stringify(objectToUpdate))
//{"topLevelArray":[21,5,3],"anotherTopLevelArray":[{"someField":3,"arr2":[{"a":2,"f":4,"x":[6.5,3.4],"arrC":[6565]}]},{"someField":4,"arr2":[{"a":23,"f":42,"x":{"fieldA":"some other random value","arrC":[42,56]},"foo":6.5}]}],"someOtherTopLevelField":42,"anotherTopLevelField":[42,65]}
```

###addToSet
```Javascript
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
          _path: ["anotherTopLevelArray",{someField:3},"arr2",{a:2,f:4}, "arrC"],
          _value: 6565 //Ignored
        }
      ]
    }
  }
)
console.log('after addToSet', JSON.stringify(objectToUpdate))
//{"topLevelArray":[21,5,3,32],"anotherTopLevelArray":[{"someField":3,"arr2":[{"a":2,"f":4,"x":[6.5,3.4],"arrC":[6565]}]},{"someField":4,"arr2":[{"a":23,"f":42,"x":{"fieldA":"some other random value","arrC":[42,56]},"foo":6.5}]}],"someOtherTopLevelField":42,"anotherTopLevelField":[42,65]}
```
