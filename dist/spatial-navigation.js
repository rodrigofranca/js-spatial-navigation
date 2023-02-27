import { dispatch, exclude, extend, getCurrentFocusedElement, matchSelector, navigate, parseSelector } from './core';
/************************/
/* Global Configuration */
/************************/
var globalConfig = {
    selector: '',
    straightOnly: false,
    straightOverlapThreshold: 0.5,
    rememberSource: false,
    disabled: false,
    defaultElement: '',
    enterTo: '',
    leaveFor: null,
    //  up: <extSelector>, down: <extSelector>}
    restrict: 'self-first',
    tabIndexIgnoreList: 'a, input, select, textarea, button, iframe, [contentEditable=true]',
    navigableFilter: null
};
/*********************/
/* Constant Variable */
/*********************/
var KEYMAPPING = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
};
var REVERSE = {
    left: 'right',
    up: 'down',
    right: 'left',
    down: 'up'
};
var ID_POOL_PREFIX = 'section-';
/********************/
/* Private Variable */
/********************/
var _idPool = 0;
var _ready = false;
var _pause = false;
var _sections = {};
var _sectionCount = 0;
var _defaultSectionId = '';
var _lastSectionId = '';
var _duringFocusChange = false;
/********************/
/* Private Function */
/********************/
var generateId = function () {
    var id;
    while (true) {
        id = "".concat(ID_POOL_PREFIX).concat(++_idPool);
        if (!_sections[id]) {
            break;
        }
    }
    return id;
};
function isNavigable(elem, sectionId, verifySectionSelector) {
    if (!elem || !sectionId || !_sections[sectionId] || _sections[sectionId].disabled) {
        return false;
    }
    if ((elem.offsetWidth <= 0 && elem.offsetHeight <= 0) || elem.hasAttribute('disabled')) {
        return false;
    }
    if (verifySectionSelector && !matchSelector(elem, _sections[sectionId].selector)) {
        return false;
    }
    if (typeof _sections[sectionId].navigableFilter === 'function') {
        if (_sections[sectionId].navigableFilter(elem, sectionId) === false) {
            return false;
        }
    }
    else if (typeof globalConfig.navigableFilter === 'function') {
        if (globalConfig.navigableFilter(elem, sectionId) === false) {
            return false;
        }
    }
    return true;
}
function getSectionId(elem) {
    for (var id in _sections) {
        if (!_sections[id].disabled && matchSelector(elem, _sections[id].selector)) {
            return id;
        }
    }
}
function getSectionNavigableElements(sectionId) {
    return parseSelector(_sections[sectionId].selector).filter(function (elem) {
        return isNavigable(elem, sectionId);
    });
}
function getSectionDefaultElement(sectionId) {
    var defaultElement = parseSelector(_sections[sectionId].defaultElement).find(function (elem) {
        return isNavigable(elem, sectionId, true);
    });
    if (!defaultElement) {
        return null;
    }
    return defaultElement;
}
function getSectionLastFocusedElement(sectionId) {
    var lastFocusedElement = _sections[sectionId].lastFocusedElement;
    if (!isNavigable(lastFocusedElement, sectionId, true)) {
        return null;
    }
    return lastFocusedElement;
}
function focusElement(elem, sectionId, direction) {
    if (!elem) {
        return false;
    }
    var currentFocusedElement = getCurrentFocusedElement();
    var silentFocus = function () {
        if (currentFocusedElement) {
            currentFocusedElement.blur();
        }
        elem.focus();
        focusChanged(elem, sectionId);
    };
    if (_duringFocusChange) {
        silentFocus();
        return true;
    }
    _duringFocusChange = true;
    if (_pause) {
        silentFocus();
        _duringFocusChange = false;
        return true;
    }
    if (currentFocusedElement) {
        var willUnfocusDetail = {
            nextElement: elem,
            nextId: sectionId,
            direction: direction,
            native: false
        };
        if (!dispatch(currentFocusedElement, 'willunfocus', willUnfocusDetail)) {
            _duringFocusChange = false;
            return false;
        }
        currentFocusedElement.blur();
        dispatch(currentFocusedElement, 'unfocused', willUnfocusDetail, false);
    }
    var focusDetail = {
        previousElement: currentFocusedElement,
        id: sectionId,
        direction: direction,
        native: false
    };
    if (!dispatch(elem, 'willfocus', focusDetail)) {
        _duringFocusChange = false;
        return false;
    }
    elem.focus();
    dispatch(elem, 'focused', focusDetail, false);
    _duringFocusChange = false;
    focusChanged(elem, sectionId);
    return true;
}
function focusChanged(elem, sectionId) {
    if (!sectionId) {
        sectionId = getSectionId(elem);
    }
    if (sectionId) {
        _sections[sectionId].lastFocusedElement = elem;
        _lastSectionId = sectionId;
    }
}
var focusExtendedSelector = function (selector, direction) {
    if (selector.charAt(0) == '@') {
        if (selector.length == 1) {
            return focusSection();
        }
        else {
            return focusSection(selector.substr(1));
        }
    }
    else {
        var next = parseSelector(selector)[0];
        if (next) {
            var nextSectionId = getSectionId(next);
            if (isNavigable(next, nextSectionId)) {
                return focusElement(next, nextSectionId, direction);
            }
        }
    }
    return false;
};
function focusSection(sectionId) {
    var range = [];
    var addRange = function (id) {
        if (id && range.indexOf(id) < 0 && _sections[id] && !_sections[id].disabled) {
            range.push(id);
        }
    };
    if (sectionId) {
        addRange(sectionId);
    }
    else {
        addRange(_defaultSectionId);
        addRange(_lastSectionId);
        Object.keys(_sections).map(addRange);
    }
    range.forEach(function (id) {
        var next;
        if (_sections[id].enterTo == 'last-focused') {
            next =
                getSectionLastFocusedElement(id) ||
                    getSectionDefaultElement(id) ||
                    getSectionNavigableElements(id)[0];
        }
        else {
            next =
                getSectionDefaultElement(id) ||
                    getSectionLastFocusedElement(id) ||
                    getSectionNavigableElements(id)[0];
        }
        if (next) {
            return focusElement(next, id);
        }
    });
    return false;
}
function fireNavigateFailed(elem, direction) {
    dispatch(elem, 'navigatefailed', { direction: direction }, false);
}
function gotoLeaveFor(sectionId, direction) {
    var _a, _b;
    var leaveFor = (_b = (_a = _sections[sectionId]) === null || _a === void 0 ? void 0 : _a.leaveFor) === null || _b === void 0 ? void 0 : _b[direction];
    if (leaveFor) {
        if (typeof leaveFor === 'string') {
            if (leaveFor === '') {
                return null;
            }
            return focusExtendedSelector(leaveFor, direction);
        }
        var nextSectionId = getSectionId(leaveFor);
        if (isNavigable(leaveFor, nextSectionId)) {
            return focusElement(leaveFor, nextSectionId, direction);
        }
    }
    return false;
}
function focusNext(direction, currentFocusedElement, currentSectionId) {
    var extSelector = currentFocusedElement.getAttribute('data-sn-' + direction);
    if (typeof extSelector === 'string') {
        if (extSelector === '' || !focusExtendedSelector(extSelector, direction)) {
            fireNavigateFailed(currentFocusedElement, direction);
            return false;
        }
        return true;
    }
    var sectionNavigableElements = {};
    var allNavigableElements = [];
    for (var id in _sections) {
        sectionNavigableElements[id] = getSectionNavigableElements(id);
        allNavigableElements = allNavigableElements.concat(sectionNavigableElements[id]);
    }
    var config = extend({}, globalConfig, _sections[currentSectionId]);
    var next;
    if (config.restrict == 'self-only' || config.restrict == 'self-first') {
        var currentSectionNavigableElements = sectionNavigableElements[currentSectionId];
        next = navigate(currentFocusedElement, direction, exclude(currentSectionNavigableElements, currentFocusedElement), config);
        if (!next && config.restrict == 'self-first') {
            next = navigate(currentFocusedElement, direction, exclude(allNavigableElements, currentSectionNavigableElements), config);
        }
    }
    else {
        next = navigate(currentFocusedElement, direction, exclude(allNavigableElements, currentFocusedElement), config);
    }
    if (next) {
        _sections[currentSectionId].previous = {
            target: currentFocusedElement,
            destination: next,
            reverse: REVERSE[direction]
        };
        var nextSectionId = getSectionId(next);
        if (currentSectionId != nextSectionId) {
            var result = gotoLeaveFor(currentSectionId, direction);
            if (result) {
                return true;
            }
            else if (result === null) {
                fireNavigateFailed(currentFocusedElement, direction);
                return false;
            }
            var enterToElement;
            switch (_sections[nextSectionId].enterTo) {
                case 'last-focused':
                    enterToElement =
                        getSectionLastFocusedElement(nextSectionId) || getSectionDefaultElement(nextSectionId);
                    break;
                case 'default-element':
                    enterToElement = getSectionDefaultElement(nextSectionId);
                    break;
            }
            if (enterToElement) {
                next = enterToElement;
            }
        }
        return focusElement(next, nextSectionId, direction);
    }
    else if (gotoLeaveFor(currentSectionId, direction)) {
        return true;
    }
    fireNavigateFailed(currentFocusedElement, direction);
    return false;
}
function onKeyDown(evt) {
    if (!_sectionCount || _pause || evt.altKey || evt.ctrlKey || evt.metaKey || evt.shiftKey) {
        return;
    }
    var preventDefault = function () {
        evt.preventDefault();
        evt.stopPropagation();
        return false;
    };
    var currentFocusedElement;
    var direction = KEYMAPPING[evt.keyCode];
    if (!direction) {
        if (evt.keyCode == 13) {
            currentFocusedElement = getCurrentFocusedElement();
            if (currentFocusedElement && getSectionId(currentFocusedElement)) {
                if (!dispatch(currentFocusedElement, 'enter-down')) {
                    return preventDefault();
                }
            }
        }
        return;
    }
    currentFocusedElement = getCurrentFocusedElement();
    if (!currentFocusedElement) {
        if (_lastSectionId) {
            currentFocusedElement = getSectionLastFocusedElement(_lastSectionId);
        }
        if (!currentFocusedElement) {
            focusSection();
            return preventDefault();
        }
    }
    var currentSectionId = getSectionId(currentFocusedElement);
    if (!currentSectionId) {
        return;
    }
    var willMoveDetail = {
        direction: direction,
        id: currentSectionId,
        cause: 'keydown'
    };
    if (dispatch(currentFocusedElement, 'willmove', willMoveDetail)) {
        focusNext(direction, currentFocusedElement, currentSectionId);
    }
    return preventDefault();
}
function onKeyUp(evt) {
    if (evt.altKey || evt.ctrlKey || evt.metaKey || evt.shiftKey) {
        return;
    }
    if (!_pause && _sectionCount && evt.keyCode == 13) {
        var currentFocusedElement = getCurrentFocusedElement();
        if (currentFocusedElement && getSectionId(currentFocusedElement)) {
            if (!dispatch(currentFocusedElement, 'enter-up')) {
                evt.preventDefault();
                evt.stopPropagation();
            }
        }
    }
}
function onFocus(evt) {
    var target = evt.target;
    if (target !== window &&
        target !== document &&
        _sectionCount &&
        !_duringFocusChange) {
        var sectionId = getSectionId(target);
        if (sectionId) {
            if (_pause) {
                focusChanged(target, sectionId);
                return;
            }
            var focusProperties = {
                sectionId: sectionId,
                native: true
            };
            if (!dispatch(target, 'willfocus', focusProperties)) {
                _duringFocusChange = true;
                target.blur();
                _duringFocusChange = false;
            }
            else {
                dispatch(target, 'focused', focusProperties, false);
                focusChanged(target, sectionId);
            }
        }
    }
}
function onBlur(evt) {
    var target = evt.target;
    // TODO: Checar se o target pode ser um window ou document
    if (target !== window &&
        target !== document &&
        !_pause &&
        _sectionCount &&
        !_duringFocusChange &&
        getSectionId(target)) {
        var unfocusProperties = {
            native: true
        };
        if (!dispatch(target, 'willunfocus', unfocusProperties)) {
            _duringFocusChange = true;
            setTimeout(function () {
                target.focus();
                _duringFocusChange = false;
            });
        }
        else {
            dispatch(target, 'unfocused', unfocusProperties, false);
        }
    }
}
/*******************/
/* Public Function */
/*******************/
var SpatialNavigation = {
    /**
     * Initializes SpatialNavigation and binds event listeners to the global object. It is a synchronous function, so you don't need to await ready state. Calling init() more than once is possible since SpatialNavigation internally prevents it from reiterating the initialization.
     *
     * Note: It should be called before using any other methods of SpatialNavigation!
     */
    init: function () {
        if (!_ready) {
            window.addEventListener('keydown', onKeyDown);
            window.addEventListener('keyup', onKeyUp);
            window.addEventListener('focus', onFocus, true);
            window.addEventListener('blur', onBlur, true);
            _ready = true;
        }
    },
    /**
     * Uninitializes SpatialNavigation, resets the variable state and unbinds the event listeners.
     */
    uninit: function () {
        window.removeEventListener('blur', onBlur, true);
        window.removeEventListener('focus', onFocus, true);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('keydown', onKeyDown);
        SpatialNavigation.clear();
        _idPool = 0;
        _ready = false;
    },
    /**
     * Resets the variable state without unbinding the event listeners.
     */
    clear: function () {
        _sections = {};
        _sectionCount = 0;
        _defaultSectionId = '';
        _lastSectionId = '';
        _duringFocusChange = false;
    },
    /**
     * Updates the config of the section with the specified `id`. If `id` is omitted, the global configuration will be updated.
     *
     * Omitted properties in config will not affect the original one, which was set by `add()`, so only properties that you want to update need to be listed. In other words, if you want to delete any previously added properties, you have to explicitly assign undefined to those properties in the config.
     */
    set: function (config) {
        // const { id } = config;
        for (var _i = 0, _a = Object.entries(config); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if (globalConfig[key] !== undefined) {
                if (config === null || config === void 0 ? void 0 : config.id) {
                    _sections[config.id][key] = value;
                }
                else if (value !== undefined) {
                    globalConfig[key] = value;
                }
            }
        }
        if (config === null || config === void 0 ? void 0 : config.id) {
            // remove "undefined" items
            _sections[config.id] = extend({}, _sections[config.id]);
        }
    },
    /**
     *
     * Adds a section to SpatialNavigation with its own configuration. The config doesn't have to contain all the properties. Those omitted will inherit global ones automatically.
     *
     * A section is a conceptual scope to define a set of elements no matter where they are in DOM structure. You can group elements based on their functions or behaviors (e.g. main, menu, dialog, etc.) into a section.
     */
    add: function (config) {
        if (!(config === null || config === void 0 ? void 0 : config.id))
            config.id = generateId();
        var id = config.id;
        if (_sections[id]) {
            throw new Error('Section "' + id + '" has already existed!');
        }
        _sections[id] = {};
        _sectionCount++;
        SpatialNavigation.set(config);
        return id;
    },
    /**
     * Removes the section with the specified `id` from SpatialNavigation.
     *
     * Elements defined in this section will not be navigated anymore.
     */
    remove: function (id) {
        if (!id || typeof id !== 'string') {
            throw new Error('Please assign the "id"!');
        }
        if (_sections[id]) {
            _sections[id] = undefined;
            _sections = extend({}, _sections);
            _sectionCount--;
            if (_lastSectionId === id) {
                _lastSectionId = '';
            }
            return true;
        }
        return false;
    },
    /**
     *
     * Disables the section with the specified `id` temporarily. Elements defined in this section will become unnavigable until enable() is called.
     */
    disable: function (id) {
        if (_sections[id]) {
            _sections[id].disabled = true;
            return true;
        }
        return false;
    },
    /**
     * Enables the section with the specified `id`.
     *
     * Elements defined in this section, on which if `disable()` was called earlier, will become navigable again.
     */
    enable: function (id) {
        if (_sections[id]) {
            _sections[id].disabled = false;
            return true;
        }
        return false;
    },
    pause: function () {
        _pause = true;
    },
    resume: function () {
        _pause = false;
    },
    /**
     * Focuses the section with the specified `id` or the first element that matches selector.
     *
     * If the first argument matches any of the existing `id`, it will be regarded as a `id`. Otherwise, it will be treated as selector instead. If omitted, the default section, which is set by `setDefaultSection()`, will be the substitution.
     */
    focus: function (elem, silent) {
        var result = false;
        if (silent === undefined && typeof elem === 'boolean') {
            silent = elem;
            elem = undefined;
        }
        var autoPause = !_pause && silent;
        if (autoPause) {
            SpatialNavigation.pause();
        }
        if (!elem) {
            result = focusSection();
        }
        else {
            if (typeof elem === 'string') {
                if (_sections[elem]) {
                    result = focusSection(elem);
                }
                else {
                    result = focusExtendedSelector(elem);
                }
            }
            else {
                var nextSectionId = getSectionId(elem);
                if (isNavigable(elem, nextSectionId)) {
                    result = focusElement(elem, nextSectionId);
                }
            }
        }
        if (autoPause) {
            SpatialNavigation.resume();
        }
        return result;
    },
    /**
     * Moves the focus to the given direction based on the rule of SpatialNavigation. The first element matching selector is regarded as the origin. If selector is omitted, SpatialNavigation will move the focus based on the currently focused element.
     */
    move: function (direction, selector) {
        if (!REVERSE[direction]) {
            return false;
        }
        var elem = selector ? parseSelector(selector)[0] : getCurrentFocusedElement();
        if (!elem) {
            return false;
        }
        var sectionId = getSectionId(elem);
        if (!sectionId) {
            return false;
        }
        if (!dispatch(elem, 'willmove', {
            direction: direction,
            id: sectionId,
            cause: 'api'
        })) {
            return false;
        }
        return focusNext(direction, elem, sectionId);
    },
    /**
     * A helper to add `tabindex="-1"` to elements defined in the specified section to make them focusable. If `id` is omitted, it applies to all sections.
     *
     * **Note:** It won't affect elements which have been focusable already or have not been appended to DOM tree yet.
     */
    makeFocusable: function (id) {
        var doMakeFocusable = function (section) {
            var tabIndexIgnoreList = section.tabIndexIgnoreList !== undefined
                ? section.tabIndexIgnoreList
                : globalConfig.tabIndexIgnoreList;
            if (section.selector) {
                parseSelector(section.selector).forEach(function (elem) {
                    if (!matchSelector(elem, tabIndexIgnoreList)) {
                        if (!elem.getAttribute('tabindex')) {
                            elem.setAttribute('tabindex', '-1');
                        }
                    }
                });
            }
        };
        if (id) {
            if (_sections[id]) {
                doMakeFocusable(_sections[id]);
            }
            else {
                throw new Error('Section "' + id + '" doesn\'t exist!');
            }
        }
        else {
            for (var _id in _sections) {
                doMakeFocusable(_sections[_id]);
            }
        }
    },
    /**
     * Assigns the specified section to be the default section. It will be used as a substitution in certain methods, of which if sectionId is omitted.
     *
     * Calling this method without the argument can reset the default section to undefined.
     */
    setDefaultSection: function (id) {
        if (!id) {
            _defaultSectionId = '';
        }
        else if (!_sections[id]) {
            throw new Error('Section "' + id + '" doesn\'t exist!');
        }
        else {
            _defaultSectionId = id;
        }
    }
};
export default SpatialNavigation;
