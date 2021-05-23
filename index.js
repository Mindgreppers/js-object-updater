/**
{
  force:true,//Whether to force creation of nested path if it does not fully exist
  update: {
    set:[
      {
        _path: ["arr1",{y:{x:{'>':3},f:{'<=':5}},z:23},"arr2",{a:2,f:4},"x"],
        _value: 6.5
      },
      {
        key:a//edge a
      },
      {//aray with prorties x = 4,y=8
        x:4,
        y:8
      }
    ],
    pull:[
      {
        yy:6.5
      },
      {
        arr1:{y:23,z:32}
      }
    ],
    push:[
      {
        y:5
      },
      {
        arr_z:{answer:"42"}
      },
      {//For nested path through arrays
        _path: ["arr1",{y:{'=':{x:{'>':3}},f:{'<=':5}},z:23},"arr2",{a:2,f:4},"x"],
        _value: 6.5
      }
    ]
  }

}

*/
//var longjon = require('longjohn')
var _ = require('lodash')
var get = require('./get');
var deepEqual = require('deep-equal');
module.exports = function(params) {
  var doc = params.doc
  if (!doc) {

    throw new Error('update is missing the "doc" parameter')
  }

  var update = params.update
  if (!update) {

    return

  }

  var force = params.force || true
  var operations = Object.keys(update)

  if (!operations) {

    return
  }

  for (var i in operations) {
    var operation = operations[i]
    //execute the operation, whether $push or $pull with its parameters
    var op_params = update[operation]
    if (op_params instanceof Array) {
      for (var i = 0; i < op_params.length; i++) {

        module.exports[operation](doc,op_params[i],force)

      }
    } else if (op_params instanceof Object) {

      module.exports[operation](doc,op_params, force)

    } else {

      throw new Error('update param must be Array of instructions OR a single instruction Object')
    }
  }
}
/**
  {
    _path: ["arr1",{y:{x:{'>':3},f:{'<=':5}},z:23},"arr2",{a:2,f:4},"x"],
    _value: 6.5
  }
   @param doc
   @param params They can come in two forms
        {nested,value} : The nested path of keys will be traversed within the doc to set the value at leaf
        (keyVal pairs} : All the attributes in attrs Object are directly copied to doc
 */
var set = function(doc,params,force) {

  if (params._path) {//is array of keys (path) to traverse depth wise in the doc

    var keys = params._path
    var nested = get.last_parent(doc, keys, force)
    var lastKey = keys[keys.length - 1].key || keys[keys.length -1]
    nested[lastKey] = params._value

  } else {//is (potentially multiple) attributes to copy

    var keys = Object.keys(params)

    for (var i in keys) {

      doc[keys[i]] = params[keys[i]]

    }
  }
  return doc
}
/**
   @param doc
   @param params They can come in two forms
        _path : The nested path of keys will be traversed within the doc to unset the leaf key
        [attrs] : Array of the top level fields, if top level fields are to unset 
 */
var unset = function(doc,params) {
  if (params._path) {//is array of keys (path) to traverse depth wise in the doc

    var keys = params._path
    var nested
    try { 
      nested = get.last_parent(doc,keys)
    } catch(err) {
      return
    }
    var lastKey = keys[keys.length - 1].key || keys[keys.length -1]
    delete nested[lastKey]

  } else {
		params = _.flatten([params])

    _.each(params, function(field) {

      delete doc[field]

    })
  }
  return doc
}
/**
 * @param doc the doc to be updated
 * @param params Of three kinds
 *  {_path,_value} //The value to be pulled at nested path
 *  {_path,_values}//Each value in values is pulled
 *  {attrs}//Key value pairs. The values for a key will be pulled from arrays at each key
 */
