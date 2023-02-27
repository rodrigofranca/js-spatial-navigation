/**
 * indicates the direction given by arrow keys or move() method.
 */
export type Direction = 'up' | 'down' | 'left' | 'right';
type LeaveFor = {
    [key in Direction]: HTMLElement | string;
};
export type Config = {
    /**
     * Giving a sectionId to a section enables you to refer to it in other methods but is not required.
     */
    id?: string;
    /**
     * Elements matching selector are regarded as navigable elements in SpatialNavigation. However, hidden or disabled elements are ignored as they can not be focused in any way.
     *
     * Note: an `selector` can be one of following types:
     * - a valid selector string for `"querySelectorAll"`
     * - a NodeList or an array containing DOM elements
     * - a single DOM element
     * - a string "@{SectionId}" to indicate the specified section
     *
     * @default ''
     */
    selector?: string;
    /**
     * When it is true, only elements in the straight (vertical or horizontal) direction will be navigated. i.e. SpatialNavigation ignores elements in the oblique directions.
     *
     * @default false
     */
    straightOnly?: boolean;
    /**
     * his threshold is used to determine whether an element is considered in the straight (vertical or horizontal) directions. Valid number is between 0 to 1.0.
     *
     * Setting it to 0.3 means that an element is counted in the straight directions only if it overlaps the straight area at least 0.3x of its total area
     *
     * @default 0.5
     */
    straightOverlapThreshold?: number;
    /**
     * When it is true, the previously focused element will have higher priority to be chosen as the next candidate.
     *
     * @default false
     */
    rememberSource?: boolean;
    /**
     * When it is true, elements defined in this section are unnavigable. This property is modified by disable() and enable() as well.
     *
     * @default false
     */
    disabled?: boolean;
    /**
     * When a section is specified to be the next focused target, e.g. `focus('some-section-id')` is called, the first navigable element matching defaultElement within this section will be chosen first.
     *
     * @type {string} - Selector (without @ syntax)
     * @default null
     */
    defaultElement?: HTMLElement | string;
    /**
     * If the focus comes from another section, you can define which element in this section should be focused first.
     *
     * `'last-focused'` indicates the last focused element before we left this section last time. If this section has never been focused yet, the default element (if any) will be chosen next.
     *
     * `'default-element'` indicates the element defined in `defaultElement`.
     *
     * `'' (empty string)` implies following the original rule without any change.
     *
     * @default ''
     */
    enterTo?: 'last-focused' | 'default-element' | '';
    /**
     * This property specifies which element should be focused next when a user presses the corresponding arrow key and intends to leave the current section.
     *
     * It should be a PlainObject consists of four properties: `'left'`, `'right'`, `'up'` and `'down'`. Each property should be a Selector. Any of these properties can be omitted, and SpatialNavigation will follow the original rule to navigate.
     *
     * **Note:** Assigning an empty string to any of these properties makes SpatialNavigation go nowhere at that direction.
     *
     * @default null
     */
    leaveFor?: LeaveFor;
    /**
     * `'self-first'` implies that elements within the same section will have higher priority to be chosen as the next candidate.
     *
     * `'self-only'` implies that elements in the other sections will never be navigated by arrow keys. (However, you can always focus them by calling focus() manually.)
     *
     * `'none'` implies no restriction.
     *
     * @default 'self-first'
     */
    restrict?: 'self-first' | 'self-only' | 'none';
    /**
     * Elements matching tabIndexIgnoreList will never be affected by makeFocusable(). It is usually used to ignore elements that are already focusable.
     *
     * @default 'a, input, select, textarea, button, iframe, [contentEditable=true]'
     */
    tabIndexIgnoreList?: string;
    /**
     * When it is true, hidden elements will be ignored as they can not be focused in any way.
     *
     * @default false
     */
    ignoreHidden?: boolean;
    /**
     * A callback function that accepts a DOM element as the first argument.
     *
     * SpatialNavigation calls this function every time when it tries to traverse every single candidate. You can ignore arbitrary elements by returning false.
     */
    navigableFilter?: (element: HTMLElement, sectionId: string) => boolean;
    /**
     *
     */
    lastFocusedElement?: HTMLElement;
    previous?: {
        target: HTMLElement;
        destination: HTMLElement;
        reverse: Direction;
    };
};
export type GlobalConfig = Partial<Config> & {
    sectionPrefix?: string;
    eventPrefix?: string;
};
export type SpatialEventDetail = {
    /**
     * indicates the direction given by arrow keys or move() method.
     * @type {Direction} - "up" | "down" | "left" | "right"
     */
    direction?: Direction;
    /**
     * indicates the currently focused section.
     */
    id?: string;
    /**
     * indicate where the focus will be moved next.
     */
    nextId?: string;
    /**
     * indicate where the focus will be moved next.
     */
    nextElement?: HTMLElement;
    /**
     * indicates the last focused element before this move.
     */
    previousElement?: HTMLElement;
    /**
     * indicates whether this event is triggered by native focus-related events or not.
     */
    native?: boolean;
    /**
     * indicates why this move happens. 'keydown' means triggered by key events while 'api' means triggered by calling move()) directly.
     */
    cause?: 'keydown' | 'api';
};
export type Rect = {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
    element: HTMLElement;
    center: {
        x: number;
        y: number;
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
};
export type DistanceFunctions = {
    nearPlumbLineIsBetter: (rect: Rect) => number;
    nearHorizonIsBetter: (rect: Rect) => number;
    nearTargetLeftIsBetter: (rect: Rect) => number;
    nearTargetTopIsBetter: (rect: Rect) => number;
    topIsBetter: (rect: Rect) => number;
    bottomIsBetter: (rect: Rect) => number;
    leftIsBetter: (rect: Rect) => number;
    rightIsBetter: (rect: Rect) => number;
};
export type Priority = {
    group: Rect[];
    distance: ((rect: Rect) => number)[];
};
export type Priorities = Priority[];
export {};
