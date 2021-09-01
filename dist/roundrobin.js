"use strict";

exports.__esModule = true;
exports.default = _default;

function _default(array, index) {
  index = index || 0;
  if (array === undefined || array === null) array = [];else if (!Array.isArray(array)) throw new Error('Expecting argument to RoundRound to be an Array');
  return function () {
    if (index >= array.length) index = 0;
    return array[index++];
  };
}

;