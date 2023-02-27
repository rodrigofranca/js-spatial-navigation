import * as jquery from 'jquery';
/*****************/
/* Core Function */
/*****************/
var EVENT_PREFIX = 'sn:';
export var getRect = function (elem) {
    var cr = elem.getBoundingClientRect();
    if (!cr) {
        return null;
    }
    var left = cr.left, top = cr.top, right = cr.right, bottom = cr.bottom, width = cr.width, height = cr.height;
    var x = left + Math.floor(width / 2);
    var y = top + Math.floor(height / 2);
    var rect = {
        left: left,
        top: top,
        right: right,
        bottom: bottom,
        width: width,
        height: height,
        element: elem,
        center: {
            x: x,
            y: y,
            left: x,
            right: x,
            top: y,
            bottom: y
        }
    };
    return rect;
};
export var partition = function (rects, targetRect, straightOverlapThreshold) {
    var groups = [[], [], [], [], [], [], [], [], []];
    for (var i = 0; i < rects.length; i++) {
        var rect = rects[i];
        var center = rect.center;
        var x = center.x < targetRect.left ? 0 : center.x <= targetRect.right ? 1 : 2;
        var y = center.y < targetRect.top ? 0 : center.y <= targetRect.bottom ? 1 : 2;
        var groupId = y * 3 + x;
        groups[groupId].push(rect);
        if ([0, 2, 6, 8].includes(groupId)) {
            if (rect.left <= targetRect.right - targetRect.width * straightOverlapThreshold) {
                groupId === 2 ? groups[1].push(rect) : groupId === 8 ? groups[7].push(rect) : null;
            }
            if (rect.right >= targetRect.left + targetRect.width * straightOverlapThreshold) {
                groupId === 0 ? groups[1].push(rect) : groupId === 6 ? groups[7].push(rect) : null;
            }
            if (rect.top <= targetRect.bottom - targetRect.height * straightOverlapThreshold) {
                groupId === 6 ? groups[3].push(rect) : groupId === 8 ? groups[5].push(rect) : null;
            }
            if (rect.bottom >= targetRect.top + targetRect.height * straightOverlapThreshold) {
                groupId === 0 ? groups[3].push(rect) : groupId === 2 ? groups[5].push(rect) : null;
            }
        }
    }
    return groups;
};
export var prioritize = function (priorities) {
    var destPriority = null;
    for (var i = 0; i < priorities.length; i++) {
        if (priorities[i].group.length) {
            destPriority = priorities[i];
            break;
        }
    }
    if (!destPriority) {
        return null;
    }
    var destDistance = destPriority.distance;
    destPriority.group.sort(function (a, b) {
        for (var i = 0; i < destDistance.length; i++) {
            var distance = destDistance[i];
            var delta = distance(a) - distance(b);
            if (delta) {
                return delta;
            }
        }
        return 0;
    });
    return destPriority.group;
};
export var distanceBuilder = function (targetRect) {
    return {
        nearPlumbLineIsBetter: function (rect) {
            var d = rect.center.x < targetRect.center.x
                ? targetRect.center.x - rect.right
                : rect.left - targetRect.center.x;
            return d < 0 ? 0 : d;
        },
        nearHorizonIsBetter: function (rect) {
            var d = rect.center.y < targetRect.center.y
                ? targetRect.center.y - rect.bottom
                : rect.top - targetRect.center.y;
            return d < 0 ? 0 : d;
        },
        nearTargetLeftIsBetter: function (rect) {
            var d = rect.center.x < targetRect.center.x
                ? targetRect.left - rect.right
                : rect.left - targetRect.left;
            return d < 0 ? 0 : d;
        },
        nearTargetTopIsBetter: function (rect) {
            var d = rect.center.y < targetRect.center.y
                ? targetRect.top - rect.bottom
                : rect.top - targetRect.top;
            return d < 0 ? 0 : d;
        },
        topIsBetter: function (rect) { return rect.top; },
        bottomIsBetter: function (rect) { return -1 * rect.bottom; },
        leftIsBetter: function (rect) { return rect.left; },
        rightIsBetter: function (rect) { return -1 * rect.right; }
    };
};
export var navigate = function (target, direction, candidates, config) {
    if (!target || !direction || !candidates || !candidates.length) {
        return null;
    }
    var rects = [];
    var targetRect = getRect(target);
    if (!targetRect)
        return null;
    for (var i = 0; i < candidates.length; i++) {
        var rect = getRect(candidates[i]);
        if (rect)
            rects.push(rect);
    }
    if (!rects.length)
        return null;
    var distanceFunction = distanceBuilder(targetRect);
    var groups = partition(rects, targetRect, config.straightOverlapThreshold || 0.5);
    var internalGroups = partition(groups[4], targetRect, config.straightOverlapThreshold || 0.5);
    var priorities;
    switch (direction) {
        case 'left':
            priorities = [
                {
                    group: internalGroups[0].concat(internalGroups[3]).concat(internalGroups[6]),
                    distance: [distanceFunction.nearPlumbLineIsBetter, distanceFunction.topIsBetter]
                },
                {
                    group: groups[3],
                    distance: [distanceFunction.nearPlumbLineIsBetter, distanceFunction.topIsBetter]
                },
                {
                    group: groups[0].concat(groups[6]),
                    distance: [
                        distanceFunction.nearHorizonIsBetter,
                        distanceFunction.rightIsBetter,
                        distanceFunction.nearTargetTopIsBetter
                    ]
                }
            ];
            break;
        case 'right':
            priorities = [
                {
                    group: internalGroups[2].concat(internalGroups[5]).concat(internalGroups[8]),
                    distance: [distanceFunction.nearPlumbLineIsBetter, distanceFunction.topIsBetter]
                },
                {
                    group: groups[5],
                    distance: [distanceFunction.nearPlumbLineIsBetter, distanceFunction.topIsBetter]
                },
                {
                    group: groups[2].concat(groups[8]),
                    distance: [
                        distanceFunction.nearHorizonIsBetter,
                        distanceFunction.leftIsBetter,
                        distanceFunction.nearTargetTopIsBetter
                    ]
                }
            ];
            break;
        case 'up':
            priorities = [
                {
                    group: internalGroups[0].concat(internalGroups[1]).concat(internalGroups[2]),
                    distance: [distanceFunction.nearHorizonIsBetter, distanceFunction.leftIsBetter]
                },
                {
                    group: groups[1],
                    distance: [distanceFunction.nearHorizonIsBetter, distanceFunction.leftIsBetter]
                },
                {
                    group: groups[0].concat(groups[2]),
                    distance: [
                        distanceFunction.nearPlumbLineIsBetter,
                        distanceFunction.bottomIsBetter,
                        distanceFunction.nearTargetLeftIsBetter
                    ]
                }
            ];
            break;
        case 'down':
            priorities = [
                {
                    group: internalGroups[6].concat(internalGroups[7]).concat(internalGroups[8]),
                    distance: [distanceFunction.nearHorizonIsBetter, distanceFunction.leftIsBetter]
                },
                {
                    group: groups[7],
                    distance: [distanceFunction.nearHorizonIsBetter, distanceFunction.leftIsBetter]
                },
                {
                    group: groups[6].concat(groups[8]),
                    distance: [
                        distanceFunction.nearPlumbLineIsBetter,
                        distanceFunction.topIsBetter,
                        distanceFunction.nearTargetLeftIsBetter
                    ]
                }
            ];
            break;
        default:
            return null;
    }
    if (config.straightOnly)
        priorities.pop();
    var destGroup = prioritize(priorities);
    if (!destGroup)
        return null;
    var dest = null;
    if (config.rememberSource &&
        config.previous &&
        config.previous.destination === target &&
        config.previous.reverse === direction) {
        for (var j = 0; j < destGroup.length; j++) {
            if (destGroup[j].element === config.previous.target) {
                dest = destGroup[j].element;
                break;
            }
        }
    }
    if (!dest) {
        dest = destGroup[0].element;
    }
    return dest;
};
export var parseSelector = function (selector) {
    var result = [];
    try {
        if (selector) {
            if (typeof selector === 'string') {
                result = [].slice.call(document.querySelectorAll(selector));
            }
            else if (selector instanceof NodeList) {
                result = [].slice.call(selector);
            }
            else if (selector instanceof HTMLElement) {
                result = [selector];
            }
        }
    }
    catch (err) {
        console.error(err);
    }
    return result;
};
export var matchSelector = function (elem, selector) {
    if (!elem)
        return;
    if (jquery) {
        return jquery(elem).is(selector);
    }
    else if (typeof selector === 'string') {
        return elem.matches(selector);
    }
    else if (Array.isArray(selector)) {
        return selector.includes(elem);
    }
    else if (selector instanceof HTMLElement) {
        return elem === selector;
    }
    return false;
};
export var getCurrentFocusedElement = function () {
    var activeElement = document.activeElement;
    if (activeElement && activeElement !== document.body) {
        return activeElement;
    }
    else {
        return null;
    }
};
export var extend = function (out) {
    var sources = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        sources[_i - 1] = arguments[_i];
    }
    return sources.reduce(function (result, source) {
        Object.keys(source).forEach(function (key) {
            if (source[key] !== undefined) {
                result[key] = source[key];
            }
        });
        return result;
    }, Object.assign({}, out));
};
export var exclude = function (elemList, excludedElem) {
    if (!Array.isArray(excludedElem)) {
        excludedElem = [excludedElem];
    }
    excludedElem.forEach(function (excluded) {
        var index = elemList.indexOf(excluded);
        if (index >= 0) {
            elemList.splice(index, 1);
        }
    });
    return elemList;
};
export var dispatch = function (elem, type, details, cancelable) {
    if (cancelable === void 0) { cancelable = true; }
    var evt = new CustomEvent(EVENT_PREFIX + type, { bubbles: true, cancelable: cancelable, detail: details });
    return elem.dispatchEvent(evt);
};
