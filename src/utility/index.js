import ColorHash from 'color-hash';
import _ from 'lodash';
import moment from 'moment';

var loadingBarRef;
var lockCount = 0;

function initLoadingBar(ref) {
  loadingBarRef = ref;
}

function loading(target, name, descriptor) {
  const original = descriptor.value;
  descriptor.value = async function (...args) {
    if (lockCount === 0) {
      loadingBarRef && loadingBarRef.continuousStart();
    }
    lockCount++;
    let result = await original.apply(this, args);
    lockCount--;
    if (lockCount === 0) {
      loadingBarRef && loadingBarRef.complete();
    }
    return result;
  }
}


export { loading };

const set = {
  isSuperset(set, subset) {
    for (let elem of subset) {
      if (!set.has(elem)) {
        return false;
      }
    }
    return true;
  },

  union(setA, setB) {
    let _union = new Set(setA);
    for (let elem of setB) {
      _union.add(elem);
    }
    return _union;
  },

  intersection(setA, setB) {
    let _intersection = new Set();
    for (let elem of setB) {
      if (setA.has(elem)) {
        _intersection.add(elem);
      }
    }
    return _intersection;
  },

  symmetricDifference(setA, setB) {
    let _difference = new Set(setA);
    for (let elem of setB) {
      if (_difference.has(elem)) {
        _difference.delete(elem);
      } else {
        _difference.add(elem);
      }
    }
    return _difference;
  },

  difference(setA, setB) {
    let _difference = new Set(setA);
    for (let elem of setB) {
      _difference.delete(elem);
    }
    return _difference;
  }
}

export { set };

export default {
  initLoadingBar,

  hashColor(str, lightness = 0.6) {
    const colorGen = new ColorHash({ lightness: [lightness] });
    return colorGen.hex(str);
  },

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  stay(fn, time) {
    //TODO
    let timer;
    let _id;
    let execute = {};
    let start = false;
    let reset = _.debounce(
      () => {
        _id = null;
        execute = {};
        start = false;
      }, 200);

    return function (id) {
      start = true;
      reset();
      let self = this;
      let args = arguments;

      if (_id === id) {
        if (execute[id]) {
          fn && fn.apply(self, args);
          execute[id] = false;
        }
        return;
      }

      clearTimeout(timer);

      timer = setTimeout(function () {
        if (start) {
          execute[id] = true;
        }
      }, time);
      _id = id;
    }
  },
  
  //TODO: 支持每周6个工作日
  workdaysBetween(start, end) {
    start = moment(start).clone();
    end = moment(end).clone();
    //星期天作为一周的最后一天
    //调整周天为周六并不影响工作日的计算
    if (start.day() === 0) start.add(-1, 'days');
    if (end.day() === 0) end.add(-1, 'days');
    let first = start.clone().endOf('week');
    let last = end.clone().add(-1, 'weeks').endOf('week');
    //当start和end为同一周时mid为负，正好可抵消left和right的冗余天数
    let mid = last.diff(first, 'days') * 5 / 7;
    let left = 6 - (start.day() || 6);
    let right = (end.day() % 6) || 5;
    return left + mid + right;
  }
};
