# js-object-updater
Set, unset, push, pull at a deep path in a JS hash (or an array)  

Updates documents in memory based on passed instructions. Here is an example

```Javascript
var updater = require('js-object-updater')
updater.update(doc, 

  {
    force:true,//Whether to force creation of nested path if it does not fully exist
    update: {
      unset: [
        {
          _path: ["arr1",{someField:3},"arr2",{a:2,f:4},"x"]
        },
        ['array1', 'array2', 'field1', 'field2']
      ]
      set:[
        {
          _path: ["arr1",{someField:3},"arr2",{a:2,f:4},"x"],
          _value: 6.5
        },
        {
          _path: ["arr1",{someField:3},"arr2",{a:2,f:4},"x"],
          _values: [6.5, 3.4]
        },
        {
          someTopLevelField: 4
        },
        {
          x: [4, 3],
          y: 8
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
          _path: ["arr1",{someField:3},"arr2",{a:2,f:4},"z"],
          _value: 2
        },
        {
          _path: ["arr1",{someField:3},"arr2",{a:2,f:4},"z"],
          _values: [2, 6.5]
        },
        {
          yy: [6.5, 2.3]
        },
        {
          yy: 3
        },
        {
          arr1: {y:23,z:32}
        },
      ],
      push:[
        { 
          y: [5, 3] //Will concat [5,3] with existing values in y
        },
        {
          z: 21
        }
        {
          o: {answer:"42"}
        },
        {
          _path: ["arr1",{someField:3},"arr2",{a:2,f:4},"x"],
          _values: [6.5, 3.4]
        },
        {
          _path: ["arr1",{someField:3},"arr2",{a:2,f:4},"x"],
          _value: 6.5
        }
      ]
    }

  }
)
```
