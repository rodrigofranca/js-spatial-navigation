import type { Config, Direction } from './types';
export type { Config, Direction, GlobalConfig, SpatialEventDetail } from './types';
/*******************/
/*******************/
declare const SpatialNavigation: {
    /**
     * Initializes SpatialNavigation and binds event listeners to the global object. It is a synchronous function, so you don't need to await ready state. Calling init() more than once is possible since SpatialNavigation internally prevents it from reiterating the initialization.
     *
     * Note: It should be called before using any other methods of SpatialNavigation!
     */
    init: () => void;
    /**
     * Uninitializes SpatialNavigation, resets the variable state and unbinds the event listeners.
     */
    uninit: () => void;
    /**
     * Resets the variable state without unbinding the event listeners.
     */
    clear: () => void;
    /**
     * Updates the config of the section with the specified `id`. If `id` is omitted, the global configuration will be updated.
     *
     * Omitted properties in config will not affect the original one, which was set by `add()`, so only properties that you want to update need to be listed. In other words, if you want to delete any previously added properties, you have to explicitly assign undefined to those properties in the config.
     */
    set: (config: Config) => void;
    /**
     *
     * Adds a section to SpatialNavigation with its own configuration. The config doesn't have to contain all the properties. Those omitted will inherit global ones automatically.
     *
     * A section is a conceptual scope to define a set of elements no matter where they are in DOM structure. You can group elements based on their functions or behaviors (e.g. main, menu, dialog, etc.) into a section.
     */
    add: (config: Config) => string;
    /**
     * Removes the section with the specified `id` from SpatialNavigation.
     *
     * Elements defined in this section will not be navigated anymore.
     */
    remove: (id: Config['id']) => boolean;
    /**
     *
     * Disables the section with the specified `id` temporarily. Elements defined in this section will become unnavigable until enable() is called.
     */
    disable: (id: Config['id']) => boolean;
    /**
     * Enables the section with the specified `id`.
     *
     * Elements defined in this section, on which if `disable()` was called earlier, will become navigable again.
     */
    enable: (id: string) => boolean;
    pause: () => void;
    resume: () => void;
    /**
     * Focuses the section with the specified `id` or the first element that matches selector.
     *
     * If the first argument matches any of the existing `id`, it will be regarded as a `id`. Otherwise, it will be treated as selector instead. If omitted, the default section, which is set by `setDefaultSection()`, will be the substitution.
     */
    focus: (elem: HTMLElement | string, silent?: boolean) => boolean;
    /**
     * Moves the focus to the given direction based on the rule of SpatialNavigation. The first element matching selector is regarded as the origin. If selector is omitted, SpatialNavigation will move the focus based on the currently focused element.
     */
    move: (direction: Direction, selector?: Config['selector']) => boolean;
    /**
     * A helper to add `tabindex="-1"` to elements defined in the specified section to make them focusable. If `id` is omitted, it applies to all sections.
     *
     * **Note:** It won't affect elements which have been focusable already or have not been appended to DOM tree yet.
     */
    makeFocusable: (id?: Config['id']) => void;
    /**
     * Assigns the specified section to be the default section. It will be used as a substitution in certain methods, of which if sectionId is omitted.
     *
     * Calling this method without the argument can reset the default section to undefined.
     */
    setDefaultSection: (id: string) => void;
};
export default SpatialNavigation;