var pull = function(doc,params) {
  if (params._path) {
    var keys = params._path
    var nested
    try { 
      nested = get.last_parent(doc,keys)
    } catch(err) {
      return
    }
    var lastKey = keys[keys.length - 1].key || keys[keys.length - 1]
    if (!nested || !nested[lastKey]) {
      return
    }
    if (params._value) {//Push the single element
      nested[lastKey] = filterOut(nested[lastKey], params._value)
    }
    else if (params._values) {//Push the array of elements
      _.each(params._values, function(value) {
        nested[lastKey] = filterOut(nested[lastKey], value)
      })
    }
  } else { //These are single depth keys/attrs to be set in the doc
    _.each(_.keys(params), function(field) {
      if (!_.isArray(params[field])) {
        doc[field] = filterOut(doc[field], params[field]) 
      } else {
        _.each(params[field], function(value) {
          doc[field] = filterOut(doc[field], value)
        })
      }
    })
  }
  return doc
}

function filterOut(list, toPull) {
 
  return _.filter(list, function(item) {
    var checks = [_.isNumber, _.isBoolean, _.isString]
    for (var check in checks) {
      if (checks[check](toPull) || checks[check](item)) {
        return toPull !== item
      }
    };
    const toMatchFromItem = _.pick(item, Object.keys(toPull));
    return !deepEqual(toMatchFromItem, toPull);
  })
}

function addToSet(doc, params, force) {
  return push(doc, params, force, true)
}

/**
 * @param doc the doc to be updated
 * @param params Of three kinds
 *  {_path,value} //The value to be pushed at nested path
 *  {_path,values}//Each value in values is pushed
 *  {attrs}//Key value pairs to be pushed. If vals are arrays, they will be concatenated. The keys should be at top level of doc
 */
var push = function(doc,params,force, setUnique) {
  if (params._path) {
    var keys = params._path
    var nested = get.last_parent(doc,keys,force)
    var lastKey = keys[keys.length - 1].key || keys[keys.length - 1]

    if (!nested[lastKey]) {

      nested[lastKey] = []
    }

    if (params._value) {//Push the single element
      if (setUnique && find(nested[lastKey], params._value)) {
        return doc//Don't do anything since value exists 
      }
      nested[lastKey].push(params._value)
    }
    else if (params._values) {//Push the array of elements
      for (var i in params._values) {
        if (setUnique && find(nested[lastKey], params._values[i])) {
          continue //Don't do anything since value exists 
        }
        nested[lastKey].push(params._values[i])
      }
    }
  } else { //These are single depth keys/attrs to be set in the doc
    pushAttrs(doc,params, setUnique)
  }
  return doc
}

var pushAttrs = function(doc, attrs, setUnique) {
  var keys = Object.keys(attrs)

  for (var i in keys) {
    var key = keys[i]

    if (!doc[key]) {
      doc[key] = []
    }

    if (!_.isArray(doc[key])) {
      doc[key] = [doc[key]]
    }

    if (!_.isArray(attrs[key])) {

      if (setUnique && find(doc[key], attrs[key])) {
        return doc//Don't do anything since value exists 
      }
      doc[key].push(attrs[key])

    } else {

      for (var j in attrs[key]) {
        if (setUnique && find(doc[key], attrs[key][j])) {
          continue //Don't do anything since value exists 
        }
        doc[key].push(attrs[key][j])
      }
    }
  }
}

function find(arr, element) {
  if (_.isObject(element)) {
    return _.find(arr, element)
  } else {
    return arr.indexOf(element) > -1
  }
}

//EXPORTS
module.exports.push = push
module.exports.addToSet = addToSet
module.exports.set = set
module.exports.pull = pull
module.exports.unset = unset
//END OF EXPORTS

if (require.main === module) {
  console.log(
    JSON.stringify(
      addToSet(
        {_source: {}},
        {
            _source:  ['2', '4', '1'] 
        },
        true
      )
    )
  )
}
//console.log(JSON.stringify(push([{a:3,b:4},{c:3,b:5,d:{f:[{a:2},{a:3,b:{v:2}}]}}],{_path:[{b:5},'d','f',{a:3},'c'],values:[2,3]})))
//console.log(push({x:2},{x: [5, 3]}))
//console.log(unset({x:{y:2,g:{}}, y: 2}, 'x'))
//console.log(JSON.stringify(push({x:{y:2,g:{}}},{_path:['x','g','h'],values:[3,2]})))
//console.log(push({x:{y:2,g:[]}},{_path:['x','g'],value:3}))
