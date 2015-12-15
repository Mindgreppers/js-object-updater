var _ = require('lodash')
/**
 * @param doc the document to be traversed
 * @param keys the path to traverse
 * @param force whether to forecreate the path till last_parent
 */
const last_parent = function(doc,keys,force) {
  if (!doc) {
    throw new Error('IllegalArgument: doc is undefined')
  }
  if (!keys) {
    throw new Error('IllegalArgument: keys is undefined')
  }
  var nested = doc//nested can be Array or Object as we iterate over the keys
  var depth = 0
  while (depth < (keys.length - 1)) {
    var key = keys[depth].key || keys[depth]
    var next_nested = resolve(nested,key)
    if (!next_nested && force) {
      if (_.isArray(nested)) {
        if (typeof keys[depth] === 'object') {
          next_nested = key
        } else if (key === '_last') {
          next_nested = {}
        }
        nested.push(next_nested)
      } else {//if nested is a plain object
        var next_key = keys[depth + 1].key || keys[depth + 1]
        if (_.isNumber(next_key) || next_key === '_last' || _.isObject(next_key)) {
          next_nested = []//means we are expecting array in next to next level
        } else {
          next_nested = {}
        }
        nested[key] = next_nested
      }
    }
    nested = next_nested
    if (!nested || typeof nested !== 'object') {
      throw new Error('No nested Object found for key at depth ' + depth + ' for key ' + keys[depth] + ' in  ' + JSON.stringify(keys) + ' , for the top Object ' + JSON.stringify(doc) + ' found instead ' + JSON.stringify(nested))
    }
    depth += 1
  }
  return nested
}

/**
 * Default match and return value function. Assumes expr is an Object and o is array or single json object
 * returns an array element that matches the expression
 *
 */
const resolve = function(o,expr) {
  if (typeof o === 'object') { //is array or json object
    if (Array.isArray(o)) {//is array
      if (expr === '_last') {//When you want the last element from an array
        return _.last(o)
      }
      else if (typeof expr === 'object') {//you want to get first element that matches expr
        return _.findWhere(o,expr)
      }
      else if (typeof expr === 'number') {
        return o[expr]
      }
    } else if (typeof expr !== 'object') { //o is plain json object (not array) and expr is not an Object
      return o[expr]
    }
  }
  throw new Error('Invalid arguments to resolve. o: ' + JSON.stringify(o) + ' expr: ' + JSON.stringify(expr))
}

//Exports
module.exports.last_parent = last_parent

//Tests
//console.log(last_parent([{a:3,b:4},{c:3,b:5}],[{b:3},4],true))
//console.log(last_parent([{a:3,b:4},{c:3,b:5,d:{f:4}}],[{b:5},'d','f']))
if (require.main === module) {
  var doc = [{a: 3,b: 4},{c: 3,b: 5,d: {f: [{a: 2},{a: 3,b: {v: 2}}]}}]
  console.log(
    last_parent(
     doc,
     [{b: 5},{key: 'd'},{key: 'f'},{r: 2},{key: 'b'}],
     false
    )
  )
}
