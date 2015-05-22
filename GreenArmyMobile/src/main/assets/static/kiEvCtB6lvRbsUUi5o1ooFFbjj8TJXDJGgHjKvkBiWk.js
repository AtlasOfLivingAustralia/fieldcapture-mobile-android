/*!
 * Knockout JavaScript library v3.3.0
 * (c) Steven Sanderson - http://knockoutjs.com/
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 */

(function(){
    var DEBUG=true;
    (function(undefined){
        // (0, eval)('this') is a robust way of getting a reference to the global object
        // For details, see http://stackoverflow.com/questions/14119988/return-this-0-evalthis/14120023#14120023
        var window = this || (0, eval)('this'),
            document = window['document'],
            navigator = window['navigator'],
            jQueryInstance = window["jQuery"],
            JSON = window["JSON"];
        (function(factory) {
            // Support three module loading scenarios
            if (typeof define === 'function' && define['amd']) {
                // [1] AMD anonymous module
                define(['exports', 'require'], factory);
            } else if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
                // [2] CommonJS/Node.js
                factory(module['exports'] || exports);  // module.exports is for Node.js
            } else {
                // [3] No module loader (plain <script> tag) - put directly in global namespace
                factory(window['ko'] = {});
            }
        }(function(koExports, amdRequire){
// Internally, all KO objects are attached to koExports (even the non-exported ones whose names will be minified by the closure compiler).
// In the future, the following "ko" variable may be made distinct from "koExports" so that private objects are not externally reachable.
            var ko = typeof koExports !== 'undefined' ? koExports : {};
// Google Closure Compiler helpers (used only to make the minified file smaller)
            ko.exportSymbol = function(koPath, object) {
                var tokens = koPath.split(".");

                // In the future, "ko" may become distinct from "koExports" (so that non-exported objects are not reachable)
                // At that point, "target" would be set to: (typeof koExports !== "undefined" ? koExports : ko)
                var target = ko;

                for (var i = 0; i < tokens.length - 1; i++)
                    target = target[tokens[i]];
                target[tokens[tokens.length - 1]] = object;
            };
            ko.exportProperty = function(owner, publicName, object) {
                owner[publicName] = object;
            };
            ko.version = "3.3.0";

            ko.exportSymbol('version', ko.version);
            ko.utils = (function () {
                function objectForEach(obj, action) {
                    for (var prop in obj) {
                        if (obj.hasOwnProperty(prop)) {
                            action(prop, obj[prop]);
                        }
                    }
                }

                function extend(target, source) {
                    if (source) {
                        for(var prop in source) {
                            if(source.hasOwnProperty(prop)) {
                                target[prop] = source[prop];
                            }
                        }
                    }
                    return target;
                }

                function setPrototypeOf(obj, proto) {
                    obj.__proto__ = proto;
                    return obj;
                }

                var canSetPrototype = ({ __proto__: [] } instanceof Array);

                // Represent the known event types in a compact way, then at runtime transform it into a hash with event name as key (for fast lookup)
                var knownEvents = {}, knownEventTypesByEventName = {};
                var keyEventTypeName = (navigator && /Firefox\/2/i.test(navigator.userAgent)) ? 'KeyboardEvent' : 'UIEvents';
                knownEvents[keyEventTypeName] = ['keyup', 'keydown', 'keypress'];
                knownEvents['MouseEvents'] = ['click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave'];
                objectForEach(knownEvents, function(eventType, knownEventsForType) {
                    if (knownEventsForType.length) {
                        for (var i = 0, j = knownEventsForType.length; i < j; i++)
                            knownEventTypesByEventName[knownEventsForType[i]] = eventType;
                    }
                });
                var eventsThatMustBeRegisteredUsingAttachEvent = { 'propertychange': true }; // Workaround for an IE9 issue - https://github.com/SteveSanderson/knockout/issues/406

                // Detect IE versions for bug workarounds (uses IE conditionals, not UA string, for robustness)
                // Note that, since IE 10 does not support conditional comments, the following logic only detects IE < 10.
                // Currently this is by design, since IE 10+ behaves correctly when treated as a standard browser.
                // If there is a future need to detect specific versions of IE10+, we will amend this.
                var ieVersion = document && (function() {
                        var version = 3, div = document.createElement('div'), iElems = div.getElementsByTagName('i');

                        // Keep constructing conditional HTML blocks until we hit one that resolves to an empty fragment
                        while (
                            div.innerHTML = '<!--[if gt IE ' + (++version) + ']><i></i><![endif]-->',
                                iElems[0]
                            ) {}
                        return version > 4 ? version : undefined;
                    }());
                var isIe6 = ieVersion === 6,
                    isIe7 = ieVersion === 7;

                function isClickOnCheckableElement(element, eventType) {
                    if ((ko.utils.tagNameLower(element) !== "input") || !element.type) return false;
                    if (eventType.toLowerCase() != "click") return false;
                    var inputType = element.type;
                    return (inputType == "checkbox") || (inputType == "radio");
                }

                // For details on the pattern for changing node classes
                // see: https://github.com/knockout/knockout/issues/1597
                var cssClassNameRegex = /\S+/g;

                function toggleDomNodeCssClass(node, classNames, shouldHaveClass) {
                    var addOrRemoveFn;
                    if (classNames) {
                        if (typeof node.classList === 'object') {
                            addOrRemoveFn = node.classList[shouldHaveClass ? 'add' : 'remove'];
                            ko.utils.arrayForEach(classNames.match(cssClassNameRegex), function(className) {
                                addOrRemoveFn.call(node.classList, className);
                            });
                        } else if (typeof node.className['baseVal'] === 'string') {
                            // SVG tag .classNames is an SVGAnimatedString instance
                            toggleObjectClassPropertyString(node.className, 'baseVal', classNames, shouldHaveClass);
                        } else {
                            // node.className ought to be a string.
                            toggleObjectClassPropertyString(node, 'className', classNames, shouldHaveClass);
                        }
                    }
                }

                function toggleObjectClassPropertyString(obj, prop, classNames, shouldHaveClass) {
                    // obj/prop is either a node/'className' or a SVGAnimatedString/'baseVal'.
                    var currentClassNames = obj[prop].match(cssClassNameRegex) || [];
                    ko.utils.arrayForEach(classNames.match(cssClassNameRegex), function(className) {
                        ko.utils.addOrRemoveItem(currentClassNames, className, shouldHaveClass);
                    });
                    obj[prop] = currentClassNames.join(" ");
                }

                return {
                    fieldsIncludedWithJsonPost: ['authenticity_token', /^__RequestVerificationToken(_.*)?$/],

                    arrayForEach: function (array, action) {
                        for (var i = 0, j = array.length; i < j; i++)
                            action(array[i], i);
                    },

                    arrayIndexOf: function (array, item) {
                        if (typeof Array.prototype.indexOf == "function")
                            return Array.prototype.indexOf.call(array, item);
                        for (var i = 0, j = array.length; i < j; i++)
                            if (array[i] === item)
                                return i;
                        return -1;
                    },

                    arrayFirst: function (array, predicate, predicateOwner) {
                        for (var i = 0, j = array.length; i < j; i++)
                            if (predicate.call(predicateOwner, array[i], i))
                                return array[i];
                        return null;
                    },

                    arrayRemoveItem: function (array, itemToRemove) {
                        var index = ko.utils.arrayIndexOf(array, itemToRemove);
                        if (index > 0) {
                            array.splice(index, 1);
                        }
                        else if (index === 0) {
                            array.shift();
                        }
                    },

                    arrayGetDistinctValues: function (array) {
                        array = array || [];
                        var result = [];
                        for (var i = 0, j = array.length; i < j; i++) {
                            if (ko.utils.arrayIndexOf(result, array[i]) < 0)
                                result.push(array[i]);
                        }
                        return result;
                    },

                    arrayMap: function (array, mapping) {
                        array = array || [];
                        var result = [];
                        for (var i = 0, j = array.length; i < j; i++)
                            result.push(mapping(array[i], i));
                        return result;
                    },

                    arrayFilter: function (array, predicate) {
                        array = array || [];
                        var result = [];
                        for (var i = 0, j = array.length; i < j; i++)
                            if (predicate(array[i], i))
                                result.push(array[i]);
                        return result;
                    },

                    arrayPushAll: function (array, valuesToPush) {
                        if (valuesToPush instanceof Array)
                            array.push.apply(array, valuesToPush);
                        else
                            for (var i = 0, j = valuesToPush.length; i < j; i++)
                                array.push(valuesToPush[i]);
                        return array;
                    },

                    addOrRemoveItem: function(array, value, included) {
                        var existingEntryIndex = ko.utils.arrayIndexOf(ko.utils.peekObservable(array), value);
                        if (existingEntryIndex < 0) {
                            if (included)
                                array.push(value);
                        } else {
                            if (!included)
                                array.splice(existingEntryIndex, 1);
                        }
                    },

                    canSetPrototype: canSetPrototype,

                    extend: extend,

                    setPrototypeOf: setPrototypeOf,

                    setPrototypeOfOrExtend: canSetPrototype ? setPrototypeOf : extend,

                    objectForEach: objectForEach,

                    objectMap: function(source, mapping) {
                        if (!source)
                            return source;
                        var target = {};
                        for (var prop in source) {
                            if (source.hasOwnProperty(prop)) {
                                target[prop] = mapping(source[prop], prop, source);
                            }
                        }
                        return target;
                    },

                    emptyDomNode: function (domNode) {
                        while (domNode.firstChild) {
                            ko.removeNode(domNode.firstChild);
                        }
                    },

                    moveCleanedNodesToContainerElement: function(nodes) {
                        // Ensure it's a real array, as we're about to reparent the nodes and
                        // we don't want the underlying collection to change while we're doing that.
                        var nodesArray = ko.utils.makeArray(nodes);
                        var templateDocument = (nodesArray[0] && nodesArray[0].ownerDocument) || document;

                        var container = templateDocument.createElement('div');
                        for (var i = 0, j = nodesArray.length; i < j; i++) {
                            container.appendChild(ko.cleanNode(nodesArray[i]));
                        }
                        return container;
                    },

                    cloneNodes: function (nodesArray, shouldCleanNodes) {
                        for (var i = 0, j = nodesArray.length, newNodesArray = []; i < j; i++) {
                            var clonedNode = nodesArray[i].cloneNode(true);
                            newNodesArray.push(shouldCleanNodes ? ko.cleanNode(clonedNode) : clonedNode);
                        }
                        return newNodesArray;
                    },

                    setDomNodeChildren: function (domNode, childNodes) {
                        ko.utils.emptyDomNode(domNode);
                        if (childNodes) {
                            for (var i = 0, j = childNodes.length; i < j; i++)
                                domNode.appendChild(childNodes[i]);
                        }
                    },

                    replaceDomNodes: function (nodeToReplaceOrNodeArray, newNodesArray) {
                        var nodesToReplaceArray = nodeToReplaceOrNodeArray.nodeType ? [nodeToReplaceOrNodeArray] : nodeToReplaceOrNodeArray;
                        if (nodesToReplaceArray.length > 0) {
                            var insertionPoint = nodesToReplaceArray[0];
                            var parent = insertionPoint.parentNode;
                            for (var i = 0, j = newNodesArray.length; i < j; i++)
                                parent.insertBefore(newNodesArray[i], insertionPoint);
                            for (var i = 0, j = nodesToReplaceArray.length; i < j; i++) {
                                ko.removeNode(nodesToReplaceArray[i]);
                            }
                        }
                    },

                    fixUpContinuousNodeArray: function(continuousNodeArray, parentNode) {
                        // Before acting on a set of nodes that were previously outputted by a template function, we have to reconcile
                        // them against what is in the DOM right now. It may be that some of the nodes have already been removed, or that
                        // new nodes might have been inserted in the middle, for example by a binding. Also, there may previously have been
                        // leading comment nodes (created by rewritten string-based templates) that have since been removed during binding.
                        // So, this function translates the old "map" output array into its best guess of the set of current DOM nodes.
                        //
                        // Rules:
                        //   [A] Any leading nodes that have been removed should be ignored
                        //       These most likely correspond to memoization nodes that were already removed during binding
                        //       See https://github.com/SteveSanderson/knockout/pull/440
                        //   [B] We want to output a continuous series of nodes. So, ignore any nodes that have already been removed,
                        //       and include any nodes that have been inserted among the previous collection

                        if (continuousNodeArray.length) {
                            // The parent node can be a virtual element; so get the real parent node
                            parentNode = (parentNode.nodeType === 8 && parentNode.parentNode) || parentNode;

                            // Rule [A]
                            while (continuousNodeArray.length && continuousNodeArray[0].parentNode !== parentNode)
                                continuousNodeArray.splice(0, 1);

                            // Rule [B]
                            if (continuousNodeArray.length > 1) {
                                var current = continuousNodeArray[0], last = continuousNodeArray[continuousNodeArray.length - 1];
                                // Replace with the actual new continuous node set
                                continuousNodeArray.length = 0;
                                while (current !== last) {
                                    continuousNodeArray.push(current);
                                    current = current.nextSibling;
                                    if (!current) // Won't happen, except if the developer has manually removed some DOM elements (then we're in an undefined scenario)
                                        return;
                                }
                                continuousNodeArray.push(last);
                            }
                        }
                        return continuousNodeArray;
                    },

                    setOptionNodeSelectionState: function (optionNode, isSelected) {
                        // IE6 sometimes throws "unknown error" if you try to write to .selected directly, whereas Firefox struggles with setAttribute. Pick one based on browser.
                        if (ieVersion < 7)
                            optionNode.setAttribute("selected", isSelected);
                        else
                            optionNode.selected = isSelected;
                    },

                    stringTrim: function (string) {
                        return string === null || string === undefined ? '' :
                            string.trim ?
                                string.trim() :
                                string.toString().replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
                    },

                    stringStartsWith: function (string, startsWith) {
                        string = string || "";
                        if (startsWith.length > string.length)
                            return false;
                        return string.substring(0, startsWith.length) === startsWith;
                    },

                    domNodeIsContainedBy: function (node, containedByNode) {
                        if (node === containedByNode)
                            return true;
                        if (node.nodeType === 11)
                            return false; // Fixes issue #1162 - can't use node.contains for document fragments on IE8
                        if (containedByNode.contains)
                            return containedByNode.contains(node.nodeType === 3 ? node.parentNode : node);
                        if (containedByNode.compareDocumentPosition)
                            return (containedByNode.compareDocumentPosition(node) & 16) == 16;
                        while (node && node != containedByNode) {
                            node = node.parentNode;
                        }
                        return !!node;
                    },

                    domNodeIsAttachedToDocument: function (node) {
                        return ko.utils.domNodeIsContainedBy(node, node.ownerDocument.documentElement);
                    },

                    anyDomNodeIsAttachedToDocument: function(nodes) {
                        return !!ko.utils.arrayFirst(nodes, ko.utils.domNodeIsAttachedToDocument);
                    },

                    tagNameLower: function(element) {
                        // For HTML elements, tagName will always be upper case; for XHTML elements, it'll be lower case.
                        // Possible future optimization: If we know it's an element from an XHTML document (not HTML),
                        // we don't need to do the .toLowerCase() as it will always be lower case anyway.
                        return element && element.tagName && element.tagName.toLowerCase();
                    },

                    registerEventHandler: function (element, eventType, handler) {
                        var mustUseAttachEvent = ieVersion && eventsThatMustBeRegisteredUsingAttachEvent[eventType];
                        if (!mustUseAttachEvent && jQueryInstance) {
                            jQueryInstance(element)['bind'](eventType, handler);
                        } else if (!mustUseAttachEvent && typeof element.addEventListener == "function")
                            element.addEventListener(eventType, handler, false);
                        else if (typeof element.attachEvent != "undefined") {
                            var attachEventHandler = function (event) { handler.call(element, event); },
                                attachEventName = "on" + eventType;
                            element.attachEvent(attachEventName, attachEventHandler);

                            // IE does not dispose attachEvent handlers automatically (unlike with addEventListener)
                            // so to avoid leaks, we have to remove them manually. See bug #856
                            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                                element.detachEvent(attachEventName, attachEventHandler);
                            });
                        } else
                            throw new Error("Browser doesn't support addEventListener or attachEvent");
                    },

                    triggerEvent: function (element, eventType) {
                        if (!(element && element.nodeType))
                            throw new Error("element must be a DOM node when calling triggerEvent");

                        // For click events on checkboxes and radio buttons, jQuery toggles the element checked state *after* the
                        // event handler runs instead of *before*. (This was fixed in 1.9 for checkboxes but not for radio buttons.)
                        // IE doesn't change the checked state when you trigger the click event using "fireEvent".
                        // In both cases, we'll use the click method instead.
                        var useClickWorkaround = isClickOnCheckableElement(element, eventType);

                        if (jQueryInstance && !useClickWorkaround) {
                            jQueryInstance(element)['trigger'](eventType);
                        } else if (typeof document.createEvent == "function") {
                            if (typeof element.dispatchEvent == "function") {
                                var eventCategory = knownEventTypesByEventName[eventType] || "HTMLEvents";
                                var event = document.createEvent(eventCategory);
                                event.initEvent(eventType, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, element);
                                element.dispatchEvent(event);
                            }
                            else
                                throw new Error("The supplied element doesn't support dispatchEvent");
                        } else if (useClickWorkaround && element.click) {
                            element.click();
                        } else if (typeof element.fireEvent != "undefined") {
                            element.fireEvent("on" + eventType);
                        } else {
                            throw new Error("Browser doesn't support triggering events");
                        }
                    },

                    unwrapObservable: function (value) {
                        return ko.isObservable(value) ? value() : value;
                    },

                    peekObservable: function (value) {
                        return ko.isObservable(value) ? value.peek() : value;
                    },

                    toggleDomNodeCssClass: toggleDomNodeCssClass,

                    setTextContent: function(element, textContent) {
                        var value = ko.utils.unwrapObservable(textContent);
                        if ((value === null) || (value === undefined))
                            value = "";

                        // We need there to be exactly one child: a text node.
                        // If there are no children, more than one, or if it's not a text node,
                        // we'll clear everything and create a single text node.
                        var innerTextNode = ko.virtualElements.firstChild(element);
                        if (!innerTextNode || innerTextNode.nodeType != 3 || ko.virtualElements.nextSibling(innerTextNode)) {
                            ko.virtualElements.setDomNodeChildren(element, [element.ownerDocument.createTextNode(value)]);
                        } else {
                            innerTextNode.data = value;
                        }

                        ko.utils.forceRefresh(element);
                    },

                    setElementName: function(element, name) {
                        element.name = name;

                        // Workaround IE 6/7 issue
                        // - https://github.com/SteveSanderson/knockout/issues/197
                        // - http://www.matts411.com/post/setting_the_name_attribute_in_ie_dom/
                        if (ieVersion <= 7) {
                            try {
                                element.mergeAttributes(document.createElement("<input name='" + element.name + "'/>"), false);
                            }
                            catch(e) {} // For IE9 with doc mode "IE9 Standards" and browser mode "IE9 Compatibility View"
                        }
                    },

                    forceRefresh: function(node) {
                        // Workaround for an IE9 rendering bug - https://github.com/SteveSanderson/knockout/issues/209
                        if (ieVersion >= 9) {
                            // For text nodes and comment nodes (most likely virtual elements), we will have to refresh the container
                            var elem = node.nodeType == 1 ? node : node.parentNode;
                            if (elem.style)
                                elem.style.zoom = elem.style.zoom;
                        }
                    },

                    ensureSelectElementIsRenderedCorrectly: function(selectElement) {
                        // Workaround for IE9 rendering bug - it doesn't reliably display all the text in dynamically-added select boxes unless you force it to re-render by updating the width.
                        // (See https://github.com/SteveSanderson/knockout/issues/312, http://stackoverflow.com/questions/5908494/select-only-shows-first-char-of-selected-option)
                        // Also fixes IE7 and IE8 bug that causes selects to be zero width if enclosed by 'if' or 'with'. (See issue #839)
                        if (ieVersion) {
                            var originalWidth = selectElement.style.width;
                            selectElement.style.width = 0;
                            selectElement.style.width = originalWidth;
                        }
                    },

                    range: function (min, max) {
                        min = ko.utils.unwrapObservable(min);
                        max = ko.utils.unwrapObservable(max);
                        var result = [];
                        for (var i = min; i <= max; i++)
                            result.push(i);
                        return result;
                    },

                    makeArray: function(arrayLikeObject) {
                        var result = [];
                        for (var i = 0, j = arrayLikeObject.length; i < j; i++) {
                            result.push(arrayLikeObject[i]);
                        };
                        return result;
                    },

                    isIe6 : isIe6,
                    isIe7 : isIe7,
                    ieVersion : ieVersion,

                    getFormFields: function(form, fieldName) {
                        var fields = ko.utils.makeArray(form.getElementsByTagName("input")).concat(ko.utils.makeArray(form.getElementsByTagName("textarea")));
                        var isMatchingField = (typeof fieldName == 'string')
                            ? function(field) { return field.name === fieldName }
                            : function(field) { return fieldName.test(field.name) }; // Treat fieldName as regex or object containing predicate
                        var matches = [];
                        for (var i = fields.length - 1; i >= 0; i--) {
                            if (isMatchingField(fields[i]))
                                matches.push(fields[i]);
                        };
                        return matches;
                    },

                    parseJson: function (jsonString) {
                        if (typeof jsonString == "string") {
                            jsonString = ko.utils.stringTrim(jsonString);
                            if (jsonString) {
                                if (JSON && JSON.parse) // Use native parsing where available
                                    return JSON.parse(jsonString);
                                return (new Function("return " + jsonString))(); // Fallback on less safe parsing for older browsers
                            }
                        }
                        return null;
                    },

                    stringifyJson: function (data, replacer, space) {   // replacer and space are optional
                        if (!JSON || !JSON.stringify)
                            throw new Error("Cannot find JSON.stringify(). Some browsers (e.g., IE < 8) don't support it natively, but you can overcome this by adding a script reference to json2.js, downloadable from http://www.json.org/json2.js");
                        return JSON.stringify(ko.utils.unwrapObservable(data), replacer, space);
                    },

                    postJson: function (urlOrForm, data, options) {
                        options = options || {};
                        var params = options['params'] || {};
                        var includeFields = options['includeFields'] || this.fieldsIncludedWithJsonPost;
                        var url = urlOrForm;

                        // If we were given a form, use its 'action' URL and pick out any requested field values
                        if((typeof urlOrForm == 'object') && (ko.utils.tagNameLower(urlOrForm) === "form")) {
                            var originalForm = urlOrForm;
                            url = originalForm.action;
                            for (var i = includeFields.length - 1; i >= 0; i--) {
                                var fields = ko.utils.getFormFields(originalForm, includeFields[i]);
                                for (var j = fields.length - 1; j >= 0; j--)
                                    params[fields[j].name] = fields[j].value;
                            }
                        }

                        data = ko.utils.unwrapObservable(data);
                        var form = document.createElement("form");
                        form.style.display = "none";
                        form.action = url;
                        form.method = "post";
                        for (var key in data) {
                            // Since 'data' this is a model object, we include all properties including those inherited from its prototype
                            var input = document.createElement("input");
                            input.type = "hidden";
                            input.name = key;
                            input.value = ko.utils.stringifyJson(ko.utils.unwrapObservable(data[key]));
                            form.appendChild(input);
                        }
                        objectForEach(params, function(key, value) {
                            var input = document.createElement("input");
                            input.type = "hidden";
                            input.name = key;
                            input.value = value;
                            form.appendChild(input);
                        });
                        document.body.appendChild(form);
                        options['submitter'] ? options['submitter'](form) : form.submit();
                        setTimeout(function () { form.parentNode.removeChild(form); }, 0);
                    }
                }
            }());

            ko.exportSymbol('utils', ko.utils);
            ko.exportSymbol('utils.arrayForEach', ko.utils.arrayForEach);
            ko.exportSymbol('utils.arrayFirst', ko.utils.arrayFirst);
            ko.exportSymbol('utils.arrayFilter', ko.utils.arrayFilter);
            ko.exportSymbol('utils.arrayGetDistinctValues', ko.utils.arrayGetDistinctValues);
            ko.exportSymbol('utils.arrayIndexOf', ko.utils.arrayIndexOf);
            ko.exportSymbol('utils.arrayMap', ko.utils.arrayMap);
            ko.exportSymbol('utils.arrayPushAll', ko.utils.arrayPushAll);
            ko.exportSymbol('utils.arrayRemoveItem', ko.utils.arrayRemoveItem);
            ko.exportSymbol('utils.extend', ko.utils.extend);
            ko.exportSymbol('utils.fieldsIncludedWithJsonPost', ko.utils.fieldsIncludedWithJsonPost);
            ko.exportSymbol('utils.getFormFields', ko.utils.getFormFields);
            ko.exportSymbol('utils.peekObservable', ko.utils.peekObservable);
            ko.exportSymbol('utils.postJson', ko.utils.postJson);
            ko.exportSymbol('utils.parseJson', ko.utils.parseJson);
            ko.exportSymbol('utils.registerEventHandler', ko.utils.registerEventHandler);
            ko.exportSymbol('utils.stringifyJson', ko.utils.stringifyJson);
            ko.exportSymbol('utils.range', ko.utils.range);
            ko.exportSymbol('utils.toggleDomNodeCssClass', ko.utils.toggleDomNodeCssClass);
            ko.exportSymbol('utils.triggerEvent', ko.utils.triggerEvent);
            ko.exportSymbol('utils.unwrapObservable', ko.utils.unwrapObservable);
            ko.exportSymbol('utils.objectForEach', ko.utils.objectForEach);
            ko.exportSymbol('utils.addOrRemoveItem', ko.utils.addOrRemoveItem);
            ko.exportSymbol('utils.setTextContent', ko.utils.setTextContent);
            ko.exportSymbol('unwrap', ko.utils.unwrapObservable); // Convenient shorthand, because this is used so commonly

            if (!Function.prototype['bind']) {
                // Function.prototype.bind is a standard part of ECMAScript 5th Edition (December 2009, http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-262.pdf)
                // In case the browser doesn't implement it natively, provide a JavaScript implementation. This implementation is based on the one in prototype.js
                Function.prototype['bind'] = function (object) {
                    var originalFunction = this;
                    if (arguments.length === 1) {
                        return function () {
                            return originalFunction.apply(object, arguments);
                        };
                    } else {
                        var partialArgs = Array.prototype.slice.call(arguments, 1);
                        return function () {
                            var args = partialArgs.slice(0);
                            args.push.apply(args, arguments);
                            return originalFunction.apply(object, args);
                        };
                    }
                };
            }

            ko.utils.domData = new (function () {
                var uniqueId = 0;
                var dataStoreKeyExpandoPropertyName = "__ko__" + (new Date).getTime();
                var dataStore = {};

                function getAll(node, createIfNotFound) {
                    var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
                    var hasExistingDataStore = dataStoreKey && (dataStoreKey !== "null") && dataStore[dataStoreKey];
                    if (!hasExistingDataStore) {
                        if (!createIfNotFound)
                            return undefined;
                        dataStoreKey = node[dataStoreKeyExpandoPropertyName] = "ko" + uniqueId++;
                        dataStore[dataStoreKey] = {};
                    }
                    return dataStore[dataStoreKey];
                }

                return {
                    get: function (node, key) {
                        var allDataForNode = getAll(node, false);
                        return allDataForNode === undefined ? undefined : allDataForNode[key];
                    },
                    set: function (node, key, value) {
                        if (value === undefined) {
                            // Make sure we don't actually create a new domData key if we are actually deleting a value
                            if (getAll(node, false) === undefined)
                                return;
                        }
                        var allDataForNode = getAll(node, true);
                        allDataForNode[key] = value;
                    },
                    clear: function (node) {
                        var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
                        if (dataStoreKey) {
                            delete dataStore[dataStoreKey];
                            node[dataStoreKeyExpandoPropertyName] = null;
                            return true; // Exposing "did clean" flag purely so specs can infer whether things have been cleaned up as intended
                        }
                        return false;
                    },

                    nextKey: function () {
                        return (uniqueId++) + dataStoreKeyExpandoPropertyName;
                    }
                };
            })();

            ko.exportSymbol('utils.domData', ko.utils.domData);
            ko.exportSymbol('utils.domData.clear', ko.utils.domData.clear); // Exporting only so specs can clear up after themselves fully

            ko.utils.domNodeDisposal = new (function () {
                var domDataKey = ko.utils.domData.nextKey();
                var cleanableNodeTypes = { 1: true, 8: true, 9: true };       // Element, Comment, Document
                var cleanableNodeTypesWithDescendants = { 1: true, 9: true }; // Element, Document

                function getDisposeCallbacksCollection(node, createIfNotFound) {
                    var allDisposeCallbacks = ko.utils.domData.get(node, domDataKey);
                    if ((allDisposeCallbacks === undefined) && createIfNotFound) {
                        allDisposeCallbacks = [];
                        ko.utils.domData.set(node, domDataKey, allDisposeCallbacks);
                    }
                    return allDisposeCallbacks;
                }
                function destroyCallbacksCollection(node) {
                    ko.utils.domData.set(node, domDataKey, undefined);
                }

                function cleanSingleNode(node) {
                    // Run all the dispose callbacks
                    var callbacks = getDisposeCallbacksCollection(node, false);
                    if (callbacks) {
                        callbacks = callbacks.slice(0); // Clone, as the array may be modified during iteration (typically, callbacks will remove themselves)
                        for (var i = 0; i < callbacks.length; i++)
                            callbacks[i](node);
                    }

                    // Erase the DOM data
                    ko.utils.domData.clear(node);

                    // Perform cleanup needed by external libraries (currently only jQuery, but can be extended)
                    ko.utils.domNodeDisposal["cleanExternalData"](node);

                    // Clear any immediate-child comment nodes, as these wouldn't have been found by
                    // node.getElementsByTagName("*") in cleanNode() (comment nodes aren't elements)
                    if (cleanableNodeTypesWithDescendants[node.nodeType])
                        cleanImmediateCommentTypeChildren(node);
                }

                function cleanImmediateCommentTypeChildren(nodeWithChildren) {
                    var child, nextChild = nodeWithChildren.firstChild;
                    while (child = nextChild) {
                        nextChild = child.nextSibling;
                        if (child.nodeType === 8)
                            cleanSingleNode(child);
                    }
                }

                return {
                    addDisposeCallback : function(node, callback) {
                        if (typeof callback != "function")
                            throw new Error("Callback must be a function");
                        getDisposeCallbacksCollection(node, true).push(callback);
                    },

                    removeDisposeCallback : function(node, callback) {
                        var callbacksCollection = getDisposeCallbacksCollection(node, false);
                        if (callbacksCollection) {
                            ko.utils.arrayRemoveItem(callbacksCollection, callback);
                            if (callbacksCollection.length == 0)
                                destroyCallbacksCollection(node);
                        }
                    },

                    cleanNode : function(node) {
                        // First clean this node, where applicable
                        if (cleanableNodeTypes[node.nodeType]) {
                            cleanSingleNode(node);

                            // ... then its descendants, where applicable
                            if (cleanableNodeTypesWithDescendants[node.nodeType]) {
                                // Clone the descendants list in case it changes during iteration
                                var descendants = [];
                                ko.utils.arrayPushAll(descendants, node.getElementsByTagName("*"));
                                for (var i = 0, j = descendants.length; i < j; i++)
                                    cleanSingleNode(descendants[i]);
                            }
                        }
                        return node;
                    },

                    removeNode : function(node) {
                        ko.cleanNode(node);
                        if (node.parentNode)
                            node.parentNode.removeChild(node);
                    },

                    "cleanExternalData" : function (node) {
                        // Special support for jQuery here because it's so commonly used.
                        // Many jQuery plugins (including jquery.tmpl) store data using jQuery's equivalent of domData
                        // so notify it to tear down any resources associated with the node & descendants here.
                        if (jQueryInstance && (typeof jQueryInstance['cleanData'] == "function"))
                            jQueryInstance['cleanData']([node]);
                    }
                };
            })();
            ko.cleanNode = ko.utils.domNodeDisposal.cleanNode; // Shorthand name for convenience
            ko.removeNode = ko.utils.domNodeDisposal.removeNode; // Shorthand name for convenience
            ko.exportSymbol('cleanNode', ko.cleanNode);
            ko.exportSymbol('removeNode', ko.removeNode);
            ko.exportSymbol('utils.domNodeDisposal', ko.utils.domNodeDisposal);
            ko.exportSymbol('utils.domNodeDisposal.addDisposeCallback', ko.utils.domNodeDisposal.addDisposeCallback);
            ko.exportSymbol('utils.domNodeDisposal.removeDisposeCallback', ko.utils.domNodeDisposal.removeDisposeCallback);
            (function () {
                var leadingCommentRegex = /^(\s*)<!--(.*?)-->/;

                function simpleHtmlParse(html, documentContext) {
                    documentContext || (documentContext = document);
                    var windowContext = documentContext['parentWindow'] || documentContext['defaultView'] || window;

                    // Based on jQuery's "clean" function, but only accounting for table-related elements.
                    // If you have referenced jQuery, this won't be used anyway - KO will use jQuery's "clean" function directly

                    // Note that there's still an issue in IE < 9 whereby it will discard comment nodes that are the first child of
                    // a descendant node. For example: "<div><!-- mycomment -->abc</div>" will get parsed as "<div>abc</div>"
                    // This won't affect anyone who has referenced jQuery, and there's always the workaround of inserting a dummy node
                    // (possibly a text node) in front of the comment. So, KO does not attempt to workaround this IE issue automatically at present.

                    // Trim whitespace, otherwise indexOf won't work as expected
                    var tags = ko.utils.stringTrim(html).toLowerCase(), div = documentContext.createElement("div");

                    // Finds the first match from the left column, and returns the corresponding "wrap" data from the right column
                    var wrap = tags.match(/^<(thead|tbody|tfoot)/)              && [1, "<table>", "</table>"] ||
                        !tags.indexOf("<tr")                             && [2, "<table><tbody>", "</tbody></table>"] ||
                        (!tags.indexOf("<td") || !tags.indexOf("<th"))   && [3, "<table><tbody><tr>", "</tr></tbody></table>"] ||
                            /* anything else */                                 [0, "", ""];

                    // Go to html and back, then peel off extra wrappers
                    // Note that we always prefix with some dummy text, because otherwise, IE<9 will strip out leading comment nodes in descendants. Total madness.
                    var markup = "ignored<div>" + wrap[1] + html + wrap[2] + "</div>";
                    if (typeof windowContext['innerShiv'] == "function") {
                        div.appendChild(windowContext['innerShiv'](markup));
                    } else {
                        div.innerHTML = markup;
                    }

                    // Move to the right depth
                    while (wrap[0]--)
                        div = div.lastChild;

                    return ko.utils.makeArray(div.lastChild.childNodes);
                }

                function jQueryHtmlParse(html, documentContext) {
                    // jQuery's "parseHTML" function was introduced in jQuery 1.8.0 and is a documented public API.
                    if (jQueryInstance['parseHTML']) {
                        return jQueryInstance['parseHTML'](html, documentContext) || []; // Ensure we always return an array and never null
                    } else {
                        // For jQuery < 1.8.0, we fall back on the undocumented internal "clean" function.
                        var elems = jQueryInstance['clean']([html], documentContext);

                        // As of jQuery 1.7.1, jQuery parses the HTML by appending it to some dummy parent nodes held in an in-memory document fragment.
                        // Unfortunately, it never clears the dummy parent nodes from the document fragment, so it leaks memory over time.
                        // Fix this by finding the top-most dummy parent element, and detaching it from its owner fragment.
                        if (elems && elems[0]) {
                            // Find the top-most parent element that's a direct child of a document fragment
                            var elem = elems[0];
                            while (elem.parentNode && elem.parentNode.nodeType !== 11 /* i.e., DocumentFragment */)
                                elem = elem.parentNode;
                            // ... then detach it
                            if (elem.parentNode)
                                elem.parentNode.removeChild(elem);
                        }

                        return elems;
                    }
                }

                ko.utils.parseHtmlFragment = function(html, documentContext) {
                    return jQueryInstance ? jQueryHtmlParse(html, documentContext)   // As below, benefit from jQuery's optimisations where possible
                        : simpleHtmlParse(html, documentContext);  // ... otherwise, this simple logic will do in most common cases.
                };

                ko.utils.setHtml = function(node, html) {
                    ko.utils.emptyDomNode(node);

                    // There's no legitimate reason to display a stringified observable without unwrapping it, so we'll unwrap it
                    html = ko.utils.unwrapObservable(html);

                    if ((html !== null) && (html !== undefined)) {
                        if (typeof html != 'string')
                            html = html.toString();

                        // jQuery contains a lot of sophisticated code to parse arbitrary HTML fragments,
                        // for example <tr> elements which are not normally allowed to exist on their own.
                        // If you've referenced jQuery we'll use that rather than duplicating its code.
                        if (jQueryInstance) {
                            jQueryInstance(node)['html'](html);
                        } else {
                            // ... otherwise, use KO's own parsing logic.
                            var parsedNodes = ko.utils.parseHtmlFragment(html, node.ownerDocument);
                            for (var i = 0; i < parsedNodes.length; i++)
                                node.appendChild(parsedNodes[i]);
                        }
                    }
                };
            })();

            ko.exportSymbol('utils.parseHtmlFragment', ko.utils.parseHtmlFragment);
            ko.exportSymbol('utils.setHtml', ko.utils.setHtml);

            ko.memoization = (function () {
                var memos = {};

                function randomMax8HexChars() {
                    return (((1 + Math.random()) * 0x100000000) | 0).toString(16).substring(1);
                }
                function generateRandomId() {
                    return randomMax8HexChars() + randomMax8HexChars();
                }
                function findMemoNodes(rootNode, appendToArray) {
                    if (!rootNode)
                        return;
                    if (rootNode.nodeType == 8) {
                        var memoId = ko.memoization.parseMemoText(rootNode.nodeValue);
                        if (memoId != null)
                            appendToArray.push({ domNode: rootNode, memoId: memoId });
                    } else if (rootNode.nodeType == 1) {
                        for (var i = 0, childNodes = rootNode.childNodes, j = childNodes.length; i < j; i++)
                            findMemoNodes(childNodes[i], appendToArray);
                    }
                }

                return {
                    memoize: function (callback) {
                        if (typeof callback != "function")
                            throw new Error("You can only pass a function to ko.memoization.memoize()");
                        var memoId = generateRandomId();
                        memos[memoId] = callback;
                        return "<!--[ko_memo:" + memoId + "]-->";
                    },

                    unmemoize: function (memoId, callbackParams) {
                        var callback = memos[memoId];
                        if (callback === undefined)
                            throw new Error("Couldn't find any memo with ID " + memoId + ". Perhaps it's already been unmemoized.");
                        try {
                            callback.apply(null, callbackParams || []);
                            return true;
                        }
                        finally { delete memos[memoId]; }
                    },

                    unmemoizeDomNodeAndDescendants: function (domNode, extraCallbackParamsArray) {
                        var memos = [];
                        findMemoNodes(domNode, memos);
                        for (var i = 0, j = memos.length; i < j; i++) {
                            var node = memos[i].domNode;
                            var combinedParams = [node];
                            if (extraCallbackParamsArray)
                                ko.utils.arrayPushAll(combinedParams, extraCallbackParamsArray);
                            ko.memoization.unmemoize(memos[i].memoId, combinedParams);
                            node.nodeValue = ""; // Neuter this node so we don't try to unmemoize it again
                            if (node.parentNode)
                                node.parentNode.removeChild(node); // If possible, erase it totally (not always possible - someone else might just hold a reference to it then call unmemoizeDomNodeAndDescendants again)
                        }
                    },

                    parseMemoText: function (memoText) {
                        var match = memoText.match(/^\[ko_memo\:(.*?)\]$/);
                        return match ? match[1] : null;
                    }
                };
            })();

            ko.exportSymbol('memoization', ko.memoization);
            ko.exportSymbol('memoization.memoize', ko.memoization.memoize);
            ko.exportSymbol('memoization.unmemoize', ko.memoization.unmemoize);
            ko.exportSymbol('memoization.parseMemoText', ko.memoization.parseMemoText);
            ko.exportSymbol('memoization.unmemoizeDomNodeAndDescendants', ko.memoization.unmemoizeDomNodeAndDescendants);
            ko.extenders = {
                'throttle': function(target, timeout) {
                    // Throttling means two things:

                    // (1) For dependent observables, we throttle *evaluations* so that, no matter how fast its dependencies
                    //     notify updates, the target doesn't re-evaluate (and hence doesn't notify) faster than a certain rate
                    target['throttleEvaluation'] = timeout;

                    // (2) For writable targets (observables, or writable dependent observables), we throttle *writes*
                    //     so the target cannot change value synchronously or faster than a certain rate
                    var writeTimeoutInstance = null;
                    return ko.dependentObservable({
                        'read': target,
                        'write': function(value) {
                            clearTimeout(writeTimeoutInstance);
                            writeTimeoutInstance = setTimeout(function() {
                                target(value);
                            }, timeout);
                        }
                    });
                },

                'rateLimit': function(target, options) {
                    var timeout, method, limitFunction;

                    if (typeof options == 'number') {
                        timeout = options;
                    } else {
                        timeout = options['timeout'];
                        method = options['method'];
                    }

                    limitFunction = method == 'notifyWhenChangesStop' ?  debounce : throttle;
                    target.limit(function(callback) {
                        return limitFunction(callback, timeout);
                    });
                },

                'notify': function(target, notifyWhen) {
                    target["equalityComparer"] = notifyWhen == "always" ?
                        null :  // null equalityComparer means to always notify
                        valuesArePrimitiveAndEqual;
                }
            };

            var primitiveTypes = { 'undefined':1, 'boolean':1, 'number':1, 'string':1 };
            function valuesArePrimitiveAndEqual(a, b) {
                var oldValueIsPrimitive = (a === null) || (typeof(a) in primitiveTypes);
                return oldValueIsPrimitive ? (a === b) : false;
            }

            function throttle(callback, timeout) {
                var timeoutInstance;
                return function () {
                    if (!timeoutInstance) {
                        timeoutInstance = setTimeout(function() {
                            timeoutInstance = undefined;
                            callback();
                        }, timeout);
                    }
                };
            }

            function debounce(callback, timeout) {
                var timeoutInstance;
                return function () {
                    clearTimeout(timeoutInstance);
                    timeoutInstance = setTimeout(callback, timeout);
                };
            }

            function applyExtenders(requestedExtenders) {
                var target = this;
                if (requestedExtenders) {
                    ko.utils.objectForEach(requestedExtenders, function(key, value) {
                        var extenderHandler = ko.extenders[key];
                        if (typeof extenderHandler == 'function') {
                            target = extenderHandler(target, value) || target;
                        }
                    });
                }
                return target;
            }

            ko.exportSymbol('extenders', ko.extenders);

            ko.subscription = function (target, callback, disposeCallback) {
                this._target = target;
                this.callback = callback;
                this.disposeCallback = disposeCallback;
                this.isDisposed = false;
                ko.exportProperty(this, 'dispose', this.dispose);
            };
            ko.subscription.prototype.dispose = function () {
                this.isDisposed = true;
                this.disposeCallback();
            };

            ko.subscribable = function () {
                ko.utils.setPrototypeOfOrExtend(this, ko.subscribable['fn']);
                this._subscriptions = {};
                this._versionNumber = 1;
            }

            var defaultEvent = "change";

            var ko_subscribable_fn = {
                subscribe: function (callback, callbackTarget, event) {
                    var self = this;

                    event = event || defaultEvent;
                    var boundCallback = callbackTarget ? callback.bind(callbackTarget) : callback;

                    var subscription = new ko.subscription(self, boundCallback, function () {
                        ko.utils.arrayRemoveItem(self._subscriptions[event], subscription);
                        if (self.afterSubscriptionRemove)
                            self.afterSubscriptionRemove(event);
                    });

                    if (self.beforeSubscriptionAdd)
                        self.beforeSubscriptionAdd(event);

                    if (!self._subscriptions[event])
                        self._subscriptions[event] = [];
                    self._subscriptions[event].push(subscription);

                    return subscription;
                },

                "notifySubscribers": function (valueToNotify, event) {
                    event = event || defaultEvent;
                    if (event === defaultEvent) {
                        this.updateVersion();
                    }
                    if (this.hasSubscriptionsForEvent(event)) {
                        try {
                            ko.dependencyDetection.begin(); // Begin suppressing dependency detection (by setting the top frame to undefined)
                            for (var a = this._subscriptions[event].slice(0), i = 0, subscription; subscription = a[i]; ++i) {
                                // In case a subscription was disposed during the arrayForEach cycle, check
                                // for isDisposed on each subscription before invoking its callback
                                if (!subscription.isDisposed)
                                    subscription.callback(valueToNotify);
                            }
                        } finally {
                            ko.dependencyDetection.end(); // End suppressing dependency detection
                        }
                    }
                },

                getVersion: function () {
                    return this._versionNumber;
                },

                hasChanged: function (versionToCheck) {
                    return this.getVersion() !== versionToCheck;
                },

                updateVersion: function () {
                    ++this._versionNumber;
                },

                limit: function(limitFunction) {
                    var self = this, selfIsObservable = ko.isObservable(self),
                        isPending, previousValue, pendingValue, beforeChange = 'beforeChange';

                    if (!self._origNotifySubscribers) {
                        self._origNotifySubscribers = self["notifySubscribers"];
                        self["notifySubscribers"] = function(value, event) {
                            if (!event || event === defaultEvent) {
                                self._rateLimitedChange(value);
                            } else if (event === beforeChange) {
                                self._rateLimitedBeforeChange(value);
                            } else {
                                self._origNotifySubscribers(value, event);
                            }
                        };
                    }

                    var finish = limitFunction(function() {
                        // If an observable provided a reference to itself, access it to get the latest value.
                        // This allows computed observables to delay calculating their value until needed.
                        if (selfIsObservable && pendingValue === self) {
                            pendingValue = self();
                        }
                        isPending = false;
                        if (self.isDifferent(previousValue, pendingValue)) {
                            self._origNotifySubscribers(previousValue = pendingValue);
                        }
                    });

                    self._rateLimitedChange = function(value) {
                        isPending = true;
                        pendingValue = value;
                        finish();
                    };
                    self._rateLimitedBeforeChange = function(value) {
                        if (!isPending) {
                            previousValue = value;
                            self._origNotifySubscribers(value, beforeChange);
                        }
                    };
                },

                hasSubscriptionsForEvent: function(event) {
                    return this._subscriptions[event] && this._subscriptions[event].length;
                },

                getSubscriptionsCount: function (event) {
                    if (event) {
                        return this._subscriptions[event] && this._subscriptions[event].length || 0;
                    } else {
                        var total = 0;
                        ko.utils.objectForEach(this._subscriptions, function(eventName, subscriptions) {
                            total += subscriptions.length;
                        });
                        return total;
                    }
                },

                isDifferent: function(oldValue, newValue) {
                    return !this['equalityComparer'] || !this['equalityComparer'](oldValue, newValue);
                },

                extend: applyExtenders
            };

            ko.exportProperty(ko_subscribable_fn, 'subscribe', ko_subscribable_fn.subscribe);
            ko.exportProperty(ko_subscribable_fn, 'extend', ko_subscribable_fn.extend);
            ko.exportProperty(ko_subscribable_fn, 'getSubscriptionsCount', ko_subscribable_fn.getSubscriptionsCount);

// For browsers that support proto assignment, we overwrite the prototype of each
// observable instance. Since observables are functions, we need Function.prototype
// to still be in the prototype chain.
            if (ko.utils.canSetPrototype) {
                ko.utils.setPrototypeOf(ko_subscribable_fn, Function.prototype);
            }

            ko.subscribable['fn'] = ko_subscribable_fn;


            ko.isSubscribable = function (instance) {
                return instance != null && typeof instance.subscribe == "function" && typeof instance["notifySubscribers"] == "function";
            };

            ko.exportSymbol('subscribable', ko.subscribable);
            ko.exportSymbol('isSubscribable', ko.isSubscribable);

            ko.computedContext = ko.dependencyDetection = (function () {
                var outerFrames = [],
                    currentFrame,
                    lastId = 0;

                // Return a unique ID that can be assigned to an observable for dependency tracking.
                // Theoretically, you could eventually overflow the number storage size, resulting
                // in duplicate IDs. But in JavaScript, the largest exact integral value is 2^53
                // or 9,007,199,254,740,992. If you created 1,000,000 IDs per second, it would
                // take over 285 years to reach that number.
                // Reference http://blog.vjeux.com/2010/javascript/javascript-max_int-number-limits.html
                function getId() {
                    return ++lastId;
                }

                function begin(options) {
                    outerFrames.push(currentFrame);
                    currentFrame = options;
                }

                function end() {
                    currentFrame = outerFrames.pop();
                }

                return {
                    begin: begin,

                    end: end,

                    registerDependency: function (subscribable) {
                        if (currentFrame) {
                            if (!ko.isSubscribable(subscribable))
                                throw new Error("Only subscribable things can act as dependencies");
                            currentFrame.callback(subscribable, subscribable._id || (subscribable._id = getId()));
                        }
                    },

                    ignore: function (callback, callbackTarget, callbackArgs) {
                        try {
                            begin();
                            return callback.apply(callbackTarget, callbackArgs || []);
                        } finally {
                            end();
                        }
                    },

                    getDependenciesCount: function () {
                        if (currentFrame)
                            return currentFrame.computed.getDependenciesCount();
                    },

                    isInitial: function() {
                        if (currentFrame)
                            return currentFrame.isInitial;
                    }
                };
            })();

            ko.exportSymbol('computedContext', ko.computedContext);
            ko.exportSymbol('computedContext.getDependenciesCount', ko.computedContext.getDependenciesCount);
            ko.exportSymbol('computedContext.isInitial', ko.computedContext.isInitial);
            ko.exportSymbol('computedContext.isSleeping', ko.computedContext.isSleeping);

            ko.exportSymbol('ignoreDependencies', ko.ignoreDependencies = ko.dependencyDetection.ignore);
            ko.observable = function (initialValue) {
                var _latestValue = initialValue;

                function observable() {
                    if (arguments.length > 0) {
                        // Write

                        // Ignore writes if the value hasn't changed
                        if (observable.isDifferent(_latestValue, arguments[0])) {
                            observable.valueWillMutate();
                            _latestValue = arguments[0];
                            if (DEBUG) observable._latestValue = _latestValue;
                            observable.valueHasMutated();
                        }
                        return this; // Permits chained assignments
                    }
                    else {
                        // Read
                        ko.dependencyDetection.registerDependency(observable); // The caller only needs to be notified of changes if they did a "read" operation
                        return _latestValue;
                    }
                }
                ko.subscribable.call(observable);
                ko.utils.setPrototypeOfOrExtend(observable, ko.observable['fn']);

                if (DEBUG) observable._latestValue = _latestValue;
                observable.peek = function() { return _latestValue };
                observable.valueHasMutated = function () { observable["notifySubscribers"](_latestValue); }
                observable.valueWillMutate = function () { observable["notifySubscribers"](_latestValue, "beforeChange"); }

                ko.exportProperty(observable, 'peek', observable.peek);
                ko.exportProperty(observable, "valueHasMutated", observable.valueHasMutated);
                ko.exportProperty(observable, "valueWillMutate", observable.valueWillMutate);

                return observable;
            }

            ko.observable['fn'] = {
                "equalityComparer": valuesArePrimitiveAndEqual
            };

            var protoProperty = ko.observable.protoProperty = "__ko_proto__";
            ko.observable['fn'][protoProperty] = ko.observable;

// Note that for browsers that don't support proto assignment, the
// inheritance chain is created manually in the ko.observable constructor
            if (ko.utils.canSetPrototype) {
                ko.utils.setPrototypeOf(ko.observable['fn'], ko.subscribable['fn']);
            }

            ko.hasPrototype = function(instance, prototype) {
                if ((instance === null) || (instance === undefined) || (instance[protoProperty] === undefined)) return false;
                if (instance[protoProperty] === prototype) return true;
                return ko.hasPrototype(instance[protoProperty], prototype); // Walk the prototype chain
            };

            ko.isObservable = function (instance) {
                return ko.hasPrototype(instance, ko.observable);
            }
            ko.isWriteableObservable = function (instance) {
                // Observable
                if ((typeof instance == "function") && instance[protoProperty] === ko.observable)
                    return true;
                // Writeable dependent observable
                if ((typeof instance == "function") && (instance[protoProperty] === ko.dependentObservable) && (instance.hasWriteFunction))
                    return true;
                // Anything else
                return false;
            }


            ko.exportSymbol('observable', ko.observable);
            ko.exportSymbol('isObservable', ko.isObservable);
            ko.exportSymbol('isWriteableObservable', ko.isWriteableObservable);
            ko.exportSymbol('isWritableObservable', ko.isWriteableObservable);
            ko.observableArray = function (initialValues) {
                initialValues = initialValues || [];

                if (typeof initialValues != 'object' || !('length' in initialValues))
                    throw new Error("The argument passed when initializing an observable array must be an array, or null, or undefined.");

                var result = ko.observable(initialValues);
                ko.utils.setPrototypeOfOrExtend(result, ko.observableArray['fn']);
                return result.extend({'trackArrayChanges':true});
            };

            ko.observableArray['fn'] = {
                'remove': function (valueOrPredicate) {
                    var underlyingArray = this.peek();
                    var removedValues = [];
                    var predicate = typeof valueOrPredicate == "function" && !ko.isObservable(valueOrPredicate) ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
                    for (var i = 0; i < underlyingArray.length; i++) {
                        var value = underlyingArray[i];
                        if (predicate(value)) {
                            if (removedValues.length === 0) {
                                this.valueWillMutate();
                            }
                            removedValues.push(value);
                            underlyingArray.splice(i, 1);
                            i--;
                        }
                    }
                    if (removedValues.length) {
                        this.valueHasMutated();
                    }
                    return removedValues;
                },

                'removeAll': function (arrayOfValues) {
                    // If you passed zero args, we remove everything
                    if (arrayOfValues === undefined) {
                        var underlyingArray = this.peek();
                        var allValues = underlyingArray.slice(0);
                        this.valueWillMutate();
                        underlyingArray.splice(0, underlyingArray.length);
                        this.valueHasMutated();
                        return allValues;
                    }
                    // If you passed an arg, we interpret it as an array of entries to remove
                    if (!arrayOfValues)
                        return [];
                    return this['remove'](function (value) {
                        return ko.utils.arrayIndexOf(arrayOfValues, value) >= 0;
                    });
                },

                'destroy': function (valueOrPredicate) {
                    var underlyingArray = this.peek();
                    var predicate = typeof valueOrPredicate == "function" && !ko.isObservable(valueOrPredicate) ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
                    this.valueWillMutate();
                    for (var i = underlyingArray.length - 1; i >= 0; i--) {
                        var value = underlyingArray[i];
                        if (predicate(value))
                            underlyingArray[i]["_destroy"] = true;
                    }
                    this.valueHasMutated();
                },

                'destroyAll': function (arrayOfValues) {
                    // If you passed zero args, we destroy everything
                    if (arrayOfValues === undefined)
                        return this['destroy'](function() { return true });

                    // If you passed an arg, we interpret it as an array of entries to destroy
                    if (!arrayOfValues)
                        return [];
                    return this['destroy'](function (value) {
                        return ko.utils.arrayIndexOf(arrayOfValues, value) >= 0;
                    });
                },

                'indexOf': function (item) {
                    var underlyingArray = this();
                    return ko.utils.arrayIndexOf(underlyingArray, item);
                },

                'replace': function(oldItem, newItem) {
                    var index = this['indexOf'](oldItem);
                    if (index >= 0) {
                        this.valueWillMutate();
                        this.peek()[index] = newItem;
                        this.valueHasMutated();
                    }
                }
            };

// Populate ko.observableArray.fn with read/write functions from native arrays
// Important: Do not add any additional functions here that may reasonably be used to *read* data from the array
// because we'll eval them without causing subscriptions, so ko.computed output could end up getting stale
            ko.utils.arrayForEach(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function (methodName) {
                ko.observableArray['fn'][methodName] = function () {
                    // Use "peek" to avoid creating a subscription in any computed that we're executing in the context of
                    // (for consistency with mutating regular observables)
                    var underlyingArray = this.peek();
                    this.valueWillMutate();
                    this.cacheDiffForKnownOperation(underlyingArray, methodName, arguments);
                    var methodCallResult = underlyingArray[methodName].apply(underlyingArray, arguments);
                    this.valueHasMutated();
                    return methodCallResult;
                };
            });

// Populate ko.observableArray.fn with read-only functions from native arrays
            ko.utils.arrayForEach(["slice"], function (methodName) {
                ko.observableArray['fn'][methodName] = function () {
                    var underlyingArray = this();
                    return underlyingArray[methodName].apply(underlyingArray, arguments);
                };
            });

// Note that for browsers that don't support proto assignment, the
// inheritance chain is created manually in the ko.observableArray constructor
            if (ko.utils.canSetPrototype) {
                ko.utils.setPrototypeOf(ko.observableArray['fn'], ko.observable['fn']);
            }

            ko.exportSymbol('observableArray', ko.observableArray);
            var arrayChangeEventName = 'arrayChange';
            ko.extenders['trackArrayChanges'] = function(target) {
                // Only modify the target observable once
                if (target.cacheDiffForKnownOperation) {
                    return;
                }
                var trackingChanges = false,
                    cachedDiff = null,
                    arrayChangeSubscription,
                    pendingNotifications = 0,
                    underlyingBeforeSubscriptionAddFunction = target.beforeSubscriptionAdd,
                    underlyingAfterSubscriptionRemoveFunction = target.afterSubscriptionRemove;

                // Watch "subscribe" calls, and for array change events, ensure change tracking is enabled
                target.beforeSubscriptionAdd = function (event) {
                    if (underlyingBeforeSubscriptionAddFunction)
                        underlyingBeforeSubscriptionAddFunction.call(target, event);
                    if (event === arrayChangeEventName) {
                        trackChanges();
                    }
                };
                // Watch "dispose" calls, and for array change events, ensure change tracking is disabled when all are disposed
                target.afterSubscriptionRemove = function (event) {
                    if (underlyingAfterSubscriptionRemoveFunction)
                        underlyingAfterSubscriptionRemoveFunction.call(target, event);
                    if (event === arrayChangeEventName && !target.hasSubscriptionsForEvent(arrayChangeEventName)) {
                        arrayChangeSubscription.dispose();
                        trackingChanges = false;
                    }
                };

                function trackChanges() {
                    // Calling 'trackChanges' multiple times is the same as calling it once
                    if (trackingChanges) {
                        return;
                    }

                    trackingChanges = true;

                    // Intercept "notifySubscribers" to track how many times it was called.
                    var underlyingNotifySubscribersFunction = target['notifySubscribers'];
                    target['notifySubscribers'] = function(valueToNotify, event) {
                        if (!event || event === defaultEvent) {
                            ++pendingNotifications;
                        }
                        return underlyingNotifySubscribersFunction.apply(this, arguments);
                    };

                    // Each time the array changes value, capture a clone so that on the next
                    // change it's possible to produce a diff
                    var previousContents = [].concat(target.peek() || []);
                    cachedDiff = null;
                    arrayChangeSubscription = target.subscribe(function(currentContents) {
                        // Make a copy of the current contents and ensure it's an array
                        currentContents = [].concat(currentContents || []);

                        // Compute the diff and issue notifications, but only if someone is listening
                        if (target.hasSubscriptionsForEvent(arrayChangeEventName)) {
                            var changes = getChanges(previousContents, currentContents);
                        }

                        // Eliminate references to the old, removed items, so they can be GCed
                        previousContents = currentContents;
                        cachedDiff = null;
                        pendingNotifications = 0;

                        if (changes && changes.length) {
                            target['notifySubscribers'](changes, arrayChangeEventName);
                        }
                    });
                }

                function getChanges(previousContents, currentContents) {
                    // We try to re-use cached diffs.
                    // The scenarios where pendingNotifications > 1 are when using rate-limiting or the Deferred Updates
                    // plugin, which without this check would not be compatible with arrayChange notifications. Normally,
                    // notifications are issued immediately so we wouldn't be queueing up more than one.
                    if (!cachedDiff || pendingNotifications > 1) {
                        cachedDiff = ko.utils.compareArrays(previousContents, currentContents, { 'sparse': true });
                    }

                    return cachedDiff;
                }

                target.cacheDiffForKnownOperation = function(rawArray, operationName, args) {
                    // Only run if we're currently tracking changes for this observable array
                    // and there aren't any pending deferred notifications.
                    if (!trackingChanges || pendingNotifications) {
                        return;
                    }
                    var diff = [],
                        arrayLength = rawArray.length,
                        argsLength = args.length,
                        offset = 0;

                    function pushDiff(status, value, index) {
                        return diff[diff.length] = { 'status': status, 'value': value, 'index': index };
                    }
                    switch (operationName) {
                        case 'push':
                            offset = arrayLength;
                        case 'unshift':
                            for (var index = 0; index < argsLength; index++) {
                                pushDiff('added', args[index], offset + index);
                            }
                            break;

                        case 'pop':
                            offset = arrayLength - 1;
                        case 'shift':
                            if (arrayLength) {
                                pushDiff('deleted', rawArray[offset], offset);
                            }
                            break;

                        case 'splice':
                            // Negative start index means 'from end of array'. After that we clamp to [0...arrayLength].
                            // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
                            var startIndex = Math.min(Math.max(0, args[0] < 0 ? arrayLength + args[0] : args[0]), arrayLength),
                                endDeleteIndex = argsLength === 1 ? arrayLength : Math.min(startIndex + (args[1] || 0), arrayLength),
                                endAddIndex = startIndex + argsLength - 2,
                                endIndex = Math.max(endDeleteIndex, endAddIndex),
                                additions = [], deletions = [];
                            for (var index = startIndex, argsIndex = 2; index < endIndex; ++index, ++argsIndex) {
                                if (index < endDeleteIndex)
                                    deletions.push(pushDiff('deleted', rawArray[index], index));
                                if (index < endAddIndex)
                                    additions.push(pushDiff('added', args[argsIndex], index));
                            }
                            ko.utils.findMovesInArrayComparison(deletions, additions);
                            break;

                        default:
                            return;
                    }
                    cachedDiff = diff;
                };
            };
            ko.computed = ko.dependentObservable = function (evaluatorFunctionOrOptions, evaluatorFunctionTarget, options) {
                var _latestValue,
                    _needsEvaluation = true,
                    _isBeingEvaluated = false,
                    _suppressDisposalUntilDisposeWhenReturnsFalse = false,
                    _isDisposed = false,
                    readFunction = evaluatorFunctionOrOptions,
                    pure = false,
                    isSleeping = false;

                if (readFunction && typeof readFunction == "object") {
                    // Single-parameter syntax - everything is on this "options" param
                    options = readFunction;
                    readFunction = options["read"];
                } else {
                    // Multi-parameter syntax - construct the options according to the params passed
                    options = options || {};
                    if (!readFunction)
                        readFunction = options["read"];
                }
                if (typeof readFunction != "function")
                    throw new Error("Pass a function that returns the value of the ko.computed");

                function addDependencyTracking(id, target, trackingObj) {
                    if (pure && target === dependentObservable) {
                        throw Error("A 'pure' computed must not be called recursively");
                    }

                    dependencyTracking[id] = trackingObj;
                    trackingObj._order = _dependenciesCount++;
                    trackingObj._version = target.getVersion();
                }

                function haveDependenciesChanged() {
                    var id, dependency;
                    for (id in dependencyTracking) {
                        if (dependencyTracking.hasOwnProperty(id)) {
                            dependency = dependencyTracking[id];
                            if (dependency._target.hasChanged(dependency._version)) {
                                return true;
                            }
                        }
                    }
                }

                function disposeComputed() {
                    if (!isSleeping && dependencyTracking) {
                        ko.utils.objectForEach(dependencyTracking, function (id, dependency) {
                            if (dependency.dispose)
                                dependency.dispose();
                        });
                    }
                    dependencyTracking = null;
                    _dependenciesCount = 0;
                    _isDisposed = true;
                    _needsEvaluation = false;
                    isSleeping = false;
                }

                function evaluatePossiblyAsync() {
                    var throttleEvaluationTimeout = dependentObservable['throttleEvaluation'];
                    if (throttleEvaluationTimeout && throttleEvaluationTimeout >= 0) {
                        clearTimeout(evaluationTimeoutInstance);
                        evaluationTimeoutInstance = setTimeout(function () {
                            evaluateImmediate(true /*notifyChange*/);
                        }, throttleEvaluationTimeout);
                    } else if (dependentObservable._evalRateLimited) {
                        dependentObservable._evalRateLimited();
                    } else {
                        evaluateImmediate(true /*notifyChange*/);
                    }
                }

                function evaluateImmediate(notifyChange) {
                    if (_isBeingEvaluated) {
                        // If the evaluation of a ko.computed causes side effects, it's possible that it will trigger its own re-evaluation.
                        // This is not desirable (it's hard for a developer to realise a chain of dependencies might cause this, and they almost
                        // certainly didn't intend infinite re-evaluations). So, for predictability, we simply prevent ko.computeds from causing
                        // their own re-evaluation. Further discussion at https://github.com/SteveSanderson/knockout/pull/387
                        return;
                    }

                    // Do not evaluate (and possibly capture new dependencies) if disposed
                    if (_isDisposed) {
                        return;
                    }

                    if (disposeWhen && disposeWhen()) {
                        // See comment below about _suppressDisposalUntilDisposeWhenReturnsFalse
                        if (!_suppressDisposalUntilDisposeWhenReturnsFalse) {
                            dispose();
                            return;
                        }
                    } else {
                        // It just did return false, so we can stop suppressing now
                        _suppressDisposalUntilDisposeWhenReturnsFalse = false;
                    }

                    _isBeingEvaluated = true;

                    try {
                        // Initially, we assume that none of the subscriptions are still being used (i.e., all are candidates for disposal).
                        // Then, during evaluation, we cross off any that are in fact still being used.
                        var disposalCandidates = dependencyTracking,
                            disposalCount = _dependenciesCount,
                            isInitial = pure ? undefined : !_dependenciesCount;   // If we're evaluating when there are no previous dependencies, it must be the first time

                        ko.dependencyDetection.begin({
                            callback: function(subscribable, id) {
                                if (!_isDisposed) {
                                    if (disposalCount && disposalCandidates[id]) {
                                        // Don't want to dispose this subscription, as it's still being used
                                        addDependencyTracking(id, subscribable, disposalCandidates[id]);
                                        delete disposalCandidates[id];
                                        --disposalCount;
                                    } else if (!dependencyTracking[id]) {
                                        // Brand new subscription - add it
                                        addDependencyTracking(id, subscribable, isSleeping ? { _target: subscribable } : subscribable.subscribe(evaluatePossiblyAsync));
                                    }
                                }
                            },
                            computed: dependentObservable,
                            isInitial: isInitial
                        });

                        dependencyTracking = {};
                        _dependenciesCount = 0;

                        try {
                            var newValue = evaluatorFunctionTarget ? readFunction.call(evaluatorFunctionTarget) : readFunction();

                        } finally {
                            ko.dependencyDetection.end();

                            // For each subscription no longer being used, remove it from the active subscriptions list and dispose it
                            if (disposalCount && !isSleeping) {
                                ko.utils.objectForEach(disposalCandidates, function(id, toDispose) {
                                    if (toDispose.dispose)
                                        toDispose.dispose();
                                });
                            }

                            _needsEvaluation = false;
                        }

                        if (dependentObservable.isDifferent(_latestValue, newValue)) {
                            if (!isSleeping) {
                                notify(_latestValue, "beforeChange");
                            }

                            _latestValue = newValue;
                            if (DEBUG) dependentObservable._latestValue = _latestValue;

                            if (isSleeping) {
                                dependentObservable.updateVersion();
                            } else if (notifyChange) {
                                notify(_latestValue);
                            }
                        }

                        if (isInitial) {
                            notify(_latestValue, "awake");
                        }
                    } finally {
                        _isBeingEvaluated = false;
                    }

                    if (!_dependenciesCount)
                        dispose();
                }

                function dependentObservable() {
                    if (arguments.length > 0) {
                        if (typeof writeFunction === "function") {
                            // Writing a value
                            writeFunction.apply(evaluatorFunctionTarget, arguments);
                        } else {
                            throw new Error("Cannot write a value to a ko.computed unless you specify a 'write' option. If you wish to read the current value, don't pass any parameters.");
                        }
                        return this; // Permits chained assignments
                    } else {
                        // Reading the value
                        ko.dependencyDetection.registerDependency(dependentObservable);
                        if (_needsEvaluation || (isSleeping && haveDependenciesChanged())) {
                            evaluateImmediate();
                        }
                        return _latestValue;
                    }
                }

                function peek() {
                    // Peek won't re-evaluate, except while the computed is sleeping or to get the initial value when "deferEvaluation" is set.
                    if ((_needsEvaluation && !_dependenciesCount) || (isSleeping && haveDependenciesChanged())) {
                        evaluateImmediate();
                    }
                    return _latestValue;
                }

                function isActive() {
                    return _needsEvaluation || _dependenciesCount > 0;
                }

                function notify(value, event) {
                    dependentObservable["notifySubscribers"](value, event);
                }

                // By here, "options" is always non-null
                var writeFunction = options["write"],
                    disposeWhenNodeIsRemoved = options["disposeWhenNodeIsRemoved"] || options.disposeWhenNodeIsRemoved || null,
                    disposeWhenOption = options["disposeWhen"] || options.disposeWhen,
                    disposeWhen = disposeWhenOption,
                    dispose = disposeComputed,
                    dependencyTracking = {},
                    _dependenciesCount = 0,
                    evaluationTimeoutInstance = null;

                if (!evaluatorFunctionTarget)
                    evaluatorFunctionTarget = options["owner"];

                ko.subscribable.call(dependentObservable);
                ko.utils.setPrototypeOfOrExtend(dependentObservable, ko.dependentObservable['fn']);

                dependentObservable.peek = peek;
                dependentObservable.getDependenciesCount = function () { return _dependenciesCount; };
                dependentObservable.hasWriteFunction = typeof writeFunction === "function";
                dependentObservable.dispose = function () { dispose(); };
                dependentObservable.isActive = isActive;

                // Replace the limit function with one that delays evaluation as well.
                var originalLimit = dependentObservable.limit;
                dependentObservable.limit = function(limitFunction) {
                    originalLimit.call(dependentObservable, limitFunction);
                    dependentObservable._evalRateLimited = function() {
                        dependentObservable._rateLimitedBeforeChange(_latestValue);

                        _needsEvaluation = true;    // Mark as dirty

                        // Pass the observable to the rate-limit code, which will access it when
                        // it's time to do the notification.
                        dependentObservable._rateLimitedChange(dependentObservable);
                    }
                };

                if (options['pure']) {
                    pure = true;
                    isSleeping = true;     // Starts off sleeping; will awake on the first subscription
                    dependentObservable.beforeSubscriptionAdd = function (event) {
                        // If asleep, wake up the computed by subscribing to any dependencies.
                        if (!_isDisposed && isSleeping && event == 'change') {
                            isSleeping = false;
                            if (_needsEvaluation || haveDependenciesChanged()) {
                                dependencyTracking = null;
                                _dependenciesCount = 0;
                                _needsEvaluation = true;
                                evaluateImmediate();
                            } else {
                                // First put the dependencies in order
                                var dependeciesOrder = [];
                                ko.utils.objectForEach(dependencyTracking, function (id, dependency) {
                                    dependeciesOrder[dependency._order] = id;
                                });
                                // Next, subscribe to each one
                                ko.utils.arrayForEach(dependeciesOrder, function(id, order) {
                                    var dependency = dependencyTracking[id],
                                        subscription = dependency._target.subscribe(evaluatePossiblyAsync);
                                    subscription._order = order;
                                    subscription._version = dependency._version;
                                    dependencyTracking[id] = subscription;
                                });
                            }
                            if (!_isDisposed) {     // test since evaluating could trigger disposal
                                notify(_latestValue, "awake");
                            }
                        }
                    };

                    dependentObservable.afterSubscriptionRemove = function (event) {
                        if (!_isDisposed && event == 'change' && !dependentObservable.hasSubscriptionsForEvent('change')) {
                            ko.utils.objectForEach(dependencyTracking, function (id, dependency) {
                                if (dependency.dispose) {
                                    dependencyTracking[id] = {
                                        _target: dependency._target,
                                        _order: dependency._order,
                                        _version: dependency._version
                                    };
                                    dependency.dispose();
                                }
                            });
                            isSleeping = true;
                            notify(undefined, "asleep");
                        }
                    };

                    // Because a pure computed is not automatically updated while it is sleeping, we can't
                    // simply return the version number. Instead, we check if any of the dependencies have
                    // changed and conditionally re-evaluate the computed observable.
                    dependentObservable._originalGetVersion = dependentObservable.getVersion;
                    dependentObservable.getVersion = function () {
                        if (isSleeping && (_needsEvaluation || haveDependenciesChanged())) {
                            evaluateImmediate();
                        }
                        return dependentObservable._originalGetVersion();
                    };
                } else if (options['deferEvaluation']) {
                    // This will force a computed with deferEvaluation to evaluate when the first subscriptions is registered.
                    dependentObservable.beforeSubscriptionAdd = function (event) {
                        if (event == 'change' || event == 'beforeChange') {
                            peek();
                        }
                    }
                }

                ko.exportProperty(dependentObservable, 'peek', dependentObservable.peek);
                ko.exportProperty(dependentObservable, 'dispose', dependentObservable.dispose);
                ko.exportProperty(dependentObservable, 'isActive', dependentObservable.isActive);
                ko.exportProperty(dependentObservable, 'getDependenciesCount', dependentObservable.getDependenciesCount);

                // Add a "disposeWhen" callback that, on each evaluation, disposes if the node was removed without using ko.removeNode.
                if (disposeWhenNodeIsRemoved) {
                    // Since this computed is associated with a DOM node, and we don't want to dispose the computed
                    // until the DOM node is *removed* from the document (as opposed to never having been in the document),
                    // we'll prevent disposal until "disposeWhen" first returns false.
                    _suppressDisposalUntilDisposeWhenReturnsFalse = true;

                    // Only watch for the node's disposal if the value really is a node. It might not be,
                    // e.g., { disposeWhenNodeIsRemoved: true } can be used to opt into the "only dispose
                    // after first false result" behaviour even if there's no specific node to watch. This
                    // technique is intended for KO's internal use only and shouldn't be documented or used
                    // by application code, as it's likely to change in a future version of KO.
                    if (disposeWhenNodeIsRemoved.nodeType) {
                        disposeWhen = function () {
                            return !ko.utils.domNodeIsAttachedToDocument(disposeWhenNodeIsRemoved) || (disposeWhenOption && disposeWhenOption());
                        };
                    }
                }

                // Evaluate, unless sleeping or deferEvaluation is true
                if (!isSleeping && !options['deferEvaluation'])
                    evaluateImmediate();

                // Attach a DOM node disposal callback so that the computed will be proactively disposed as soon as the node is
                // removed using ko.removeNode. But skip if isActive is false (there will never be any dependencies to dispose).
                if (disposeWhenNodeIsRemoved && isActive() && disposeWhenNodeIsRemoved.nodeType) {
                    dispose = function() {
                        ko.utils.domNodeDisposal.removeDisposeCallback(disposeWhenNodeIsRemoved, dispose);
                        disposeComputed();
                    };
                    ko.utils.domNodeDisposal.addDisposeCallback(disposeWhenNodeIsRemoved, dispose);
                }

                return dependentObservable;
            };

            ko.isComputed = function(instance) {
                return ko.hasPrototype(instance, ko.dependentObservable);
            };

            var protoProp = ko.observable.protoProperty; // == "__ko_proto__"
            ko.dependentObservable[protoProp] = ko.observable;

            ko.dependentObservable['fn'] = {
                "equalityComparer": valuesArePrimitiveAndEqual
            };
            ko.dependentObservable['fn'][protoProp] = ko.dependentObservable;

// Note that for browsers that don't support proto assignment, the
// inheritance chain is created manually in the ko.dependentObservable constructor
            if (ko.utils.canSetPrototype) {
                ko.utils.setPrototypeOf(ko.dependentObservable['fn'], ko.subscribable['fn']);
            }

            ko.exportSymbol('dependentObservable', ko.dependentObservable);
            ko.exportSymbol('computed', ko.dependentObservable); // Make "ko.computed" an alias for "ko.dependentObservable"
            ko.exportSymbol('isComputed', ko.isComputed);

            ko.pureComputed = function (evaluatorFunctionOrOptions, evaluatorFunctionTarget) {
                if (typeof evaluatorFunctionOrOptions === 'function') {
                    return ko.computed(evaluatorFunctionOrOptions, evaluatorFunctionTarget, {'pure':true});
                } else {
                    evaluatorFunctionOrOptions = ko.utils.extend({}, evaluatorFunctionOrOptions);   // make a copy of the parameter object
                    evaluatorFunctionOrOptions['pure'] = true;
                    return ko.computed(evaluatorFunctionOrOptions, evaluatorFunctionTarget);
                }
            }
            ko.exportSymbol('pureComputed', ko.pureComputed);

            (function() {
                var maxNestedObservableDepth = 10; // Escape the (unlikely) pathalogical case where an observable's current value is itself (or similar reference cycle)

                ko.toJS = function(rootObject) {
                    if (arguments.length == 0)
                        throw new Error("When calling ko.toJS, pass the object you want to convert.");

                    // We just unwrap everything at every level in the object graph
                    return mapJsObjectGraph(rootObject, function(valueToMap) {
                        // Loop because an observable's value might in turn be another observable wrapper
                        for (var i = 0; ko.isObservable(valueToMap) && (i < maxNestedObservableDepth); i++)
                            valueToMap = valueToMap();
                        return valueToMap;
                    });
                };

                ko.toJSON = function(rootObject, replacer, space) {     // replacer and space are optional
                    var plainJavaScriptObject = ko.toJS(rootObject);
                    return ko.utils.stringifyJson(plainJavaScriptObject, replacer, space);
                };

                function mapJsObjectGraph(rootObject, mapInputCallback, visitedObjects) {
                    visitedObjects = visitedObjects || new objectLookup();

                    rootObject = mapInputCallback(rootObject);
                    var canHaveProperties = (typeof rootObject == "object") && (rootObject !== null) && (rootObject !== undefined) && (!(rootObject instanceof Date)) && (!(rootObject instanceof String)) && (!(rootObject instanceof Number)) && (!(rootObject instanceof Boolean));
                    if (!canHaveProperties)
                        return rootObject;

                    var outputProperties = rootObject instanceof Array ? [] : {};
                    visitedObjects.save(rootObject, outputProperties);

                    visitPropertiesOrArrayEntries(rootObject, function(indexer) {
                        var propertyValue = mapInputCallback(rootObject[indexer]);

                        switch (typeof propertyValue) {
                            case "boolean":
                            case "number":
                            case "string":
                            case "function":
                                outputProperties[indexer] = propertyValue;
                                break;
                            case "object":
                            case "undefined":
                                var previouslyMappedValue = visitedObjects.get(propertyValue);
                                outputProperties[indexer] = (previouslyMappedValue !== undefined)
                                    ? previouslyMappedValue
                                    : mapJsObjectGraph(propertyValue, mapInputCallback, visitedObjects);
                                break;
                        }
                    });

                    return outputProperties;
                }

                function visitPropertiesOrArrayEntries(rootObject, visitorCallback) {
                    if (rootObject instanceof Array) {
                        for (var i = 0; i < rootObject.length; i++)
                            visitorCallback(i);

                        // For arrays, also respect toJSON property for custom mappings (fixes #278)
                        if (typeof rootObject['toJSON'] == 'function')
                            visitorCallback('toJSON');
                    } else {
                        for (var propertyName in rootObject) {
                            visitorCallback(propertyName);
                        }
                    }
                };

                function objectLookup() {
                    this.keys = [];
                    this.values = [];
                };

                objectLookup.prototype = {
                    constructor: objectLookup,
                    save: function(key, value) {
                        var existingIndex = ko.utils.arrayIndexOf(this.keys, key);
                        if (existingIndex >= 0)
                            this.values[existingIndex] = value;
                        else {
                            this.keys.push(key);
                            this.values.push(value);
                        }
                    },
                    get: function(key) {
                        var existingIndex = ko.utils.arrayIndexOf(this.keys, key);
                        return (existingIndex >= 0) ? this.values[existingIndex] : undefined;
                    }
                };
            })();

            ko.exportSymbol('toJS', ko.toJS);
            ko.exportSymbol('toJSON', ko.toJSON);
            (function () {
                var hasDomDataExpandoProperty = '__ko__hasDomDataOptionValue__';

                // Normally, SELECT elements and their OPTIONs can only take value of type 'string' (because the values
                // are stored on DOM attributes). ko.selectExtensions provides a way for SELECTs/OPTIONs to have values
                // that are arbitrary objects. This is very convenient when implementing things like cascading dropdowns.
                ko.selectExtensions = {
                    readValue : function(element) {
                        switch (ko.utils.tagNameLower(element)) {
                            case 'option':
                                if (element[hasDomDataExpandoProperty] === true)
                                    return ko.utils.domData.get(element, ko.bindingHandlers.options.optionValueDomDataKey);
                                return ko.utils.ieVersion <= 7
                                    ? (element.getAttributeNode('value') && element.getAttributeNode('value').specified ? element.value : element.text)
                                    : element.value;
                            case 'select':
                                return element.selectedIndex >= 0 ? ko.selectExtensions.readValue(element.options[element.selectedIndex]) : undefined;
                            default:
                                return element.value;
                        }
                    },

                    writeValue: function(element, value, allowUnset) {
                        switch (ko.utils.tagNameLower(element)) {
                            case 'option':
                                switch(typeof value) {
                                    case "string":
                                        ko.utils.domData.set(element, ko.bindingHandlers.options.optionValueDomDataKey, undefined);
                                        if (hasDomDataExpandoProperty in element) { // IE <= 8 throws errors if you delete non-existent properties from a DOM node
                                            delete element[hasDomDataExpandoProperty];
                                        }
                                        element.value = value;
                                        break;
                                    default:
                                        // Store arbitrary object using DomData
                                        ko.utils.domData.set(element, ko.bindingHandlers.options.optionValueDomDataKey, value);
                                        element[hasDomDataExpandoProperty] = true;

                                        // Special treatment of numbers is just for backward compatibility. KO 1.2.1 wrote numerical values to element.value.
                                        element.value = typeof value === "number" ? value : "";
                                        break;
                                }
                                break;
                            case 'select':
                                if (value === "" || value === null)       // A blank string or null value will select the caption
                                    value = undefined;
                                var selection = -1;
                                for (var i = 0, n = element.options.length, optionValue; i < n; ++i) {
                                    optionValue = ko.selectExtensions.readValue(element.options[i]);
                                    // Include special check to handle selecting a caption with a blank string value
                                    if (optionValue == value || (optionValue == "" && value === undefined)) {
                                        selection = i;
                                        break;
                                    }
                                }
                                if (allowUnset || selection >= 0 || (value === undefined && element.size > 1)) {
                                    element.selectedIndex = selection;
                                }
                                break;
                            default:
                                if ((value === null) || (value === undefined))
                                    value = "";
                                element.value = value;
                                break;
                        }
                    }
                };
            })();

            ko.exportSymbol('selectExtensions', ko.selectExtensions);
            ko.exportSymbol('selectExtensions.readValue', ko.selectExtensions.readValue);
            ko.exportSymbol('selectExtensions.writeValue', ko.selectExtensions.writeValue);
            ko.expressionRewriting = (function () {
                var javaScriptReservedWords = ["true", "false", "null", "undefined"];

                // Matches something that can be assigned to--either an isolated identifier or something ending with a property accessor
                // This is designed to be simple and avoid false negatives, but could produce false positives (e.g., a+b.c).
                // This also will not properly handle nested brackets (e.g., obj1[obj2['prop']]; see #911).
                var javaScriptAssignmentTarget = /^(?:[$_a-z][$\w]*|(.+)(\.\s*[$_a-z][$\w]*|\[.+\]))$/i;

                function getWriteableValue(expression) {
                    if (ko.utils.arrayIndexOf(javaScriptReservedWords, expression) >= 0)
                        return false;
                    var match = expression.match(javaScriptAssignmentTarget);
                    return match === null ? false : match[1] ? ('Object(' + match[1] + ')' + match[2]) : expression;
                }

                // The following regular expressions will be used to split an object-literal string into tokens

                // These two match strings, either with double quotes or single quotes
                var stringDouble = '"(?:[^"\\\\]|\\\\.)*"',
                    stringSingle = "'(?:[^'\\\\]|\\\\.)*'",
                // Matches a regular expression (text enclosed by slashes), but will also match sets of divisions
                // as a regular expression (this is handled by the parsing loop below).
                    stringRegexp = '/(?:[^/\\\\]|\\\\.)*/\w*',
                // These characters have special meaning to the parser and must not appear in the middle of a
                // token, except as part of a string.
                    specials = ',"\'{}()/:[\\]',
                // Match text (at least two characters) that does not contain any of the above special characters,
                // although some of the special characters are allowed to start it (all but the colon and comma).
                // The text can contain spaces, but leading or trailing spaces are skipped.
                    everyThingElse = '[^\\s:,/][^' + specials + ']*[^\\s' + specials + ']',
                // Match any non-space character not matched already. This will match colons and commas, since they're
                // not matched by "everyThingElse", but will also match any other single character that wasn't already
                // matched (for example: in "a: 1, b: 2", each of the non-space characters will be matched by oneNotSpace).
                    oneNotSpace = '[^\\s]',

                // Create the actual regular expression by or-ing the above strings. The order is important.
                    bindingToken = RegExp(stringDouble + '|' + stringSingle + '|' + stringRegexp + '|' + everyThingElse + '|' + oneNotSpace, 'g'),

                // Match end of previous token to determine whether a slash is a division or regex.
                    divisionLookBehind = /[\])"'A-Za-z0-9_$]+$/,
                    keywordRegexLookBehind = {'in':1,'return':1,'typeof':1};

                function parseObjectLiteral(objectLiteralString) {
                    // Trim leading and trailing spaces from the string
                    var str = ko.utils.stringTrim(objectLiteralString);

                    // Trim braces '{' surrounding the whole object literal
                    if (str.charCodeAt(0) === 123) str = str.slice(1, -1);

                    // Split into tokens
                    var result = [], toks = str.match(bindingToken), key, values = [], depth = 0;

                    if (toks) {
                        // Append a comma so that we don't need a separate code block to deal with the last item
                        toks.push(',');

                        for (var i = 0, tok; tok = toks[i]; ++i) {
                            var c = tok.charCodeAt(0);
                            // A comma signals the end of a key/value pair if depth is zero
                            if (c === 44) { // ","
                                if (depth <= 0) {
                                    result.push((key && values.length) ? {key: key, value: values.join('')} : {'unknown': key || values.join('')});
                                    key = depth = 0;
                                    values = [];
                                    continue;
                                }
                                // Simply skip the colon that separates the name and value
                            } else if (c === 58) { // ":"
                                if (!depth && !key && values.length === 1) {
                                    key = values.pop();
                                    continue;
                                }
                                // A set of slashes is initially matched as a regular expression, but could be division
                            } else if (c === 47 && i && tok.length > 1) {  // "/"
                                // Look at the end of the previous token to determine if the slash is actually division
                                var match = toks[i-1].match(divisionLookBehind);
                                if (match && !keywordRegexLookBehind[match[0]]) {
                                    // The slash is actually a division punctuator; re-parse the remainder of the string (not including the slash)
                                    str = str.substr(str.indexOf(tok) + 1);
                                    toks = str.match(bindingToken);
                                    toks.push(',');
                                    i = -1;
                                    // Continue with just the slash
                                    tok = '/';
                                }
                                // Increment depth for parentheses, braces, and brackets so that interior commas are ignored
                            } else if (c === 40 || c === 123 || c === 91) { // '(', '{', '['
                                ++depth;
                            } else if (c === 41 || c === 125 || c === 93) { // ')', '}', ']'
                                --depth;
                                // The key will be the first token; if it's a string, trim the quotes
                            } else if (!key && !values.length && (c === 34 || c === 39)) { // '"', "'"
                                tok = tok.slice(1, -1);
                            }
                            values.push(tok);
                        }
                    }
                    return result;
                }

                // Two-way bindings include a write function that allow the handler to update the value even if it's not an observable.
                var twoWayBindings = {};

                function preProcessBindings(bindingsStringOrKeyValueArray, bindingOptions) {
                    bindingOptions = bindingOptions || {};

                    function processKeyValue(key, val) {
                        var writableVal;
                        function callPreprocessHook(obj) {
                            return (obj && obj['preprocess']) ? (val = obj['preprocess'](val, key, processKeyValue)) : true;
                        }
                        if (!bindingParams) {
                            if (!callPreprocessHook(ko['getBindingHandler'](key)))
                                return;

                            if (twoWayBindings[key] && (writableVal = getWriteableValue(val))) {
                                // For two-way bindings, provide a write method in case the value
                                // isn't a writable observable.
                                propertyAccessorResultStrings.push("'" + key + "':function(_z){" + writableVal + "=_z}");
                            }
                        }
                        // Values are wrapped in a function so that each value can be accessed independently
                        if (makeValueAccessors) {
                            val = 'function(){return ' + val + ' }';
                        }
                        resultStrings.push("'" + key + "':" + val);
                    }

                    var resultStrings = [],
                        propertyAccessorResultStrings = [],
                        makeValueAccessors = bindingOptions['valueAccessors'],
                        bindingParams = bindingOptions['bindingParams'],
                        keyValueArray = typeof bindingsStringOrKeyValueArray === "string" ?
                            parseObjectLiteral(bindingsStringOrKeyValueArray) : bindingsStringOrKeyValueArray;

                    ko.utils.arrayForEach(keyValueArray, function(keyValue) {
                        processKeyValue(keyValue.key || keyValue['unknown'], keyValue.value);
                    });

                    if (propertyAccessorResultStrings.length)
                        processKeyValue('_ko_property_writers', "{" + propertyAccessorResultStrings.join(",") + " }");

                    return resultStrings.join(",");
                }

                return {
                    bindingRewriteValidators: [],

                    twoWayBindings: twoWayBindings,

                    parseObjectLiteral: parseObjectLiteral,

                    preProcessBindings: preProcessBindings,

                    keyValueArrayContainsKey: function(keyValueArray, key) {
                        for (var i = 0; i < keyValueArray.length; i++)
                            if (keyValueArray[i]['key'] == key)
                                return true;
                        return false;
                    },

                    // Internal, private KO utility for updating model properties from within bindings
                    // property:            If the property being updated is (or might be) an observable, pass it here
                    //                      If it turns out to be a writable observable, it will be written to directly
                    // allBindings:         An object with a get method to retrieve bindings in the current execution context.
                    //                      This will be searched for a '_ko_property_writers' property in case you're writing to a non-observable
                    // key:                 The key identifying the property to be written. Example: for { hasFocus: myValue }, write to 'myValue' by specifying the key 'hasFocus'
                    // value:               The value to be written
                    // checkIfDifferent:    If true, and if the property being written is a writable observable, the value will only be written if
                    //                      it is !== existing value on that writable observable
                    writeValueToProperty: function(property, allBindings, key, value, checkIfDifferent) {
                        if (!property || !ko.isObservable(property)) {
                            var propWriters = allBindings.get('_ko_property_writers');
                            if (propWriters && propWriters[key])
                                propWriters[key](value);
                        } else if (ko.isWriteableObservable(property) && (!checkIfDifferent || property.peek() !== value)) {
                            property(value);
                        }
                    }
                };
            })();

            ko.exportSymbol('expressionRewriting', ko.expressionRewriting);
            ko.exportSymbol('expressionRewriting.bindingRewriteValidators', ko.expressionRewriting.bindingRewriteValidators);
            ko.exportSymbol('expressionRewriting.parseObjectLiteral', ko.expressionRewriting.parseObjectLiteral);
            ko.exportSymbol('expressionRewriting.preProcessBindings', ko.expressionRewriting.preProcessBindings);

// Making bindings explicitly declare themselves as "two way" isn't ideal in the long term (it would be better if
// all bindings could use an official 'property writer' API without needing to declare that they might). However,
// since this is not, and has never been, a public API (_ko_property_writers was never documented), it's acceptable
// as an internal implementation detail in the short term.
// For those developers who rely on _ko_property_writers in their custom bindings, we expose _twoWayBindings as an
// undocumented feature that makes it relatively easy to upgrade to KO 3.0. However, this is still not an official
// public API, and we reserve the right to remove it at any time if we create a real public property writers API.
            ko.exportSymbol('expressionRewriting._twoWayBindings', ko.expressionRewriting.twoWayBindings);

// For backward compatibility, define the following aliases. (Previously, these function names were misleading because
// they referred to JSON specifically, even though they actually work with arbitrary JavaScript object literal expressions.)
            ko.exportSymbol('jsonExpressionRewriting', ko.expressionRewriting);
            ko.exportSymbol('jsonExpressionRewriting.insertPropertyAccessorsIntoJson', ko.expressionRewriting.preProcessBindings);
            (function() {
                // "Virtual elements" is an abstraction on top of the usual DOM API which understands the notion that comment nodes
                // may be used to represent hierarchy (in addition to the DOM's natural hierarchy).
                // If you call the DOM-manipulating functions on ko.virtualElements, you will be able to read and write the state
                // of that virtual hierarchy
                //
                // The point of all this is to support containerless templates (e.g., <!-- ko foreach:someCollection -->blah<!-- /ko -->)
                // without having to scatter special cases all over the binding and templating code.

                // IE 9 cannot reliably read the "nodeValue" property of a comment node (see https://github.com/SteveSanderson/knockout/issues/186)
                // but it does give them a nonstandard alternative property called "text" that it can read reliably. Other browsers don't have that property.
                // So, use node.text where available, and node.nodeValue elsewhere
                var commentNodesHaveTextProperty = document && document.createComment("test").text === "<!--test-->";

                var startCommentRegex = commentNodesHaveTextProperty ? /^<!--\s*ko(?:\s+([\s\S]+))?\s*-->$/ : /^\s*ko(?:\s+([\s\S]+))?\s*$/;
                var endCommentRegex =   commentNodesHaveTextProperty ? /^<!--\s*\/ko\s*-->$/ : /^\s*\/ko\s*$/;
                var htmlTagsWithOptionallyClosingChildren = { 'ul': true, 'ol': true };

                function isStartComment(node) {
                    return (node.nodeType == 8) && startCommentRegex.test(commentNodesHaveTextProperty ? node.text : node.nodeValue);
                }

                function isEndComment(node) {
                    return (node.nodeType == 8) && endCommentRegex.test(commentNodesHaveTextProperty ? node.text : node.nodeValue);
                }

                function getVirtualChildren(startComment, allowUnbalanced) {
                    var currentNode = startComment;
                    var depth = 1;
                    var children = [];
                    while (currentNode = currentNode.nextSibling) {
                        if (isEndComment(currentNode)) {
                            depth--;
                            if (depth === 0)
                                return children;
                        }

                        children.push(currentNode);

                        if (isStartComment(currentNode))
                            depth++;
                    }
                    if (!allowUnbalanced)
                        throw new Error("Cannot find closing comment tag to match: " + startComment.nodeValue);
                    return null;
                }

                function getMatchingEndComment(startComment, allowUnbalanced) {
                    var allVirtualChildren = getVirtualChildren(startComment, allowUnbalanced);
                    if (allVirtualChildren) {
                        if (allVirtualChildren.length > 0)
                            return allVirtualChildren[allVirtualChildren.length - 1].nextSibling;
                        return startComment.nextSibling;
                    } else
                        return null; // Must have no matching end comment, and allowUnbalanced is true
                }

                function getUnbalancedChildTags(node) {
                    // e.g., from <div>OK</div><!-- ko blah --><span>Another</span>, returns: <!-- ko blah --><span>Another</span>
                    //       from <div>OK</div><!-- /ko --><!-- /ko -->,             returns: <!-- /ko --><!-- /ko -->
                    var childNode = node.firstChild, captureRemaining = null;
                    if (childNode) {
                        do {
                            if (captureRemaining)                   // We already hit an unbalanced node and are now just scooping up all subsequent nodes
                                captureRemaining.push(childNode);
                            else if (isStartComment(childNode)) {
                                var matchingEndComment = getMatchingEndComment(childNode, /* allowUnbalanced: */ true);
                                if (matchingEndComment)             // It's a balanced tag, so skip immediately to the end of this virtual set
                                    childNode = matchingEndComment;
                                else
                                    captureRemaining = [childNode]; // It's unbalanced, so start capturing from this point
                            } else if (isEndComment(childNode)) {
                                captureRemaining = [childNode];     // It's unbalanced (if it wasn't, we'd have skipped over it already), so start capturing
                            }
                        } while (childNode = childNode.nextSibling);
                    }
                    return captureRemaining;
                }

                ko.virtualElements = {
                    allowedBindings: {},

                    childNodes: function(node) {
                        return isStartComment(node) ? getVirtualChildren(node) : node.childNodes;
                    },

                    emptyNode: function(node) {
                        if (!isStartComment(node))
                            ko.utils.emptyDomNode(node);
                        else {
                            var virtualChildren = ko.virtualElements.childNodes(node);
                            for (var i = 0, j = virtualChildren.length; i < j; i++)
                                ko.removeNode(virtualChildren[i]);
                        }
                    },

                    setDomNodeChildren: function(node, childNodes) {
                        if (!isStartComment(node))
                            ko.utils.setDomNodeChildren(node, childNodes);
                        else {
                            ko.virtualElements.emptyNode(node);
                            var endCommentNode = node.nextSibling; // Must be the next sibling, as we just emptied the children
                            for (var i = 0, j = childNodes.length; i < j; i++)
                                endCommentNode.parentNode.insertBefore(childNodes[i], endCommentNode);
                        }
                    },

                    prepend: function(containerNode, nodeToPrepend) {
                        if (!isStartComment(containerNode)) {
                            if (containerNode.firstChild)
                                containerNode.insertBefore(nodeToPrepend, containerNode.firstChild);
                            else
                                containerNode.appendChild(nodeToPrepend);
                        } else {
                            // Start comments must always have a parent and at least one following sibling (the end comment)
                            containerNode.parentNode.insertBefore(nodeToPrepend, containerNode.nextSibling);
                        }
                    },

                    insertAfter: function(containerNode, nodeToInsert, insertAfterNode) {
                        if (!insertAfterNode) {
                            ko.virtualElements.prepend(containerNode, nodeToInsert);
                        } else if (!isStartComment(containerNode)) {
                            // Insert after insertion point
                            if (insertAfterNode.nextSibling)
                                containerNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
                            else
                                containerNode.appendChild(nodeToInsert);
                        } else {
                            // Children of start comments must always have a parent and at least one following sibling (the end comment)
                            containerNode.parentNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
                        }
                    },

                    firstChild: function(node) {
                        if (!isStartComment(node))
                            return node.firstChild;
                        if (!node.nextSibling || isEndComment(node.nextSibling))
                            return null;
                        return node.nextSibling;
                    },

                    nextSibling: function(node) {
                        if (isStartComment(node))
                            node = getMatchingEndComment(node);
                        if (node.nextSibling && isEndComment(node.nextSibling))
                            return null;
                        return node.nextSibling;
                    },

                    hasBindingValue: isStartComment,

                    virtualNodeBindingValue: function(node) {
                        var regexMatch = (commentNodesHaveTextProperty ? node.text : node.nodeValue).match(startCommentRegex);
                        return regexMatch ? regexMatch[1] : null;
                    },

                    normaliseVirtualElementDomStructure: function(elementVerified) {
                        // Workaround for https://github.com/SteveSanderson/knockout/issues/155
                        // (IE <= 8 or IE 9 quirks mode parses your HTML weirdly, treating closing </li> tags as if they don't exist, thereby moving comment nodes
                        // that are direct descendants of <ul> into the preceding <li>)
                        if (!htmlTagsWithOptionallyClosingChildren[ko.utils.tagNameLower(elementVerified)])
                            return;

                        // Scan immediate children to see if they contain unbalanced comment tags. If they do, those comment tags
                        // must be intended to appear *after* that child, so move them there.
                        var childNode = elementVerified.firstChild;
                        if (childNode) {
                            do {
                                if (childNode.nodeType === 1) {
                                    var unbalancedTags = getUnbalancedChildTags(childNode);
                                    if (unbalancedTags) {
                                        // Fix up the DOM by moving the unbalanced tags to where they most likely were intended to be placed - *after* the child
                                        var nodeToInsertBefore = childNode.nextSibling;
                                        for (var i = 0; i < unbalancedTags.length; i++) {
                                            if (nodeToInsertBefore)
                                                elementVerified.insertBefore(unbalancedTags[i], nodeToInsertBefore);
                                            else
                                                elementVerified.appendChild(unbalancedTags[i]);
                                        }
                                    }
                                }
                            } while (childNode = childNode.nextSibling);
                        }
                    }
                };
            })();
            ko.exportSymbol('virtualElements', ko.virtualElements);
            ko.exportSymbol('virtualElements.allowedBindings', ko.virtualElements.allowedBindings);
            ko.exportSymbol('virtualElements.emptyNode', ko.virtualElements.emptyNode);
//ko.exportSymbol('virtualElements.firstChild', ko.virtualElements.firstChild);     // firstChild is not minified
            ko.exportSymbol('virtualElements.insertAfter', ko.virtualElements.insertAfter);
//ko.exportSymbol('virtualElements.nextSibling', ko.virtualElements.nextSibling);   // nextSibling is not minified
            ko.exportSymbol('virtualElements.prepend', ko.virtualElements.prepend);
            ko.exportSymbol('virtualElements.setDomNodeChildren', ko.virtualElements.setDomNodeChildren);
            (function() {
                var defaultBindingAttributeName = "data-bind";

                ko.bindingProvider = function() {
                    this.bindingCache = {};
                };

                ko.utils.extend(ko.bindingProvider.prototype, {
                    'nodeHasBindings': function(node) {
                        switch (node.nodeType) {
                            case 1: // Element
                                return node.getAttribute(defaultBindingAttributeName) != null
                                    || ko.components['getComponentNameForNode'](node);
                            case 8: // Comment node
                                return ko.virtualElements.hasBindingValue(node);
                            default: return false;
                        }
                    },

                    'getBindings': function(node, bindingContext) {
                        var bindingsString = this['getBindingsString'](node, bindingContext),
                            parsedBindings = bindingsString ? this['parseBindingsString'](bindingsString, bindingContext, node) : null;
                        return ko.components.addBindingsForCustomElement(parsedBindings, node, bindingContext, /* valueAccessors */ false);
                    },

                    'getBindingAccessors': function(node, bindingContext) {
                        var bindingsString = this['getBindingsString'](node, bindingContext),
                            parsedBindings = bindingsString ? this['parseBindingsString'](bindingsString, bindingContext, node, { 'valueAccessors': true }) : null;
                        return ko.components.addBindingsForCustomElement(parsedBindings, node, bindingContext, /* valueAccessors */ true);
                    },

                    // The following function is only used internally by this default provider.
                    // It's not part of the interface definition for a general binding provider.
                    'getBindingsString': function(node, bindingContext) {
                        switch (node.nodeType) {
                            case 1: return node.getAttribute(defaultBindingAttributeName);   // Element
                            case 8: return ko.virtualElements.virtualNodeBindingValue(node); // Comment node
                            default: return null;
                        }
                    },

                    // The following function is only used internally by this default provider.
                    // It's not part of the interface definition for a general binding provider.
                    'parseBindingsString': function(bindingsString, bindingContext, node, options) {
                        try {
                            var bindingFunction = createBindingsStringEvaluatorViaCache(bindingsString, this.bindingCache, options);
                            return bindingFunction(bindingContext, node);
                        } catch (ex) {
                            ex.message = "Unable to parse bindings.\nBindings value: " + bindingsString + "\nMessage: " + ex.message;
                            throw ex;
                        }
                    }
                });

                ko.bindingProvider['instance'] = new ko.bindingProvider();

                function createBindingsStringEvaluatorViaCache(bindingsString, cache, options) {
                    var cacheKey = bindingsString + (options && options['valueAccessors'] || '');
                    return cache[cacheKey]
                        || (cache[cacheKey] = createBindingsStringEvaluator(bindingsString, options));
                }

                function createBindingsStringEvaluator(bindingsString, options) {
                    // Build the source for a function that evaluates "expression"
                    // For each scope variable, add an extra level of "with" nesting
                    // Example result: with(sc1) { with(sc0) { return (expression) } }
                    var rewrittenBindings = ko.expressionRewriting.preProcessBindings(bindingsString, options),
                        functionBody = "with($context){with($data||{}){return{" + rewrittenBindings + "}}}";
                    return new Function("$context", "$element", functionBody);
                }
            })();

            ko.exportSymbol('bindingProvider', ko.bindingProvider);
            (function () {
                ko.bindingHandlers = {};

                // The following element types will not be recursed into during binding. In the future, we
                // may consider adding <template> to this list, because such elements' contents are always
                // intended to be bound in a different context from where they appear in the document.
                var bindingDoesNotRecurseIntoElementTypes = {
                    // Don't want bindings that operate on text nodes to mutate <script> and <textarea> contents,
                    // because it's unexpected and a potential XSS issue
                    'script': true,
                    'textarea': true
                };

                // Use an overridable method for retrieving binding handlers so that a plugins may support dynamically created handlers
                ko['getBindingHandler'] = function(bindingKey) {
                    return ko.bindingHandlers[bindingKey];
                };

                // The ko.bindingContext constructor is only called directly to create the root context. For child
                // contexts, use bindingContext.createChildContext or bindingContext.extend.
                ko.bindingContext = function(dataItemOrAccessor, parentContext, dataItemAlias, extendCallback) {

                    // The binding context object includes static properties for the current, parent, and root view models.
                    // If a view model is actually stored in an observable, the corresponding binding context object, and
                    // any child contexts, must be updated when the view model is changed.
                    function updateContext() {
                        // Most of the time, the context will directly get a view model object, but if a function is given,
                        // we call the function to retrieve the view model. If the function accesses any obsevables or returns
                        // an observable, the dependency is tracked, and those observables can later cause the binding
                        // context to be updated.
                        var dataItemOrObservable = isFunc ? dataItemOrAccessor() : dataItemOrAccessor,
                            dataItem = ko.utils.unwrapObservable(dataItemOrObservable);

                        if (parentContext) {
                            // When a "parent" context is given, register a dependency on the parent context. Thus whenever the
                            // parent context is updated, this context will also be updated.
                            if (parentContext._subscribable)
                                parentContext._subscribable();

                            // Copy $root and any custom properties from the parent context
                            ko.utils.extend(self, parentContext);

                            // Because the above copy overwrites our own properties, we need to reset them.
                            // During the first execution, "subscribable" isn't set, so don't bother doing the update then.
                            if (subscribable) {
                                self._subscribable = subscribable;
                            }
                        } else {
                            self['$parents'] = [];
                            self['$root'] = dataItem;

                            // Export 'ko' in the binding context so it will be available in bindings and templates
                            // even if 'ko' isn't exported as a global, such as when using an AMD loader.
                            // See https://github.com/SteveSanderson/knockout/issues/490
                            self['ko'] = ko;
                        }
                        self['$rawData'] = dataItemOrObservable;
                        self['$data'] = dataItem;
                        if (dataItemAlias)
                            self[dataItemAlias] = dataItem;

                        // The extendCallback function is provided when creating a child context or extending a context.
                        // It handles the specific actions needed to finish setting up the binding context. Actions in this
                        // function could also add dependencies to this binding context.
                        if (extendCallback)
                            extendCallback(self, parentContext, dataItem);

                        return self['$data'];
                    }
                    function disposeWhen() {
                        return nodes && !ko.utils.anyDomNodeIsAttachedToDocument(nodes);
                    }

                    var self = this,
                        isFunc = typeof(dataItemOrAccessor) == "function" && !ko.isObservable(dataItemOrAccessor),
                        nodes,
                        subscribable = ko.dependentObservable(updateContext, null, { disposeWhen: disposeWhen, disposeWhenNodeIsRemoved: true });

                    // At this point, the binding context has been initialized, and the "subscribable" computed observable is
                    // subscribed to any observables that were accessed in the process. If there is nothing to track, the
                    // computed will be inactive, and we can safely throw it away. If it's active, the computed is stored in
                    // the context object.
                    if (subscribable.isActive()) {
                        self._subscribable = subscribable;

                        // Always notify because even if the model ($data) hasn't changed, other context properties might have changed
                        subscribable['equalityComparer'] = null;

                        // We need to be able to dispose of this computed observable when it's no longer needed. This would be
                        // easy if we had a single node to watch, but binding contexts can be used by many different nodes, and
                        // we cannot assume that those nodes have any relation to each other. So instead we track any node that
                        // the context is attached to, and dispose the computed when all of those nodes have been cleaned.

                        // Add properties to *subscribable* instead of *self* because any properties added to *self* may be overwritten on updates
                        nodes = [];
                        subscribable._addNode = function(node) {
                            nodes.push(node);
                            ko.utils.domNodeDisposal.addDisposeCallback(node, function(node) {
                                ko.utils.arrayRemoveItem(nodes, node);
                                if (!nodes.length) {
                                    subscribable.dispose();
                                    self._subscribable = subscribable = undefined;
                                }
                            });
                        };
                    }
                }

                // Extend the binding context hierarchy with a new view model object. If the parent context is watching
                // any obsevables, the new child context will automatically get a dependency on the parent context.
                // But this does not mean that the $data value of the child context will also get updated. If the child
                // view model also depends on the parent view model, you must provide a function that returns the correct
                // view model on each update.
                ko.bindingContext.prototype['createChildContext'] = function (dataItemOrAccessor, dataItemAlias, extendCallback) {
                    return new ko.bindingContext(dataItemOrAccessor, this, dataItemAlias, function(self, parentContext) {
                        // Extend the context hierarchy by setting the appropriate pointers
                        self['$parentContext'] = parentContext;
                        self['$parent'] = parentContext['$data'];
                        self['$parents'] = (parentContext['$parents'] || []).slice(0);
                        self['$parents'].unshift(self['$parent']);
                        if (extendCallback)
                            extendCallback(self);
                    });
                };

                // Extend the binding context with new custom properties. This doesn't change the context hierarchy.
                // Similarly to "child" contexts, provide a function here to make sure that the correct values are set
                // when an observable view model is updated.
                ko.bindingContext.prototype['extend'] = function(properties) {
                    // If the parent context references an observable view model, "_subscribable" will always be the
                    // latest view model object. If not, "_subscribable" isn't set, and we can use the static "$data" value.
                    return new ko.bindingContext(this._subscribable || this['$data'], this, null, function(self, parentContext) {
                        // This "child" context doesn't directly track a parent observable view model,
                        // so we need to manually set the $rawData value to match the parent.
                        self['$rawData'] = parentContext['$rawData'];
                        ko.utils.extend(self, typeof(properties) == "function" ? properties() : properties);
                    });
                };

                // Returns the valueAccesor function for a binding value
                function makeValueAccessor(value) {
                    return function() {
                        return value;
                    };
                }

                // Returns the value of a valueAccessor function
                function evaluateValueAccessor(valueAccessor) {
                    return valueAccessor();
                }

                // Given a function that returns bindings, create and return a new object that contains
                // binding value-accessors functions. Each accessor function calls the original function
                // so that it always gets the latest value and all dependencies are captured. This is used
                // by ko.applyBindingsToNode and getBindingsAndMakeAccessors.
                function makeAccessorsFromFunction(callback) {
                    return ko.utils.objectMap(ko.dependencyDetection.ignore(callback), function(value, key) {
                        return function() {
                            return callback()[key];
                        };
                    });
                }

                // Given a bindings function or object, create and return a new object that contains
                // binding value-accessors functions. This is used by ko.applyBindingsToNode.
                function makeBindingAccessors(bindings, context, node) {
                    if (typeof bindings === 'function') {
                        return makeAccessorsFromFunction(bindings.bind(null, context, node));
                    } else {
                        return ko.utils.objectMap(bindings, makeValueAccessor);
                    }
                }

                // This function is used if the binding provider doesn't include a getBindingAccessors function.
                // It must be called with 'this' set to the provider instance.
                function getBindingsAndMakeAccessors(node, context) {
                    return makeAccessorsFromFunction(this['getBindings'].bind(this, node, context));
                }

                function validateThatBindingIsAllowedForVirtualElements(bindingName) {
                    var validator = ko.virtualElements.allowedBindings[bindingName];
                    if (!validator)
                        throw new Error("The binding '" + bindingName + "' cannot be used with virtual elements")
                }

                function applyBindingsToDescendantsInternal (bindingContext, elementOrVirtualElement, bindingContextsMayDifferFromDomParentElement) {
                    var currentChild,
                        nextInQueue = ko.virtualElements.firstChild(elementOrVirtualElement),
                        provider = ko.bindingProvider['instance'],
                        preprocessNode = provider['preprocessNode'];

                    // Preprocessing allows a binding provider to mutate a node before bindings are applied to it. For example it's
                    // possible to insert new siblings after it, and/or replace the node with a different one. This can be used to
                    // implement custom binding syntaxes, such as {{ value }} for string interpolation, or custom element types that
                    // trigger insertion of <template> contents at that point in the document.
                    if (preprocessNode) {
                        while (currentChild = nextInQueue) {
                            nextInQueue = ko.virtualElements.nextSibling(currentChild);
                            preprocessNode.call(provider, currentChild);
                        }
                        // Reset nextInQueue for the next loop
                        nextInQueue = ko.virtualElements.firstChild(elementOrVirtualElement);
                    }

                    while (currentChild = nextInQueue) {
                        // Keep a record of the next child *before* applying bindings, in case the binding removes the current child from its position
                        nextInQueue = ko.virtualElements.nextSibling(currentChild);
                        applyBindingsToNodeAndDescendantsInternal(bindingContext, currentChild, bindingContextsMayDifferFromDomParentElement);
                    }
                }

                function applyBindingsToNodeAndDescendantsInternal (bindingContext, nodeVerified, bindingContextMayDifferFromDomParentElement) {
                    var shouldBindDescendants = true;

                    // Perf optimisation: Apply bindings only if...
                    // (1) We need to store the binding context on this node (because it may differ from the DOM parent node's binding context)
                    //     Note that we can't store binding contexts on non-elements (e.g., text nodes), as IE doesn't allow expando properties for those
                    // (2) It might have bindings (e.g., it has a data-bind attribute, or it's a marker for a containerless template)
                    var isElement = (nodeVerified.nodeType === 1);
                    if (isElement) // Workaround IE <= 8 HTML parsing weirdness
                        ko.virtualElements.normaliseVirtualElementDomStructure(nodeVerified);

                    var shouldApplyBindings = (isElement && bindingContextMayDifferFromDomParentElement)             // Case (1)
                        || ko.bindingProvider['instance']['nodeHasBindings'](nodeVerified);       // Case (2)
                    if (shouldApplyBindings)
                        shouldBindDescendants = applyBindingsToNodeInternal(nodeVerified, null, bindingContext, bindingContextMayDifferFromDomParentElement)['shouldBindDescendants'];

                    if (shouldBindDescendants && !bindingDoesNotRecurseIntoElementTypes[ko.utils.tagNameLower(nodeVerified)]) {
                        // We're recursing automatically into (real or virtual) child nodes without changing binding contexts. So,
                        //  * For children of a *real* element, the binding context is certainly the same as on their DOM .parentNode,
                        //    hence bindingContextsMayDifferFromDomParentElement is false
                        //  * For children of a *virtual* element, we can't be sure. Evaluating .parentNode on those children may
                        //    skip over any number of intermediate virtual elements, any of which might define a custom binding context,
                        //    hence bindingContextsMayDifferFromDomParentElement is true
                        applyBindingsToDescendantsInternal(bindingContext, nodeVerified, /* bindingContextsMayDifferFromDomParentElement: */ !isElement);
                    }
                }

                var boundElementDomDataKey = ko.utils.domData.nextKey();


                function topologicalSortBindings(bindings) {
                    // Depth-first sort
                    var result = [],                // The list of key/handler pairs that we will return
                        bindingsConsidered = {},    // A temporary record of which bindings are already in 'result'
                        cyclicDependencyStack = []; // Keeps track of a depth-search so that, if there's a cycle, we know which bindings caused it
                    ko.utils.objectForEach(bindings, function pushBinding(bindingKey) {
                        if (!bindingsConsidered[bindingKey]) {
                            var binding = ko['getBindingHandler'](bindingKey);
                            if (binding) {
                                // First add dependencies (if any) of the current binding
                                if (binding['after']) {
                                    cyclicDependencyStack.push(bindingKey);
                                    ko.utils.arrayForEach(binding['after'], function(bindingDependencyKey) {
                                        if (bindings[bindingDependencyKey]) {
                                            if (ko.utils.arrayIndexOf(cyclicDependencyStack, bindingDependencyKey) !== -1) {
                                                throw Error("Cannot combine the following bindings, because they have a cyclic dependency: " + cyclicDependencyStack.join(", "));
                                            } else {
                                                pushBinding(bindingDependencyKey);
                                            }
                                        }
                                    });
                                    cyclicDependencyStack.length--;
                                }
                                // Next add the current binding
                                result.push({ key: bindingKey, handler: binding });
                            }
                            bindingsConsidered[bindingKey] = true;
                        }
                    });

                    return result;
                }

                function applyBindingsToNodeInternal(node, sourceBindings, bindingContext, bindingContextMayDifferFromDomParentElement) {
                    // Prevent multiple applyBindings calls for the same node, except when a binding value is specified
                    var alreadyBound = ko.utils.domData.get(node, boundElementDomDataKey);
                    if (!sourceBindings) {
                        if (alreadyBound) {
                            throw Error("You cannot apply bindings multiple times to the same element.");
                        }
                        ko.utils.domData.set(node, boundElementDomDataKey, true);
                    }

                    // Optimization: Don't store the binding context on this node if it's definitely the same as on node.parentNode, because
                    // we can easily recover it just by scanning up the node's ancestors in the DOM
                    // (note: here, parent node means "real DOM parent" not "virtual parent", as there's no O(1) way to find the virtual parent)
                    if (!alreadyBound && bindingContextMayDifferFromDomParentElement)
                        ko.storedBindingContextForNode(node, bindingContext);

                    // Use bindings if given, otherwise fall back on asking the bindings provider to give us some bindings
                    var bindings;
                    if (sourceBindings && typeof sourceBindings !== 'function') {
                        bindings = sourceBindings;
                    } else {
                        var provider = ko.bindingProvider['instance'],
                            getBindings = provider['getBindingAccessors'] || getBindingsAndMakeAccessors;

                        // Get the binding from the provider within a computed observable so that we can update the bindings whenever
                        // the binding context is updated or if the binding provider accesses observables.
                        var bindingsUpdater = ko.dependentObservable(
                            function() {
                                bindings = sourceBindings ? sourceBindings(bindingContext, node) : getBindings.call(provider, node, bindingContext);
                                // Register a dependency on the binding context to support obsevable view models.
                                if (bindings && bindingContext._subscribable)
                                    bindingContext._subscribable();
                                return bindings;
                            },
                            null, { disposeWhenNodeIsRemoved: node }
                        );

                        if (!bindings || !bindingsUpdater.isActive())
                            bindingsUpdater = null;
                    }

                    var bindingHandlerThatControlsDescendantBindings;
                    if (bindings) {
                        // Return the value accessor for a given binding. When bindings are static (won't be updated because of a binding
                        // context update), just return the value accessor from the binding. Otherwise, return a function that always gets
                        // the latest binding value and registers a dependency on the binding updater.
                        var getValueAccessor = bindingsUpdater
                            ? function(bindingKey) {
                            return function() {
                                return evaluateValueAccessor(bindingsUpdater()[bindingKey]);
                            };
                        } : function(bindingKey) {
                            return bindings[bindingKey];
                        };

                        // Use of allBindings as a function is maintained for backwards compatibility, but its use is deprecated
                        function allBindings() {
                            return ko.utils.objectMap(bindingsUpdater ? bindingsUpdater() : bindings, evaluateValueAccessor);
                        }
                        // The following is the 3.x allBindings API
                        allBindings['get'] = function(key) {
                            return bindings[key] && evaluateValueAccessor(getValueAccessor(key));
                        };
                        allBindings['has'] = function(key) {
                            return key in bindings;
                        };

                        // First put the bindings into the right order
                        var orderedBindings = topologicalSortBindings(bindings);

                        // Go through the sorted bindings, calling init and update for each
                        ko.utils.arrayForEach(orderedBindings, function(bindingKeyAndHandler) {
                            // Note that topologicalSortBindings has already filtered out any nonexistent binding handlers,
                            // so bindingKeyAndHandler.handler will always be nonnull.
                            var handlerInitFn = bindingKeyAndHandler.handler["init"],
                                handlerUpdateFn = bindingKeyAndHandler.handler["update"],
                                bindingKey = bindingKeyAndHandler.key;

                            if (node.nodeType === 8) {
                                validateThatBindingIsAllowedForVirtualElements(bindingKey);
                            }

                            try {
                                // Run init, ignoring any dependencies
                                if (typeof handlerInitFn == "function") {
                                    ko.dependencyDetection.ignore(function() {
                                        var initResult = handlerInitFn(node, getValueAccessor(bindingKey), allBindings, bindingContext['$data'], bindingContext);

                                        // If this binding handler claims to control descendant bindings, make a note of this
                                        if (initResult && initResult['controlsDescendantBindings']) {
                                            if (bindingHandlerThatControlsDescendantBindings !== undefined)
                                                throw new Error("Multiple bindings (" + bindingHandlerThatControlsDescendantBindings + " and " + bindingKey + ") are trying to control descendant bindings of the same element. You cannot use these bindings together on the same element.");
                                            bindingHandlerThatControlsDescendantBindings = bindingKey;
                                        }
                                    });
                                }

                                // Run update in its own computed wrapper
                                if (typeof handlerUpdateFn == "function") {
                                    ko.dependentObservable(
                                        function() {
                                            handlerUpdateFn(node, getValueAccessor(bindingKey), allBindings, bindingContext['$data'], bindingContext);
                                        },
                                        null,
                                        { disposeWhenNodeIsRemoved: node }
                                    );
                                }
                            } catch (ex) {
                                ex.message = "Unable to process binding \"" + bindingKey + ": " + bindings[bindingKey] + "\"\nMessage: " + ex.message;
                                throw ex;
                            }
                        });
                    }

                    return {
                        'shouldBindDescendants': bindingHandlerThatControlsDescendantBindings === undefined
                    };
                };

                var storedBindingContextDomDataKey = ko.utils.domData.nextKey();
                ko.storedBindingContextForNode = function (node, bindingContext) {
                    if (arguments.length == 2) {
                        ko.utils.domData.set(node, storedBindingContextDomDataKey, bindingContext);
                        if (bindingContext._subscribable)
                            bindingContext._subscribable._addNode(node);
                    } else {
                        return ko.utils.domData.get(node, storedBindingContextDomDataKey);
                    }
                }

                function getBindingContext(viewModelOrBindingContext) {
                    return viewModelOrBindingContext && (viewModelOrBindingContext instanceof ko.bindingContext)
                        ? viewModelOrBindingContext
                        : new ko.bindingContext(viewModelOrBindingContext);
                }

                ko.applyBindingAccessorsToNode = function (node, bindings, viewModelOrBindingContext) {
                    if (node.nodeType === 1) // If it's an element, workaround IE <= 8 HTML parsing weirdness
                        ko.virtualElements.normaliseVirtualElementDomStructure(node);
                    return applyBindingsToNodeInternal(node, bindings, getBindingContext(viewModelOrBindingContext), true);
                };

                ko.applyBindingsToNode = function (node, bindings, viewModelOrBindingContext) {
                    var context = getBindingContext(viewModelOrBindingContext);
                    return ko.applyBindingAccessorsToNode(node, makeBindingAccessors(bindings, context, node), context);
                };

                ko.applyBindingsToDescendants = function(viewModelOrBindingContext, rootNode) {
                    if (rootNode.nodeType === 1 || rootNode.nodeType === 8)
                        applyBindingsToDescendantsInternal(getBindingContext(viewModelOrBindingContext), rootNode, true);
                };

                ko.applyBindings = function (viewModelOrBindingContext, rootNode) {
                    // If jQuery is loaded after Knockout, we won't initially have access to it. So save it here.
                    if (!jQueryInstance && window['jQuery']) {
                        jQueryInstance = window['jQuery'];
                    }

                    if (rootNode && (rootNode.nodeType !== 1) && (rootNode.nodeType !== 8))
                        throw new Error("ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node");
                    rootNode = rootNode || window.document.body; // Make "rootNode" parameter optional

                    applyBindingsToNodeAndDescendantsInternal(getBindingContext(viewModelOrBindingContext), rootNode, true);
                };

                // Retrieving binding context from arbitrary nodes
                ko.contextFor = function(node) {
                    // We can only do something meaningful for elements and comment nodes (in particular, not text nodes, as IE can't store domdata for them)
                    switch (node.nodeType) {
                        case 1:
                        case 8:
                            var context = ko.storedBindingContextForNode(node);
                            if (context) return context;
                            if (node.parentNode) return ko.contextFor(node.parentNode);
                            break;
                    }
                    return undefined;
                };
                ko.dataFor = function(node) {
                    var context = ko.contextFor(node);
                    return context ? context['$data'] : undefined;
                };

                ko.exportSymbol('bindingHandlers', ko.bindingHandlers);
                ko.exportSymbol('applyBindings', ko.applyBindings);
                ko.exportSymbol('applyBindingsToDescendants', ko.applyBindingsToDescendants);
                ko.exportSymbol('applyBindingAccessorsToNode', ko.applyBindingAccessorsToNode);
                ko.exportSymbol('applyBindingsToNode', ko.applyBindingsToNode);
                ko.exportSymbol('contextFor', ko.contextFor);
                ko.exportSymbol('dataFor', ko.dataFor);
            })();
            (function(undefined) {
                var loadingSubscribablesCache = {}, // Tracks component loads that are currently in flight
                    loadedDefinitionsCache = {};    // Tracks component loads that have already completed

                ko.components = {
                    get: function(componentName, callback) {
                        var cachedDefinition = getObjectOwnProperty(loadedDefinitionsCache, componentName);
                        if (cachedDefinition) {
                            // It's already loaded and cached. Reuse the same definition object.
                            // Note that for API consistency, even cache hits complete asynchronously by default.
                            // You can bypass this by putting synchronous:true on your component config.
                            if (cachedDefinition.isSynchronousComponent) {
                                ko.dependencyDetection.ignore(function() { // See comment in loaderRegistryBehaviors.js for reasoning
                                    callback(cachedDefinition.definition);
                                });
                            } else {
                                setTimeout(function() { callback(cachedDefinition.definition); }, 0);
                            }
                        } else {
                            // Join the loading process that is already underway, or start a new one.
                            loadComponentAndNotify(componentName, callback);
                        }
                    },

                    clearCachedDefinition: function(componentName) {
                        delete loadedDefinitionsCache[componentName];
                    },

                    _getFirstResultFromLoaders: getFirstResultFromLoaders
                };

                function getObjectOwnProperty(obj, propName) {
                    return obj.hasOwnProperty(propName) ? obj[propName] : undefined;
                }

                function loadComponentAndNotify(componentName, callback) {
                    var subscribable = getObjectOwnProperty(loadingSubscribablesCache, componentName),
                        completedAsync;
                    if (!subscribable) {
                        // It's not started loading yet. Start loading, and when it's done, move it to loadedDefinitionsCache.
                        subscribable = loadingSubscribablesCache[componentName] = new ko.subscribable();
                        subscribable.subscribe(callback);

                        beginLoadingComponent(componentName, function(definition, config) {
                            var isSynchronousComponent = !!(config && config['synchronous']);
                            loadedDefinitionsCache[componentName] = { definition: definition, isSynchronousComponent: isSynchronousComponent };
                            delete loadingSubscribablesCache[componentName];

                            // For API consistency, all loads complete asynchronously. However we want to avoid
                            // adding an extra setTimeout if it's unnecessary (i.e., the completion is already
                            // async) since setTimeout(..., 0) still takes about 16ms or more on most browsers.
                            //
                            // You can bypass the 'always synchronous' feature by putting the synchronous:true
                            // flag on your component configuration when you register it.
                            if (completedAsync || isSynchronousComponent) {
                                // Note that notifySubscribers ignores any dependencies read within the callback.
                                // See comment in loaderRegistryBehaviors.js for reasoning
                                subscribable['notifySubscribers'](definition);
                            } else {
                                setTimeout(function() {
                                    subscribable['notifySubscribers'](definition);
                                }, 0);
                            }
                        });
                        completedAsync = true;
                    } else {
                        subscribable.subscribe(callback);
                    }
                }

                function beginLoadingComponent(componentName, callback) {
                    getFirstResultFromLoaders('getConfig', [componentName], function(config) {
                        if (config) {
                            // We have a config, so now load its definition
                            getFirstResultFromLoaders('loadComponent', [componentName, config], function(definition) {
                                callback(definition, config);
                            });
                        } else {
                            // The component has no config - it's unknown to all the loaders.
                            // Note that this is not an error (e.g., a module loading error) - that would abort the
                            // process and this callback would not run. For this callback to run, all loaders must
                            // have confirmed they don't know about this component.
                            callback(null, null);
                        }
                    });
                }

                function getFirstResultFromLoaders(methodName, argsExceptCallback, callback, candidateLoaders) {
                    // On the first call in the stack, start with the full set of loaders
                    if (!candidateLoaders) {
                        candidateLoaders = ko.components['loaders'].slice(0); // Use a copy, because we'll be mutating this array
                    }

                    // Try the next candidate
                    var currentCandidateLoader = candidateLoaders.shift();
                    if (currentCandidateLoader) {
                        var methodInstance = currentCandidateLoader[methodName];
                        if (methodInstance) {
                            var wasAborted = false,
                                synchronousReturnValue = methodInstance.apply(currentCandidateLoader, argsExceptCallback.concat(function(result) {
                                    if (wasAborted) {
                                        callback(null);
                                    } else if (result !== null) {
                                        // This candidate returned a value. Use it.
                                        callback(result);
                                    } else {
                                        // Try the next candidate
                                        getFirstResultFromLoaders(methodName, argsExceptCallback, callback, candidateLoaders);
                                    }
                                }));

                            // Currently, loaders may not return anything synchronously. This leaves open the possibility
                            // that we'll extend the API to support synchronous return values in the future. It won't be
                            // a breaking change, because currently no loader is allowed to return anything except undefined.
                            if (synchronousReturnValue !== undefined) {
                                wasAborted = true;

                                // Method to suppress exceptions will remain undocumented. This is only to keep
                                // KO's specs running tidily, since we can observe the loading got aborted without
                                // having exceptions cluttering up the console too.
                                if (!currentCandidateLoader['suppressLoaderExceptions']) {
                                    throw new Error('Component loaders must supply values by invoking the callback, not by returning values synchronously.');
                                }
                            }
                        } else {
                            // This candidate doesn't have the relevant handler. Synchronously move on to the next one.
                            getFirstResultFromLoaders(methodName, argsExceptCallback, callback, candidateLoaders);
                        }
                    } else {
                        // No candidates returned a value
                        callback(null);
                    }
                }

                // Reference the loaders via string name so it's possible for developers
                // to replace the whole array by assigning to ko.components.loaders
                ko.components['loaders'] = [];

                ko.exportSymbol('components', ko.components);
                ko.exportSymbol('components.get', ko.components.get);
                ko.exportSymbol('components.clearCachedDefinition', ko.components.clearCachedDefinition);
            })();
            (function(undefined) {

                // The default loader is responsible for two things:
                // 1. Maintaining the default in-memory registry of component configuration objects
                //    (i.e., the thing you're writing to when you call ko.components.register(someName, ...))
                // 2. Answering requests for components by fetching configuration objects
                //    from that default in-memory registry and resolving them into standard
                //    component definition objects (of the form { createViewModel: ..., template: ... })
                // Custom loaders may override either of these facilities, i.e.,
                // 1. To supply configuration objects from some other source (e.g., conventions)
                // 2. Or, to resolve configuration objects by loading viewmodels/templates via arbitrary logic.

                var defaultConfigRegistry = {};

                ko.components.register = function(componentName, config) {
                    if (!config) {
                        throw new Error('Invalid configuration for ' + componentName);
                    }

                    if (ko.components.isRegistered(componentName)) {
                        throw new Error('Component ' + componentName + ' is already registered');
                    }

                    defaultConfigRegistry[componentName] = config;
                }

                ko.components.isRegistered = function(componentName) {
                    return componentName in defaultConfigRegistry;
                }

                ko.components.unregister = function(componentName) {
                    delete defaultConfigRegistry[componentName];
                    ko.components.clearCachedDefinition(componentName);
                }

                ko.components.defaultLoader = {
                    'getConfig': function(componentName, callback) {
                        var result = defaultConfigRegistry.hasOwnProperty(componentName)
                            ? defaultConfigRegistry[componentName]
                            : null;
                        callback(result);
                    },

                    'loadComponent': function(componentName, config, callback) {
                        var errorCallback = makeErrorCallback(componentName);
                        possiblyGetConfigFromAmd(errorCallback, config, function(loadedConfig) {
                            resolveConfig(componentName, errorCallback, loadedConfig, callback);
                        });
                    },

                    'loadTemplate': function(componentName, templateConfig, callback) {
                        resolveTemplate(makeErrorCallback(componentName), templateConfig, callback);
                    },

                    'loadViewModel': function(componentName, viewModelConfig, callback) {
                        resolveViewModel(makeErrorCallback(componentName), viewModelConfig, callback);
                    }
                };

                var createViewModelKey = 'createViewModel';

                // Takes a config object of the form { template: ..., viewModel: ... }, and asynchronously convert it
                // into the standard component definition format:
                //    { template: <ArrayOfDomNodes>, createViewModel: function(params, componentInfo) { ... } }.
                // Since both template and viewModel may need to be resolved asynchronously, both tasks are performed
                // in parallel, and the results joined when both are ready. We don't depend on any promises infrastructure,
                // so this is implemented manually below.
                function resolveConfig(componentName, errorCallback, config, callback) {
                    var result = {},
                        makeCallBackWhenZero = 2,
                        tryIssueCallback = function() {
                            if (--makeCallBackWhenZero === 0) {
                                callback(result);
                            }
                        },
                        templateConfig = config['template'],
                        viewModelConfig = config['viewModel'];

                    if (templateConfig) {
                        possiblyGetConfigFromAmd(errorCallback, templateConfig, function(loadedConfig) {
                            ko.components._getFirstResultFromLoaders('loadTemplate', [componentName, loadedConfig], function(resolvedTemplate) {
                                result['template'] = resolvedTemplate;
                                tryIssueCallback();
                            });
                        });
                    } else {
                        tryIssueCallback();
                    }

                    if (viewModelConfig) {
                        possiblyGetConfigFromAmd(errorCallback, viewModelConfig, function(loadedConfig) {
                            ko.components._getFirstResultFromLoaders('loadViewModel', [componentName, loadedConfig], function(resolvedViewModel) {
                                result[createViewModelKey] = resolvedViewModel;
                                tryIssueCallback();
                            });
                        });
                    } else {
                        tryIssueCallback();
                    }
                }

                function resolveTemplate(errorCallback, templateConfig, callback) {
                    if (typeof templateConfig === 'string') {
                        // Markup - parse it
                        callback(ko.utils.parseHtmlFragment(templateConfig));
                    } else if (templateConfig instanceof Array) {
                        // Assume already an array of DOM nodes - pass through unchanged
                        callback(templateConfig);
                    } else if (isDocumentFragment(templateConfig)) {
                        // Document fragment - use its child nodes
                        callback(ko.utils.makeArray(templateConfig.childNodes));
                    } else if (templateConfig['element']) {
                        var element = templateConfig['element'];
                        if (isDomElement(element)) {
                            // Element instance - copy its child nodes
                            callback(cloneNodesFromTemplateSourceElement(element));
                        } else if (typeof element === 'string') {
                            // Element ID - find it, then copy its child nodes
                            var elemInstance = document.getElementById(element);
                            if (elemInstance) {
                                callback(cloneNodesFromTemplateSourceElement(elemInstance));
                            } else {
                                errorCallback('Cannot find element with ID ' + element);
                            }
                        } else {
                            errorCallback('Unknown element type: ' + element);
                        }
                    } else {
                        errorCallback('Unknown template value: ' + templateConfig);
                    }
                }

                function resolveViewModel(errorCallback, viewModelConfig, callback) {
                    if (typeof viewModelConfig === 'function') {
                        // Constructor - convert to standard factory function format
                        // By design, this does *not* supply componentInfo to the constructor, as the intent is that
                        // componentInfo contains non-viewmodel data (e.g., the component's element) that should only
                        // be used in factory functions, not viewmodel constructors.
                        callback(function (params /*, componentInfo */) {
                            return new viewModelConfig(params);
                        });
                    } else if (typeof viewModelConfig[createViewModelKey] === 'function') {
                        // Already a factory function - use it as-is
                        callback(viewModelConfig[createViewModelKey]);
                    } else if ('instance' in viewModelConfig) {
                        // Fixed object instance - promote to createViewModel format for API consistency
                        var fixedInstance = viewModelConfig['instance'];
                        callback(function (params, componentInfo) {
                            return fixedInstance;
                        });
                    } else if ('viewModel' in viewModelConfig) {
                        // Resolved AMD module whose value is of the form { viewModel: ... }
                        resolveViewModel(errorCallback, viewModelConfig['viewModel'], callback);
                    } else {
                        errorCallback('Unknown viewModel value: ' + viewModelConfig);
                    }
                }

                function cloneNodesFromTemplateSourceElement(elemInstance) {
                    switch (ko.utils.tagNameLower(elemInstance)) {
                        case 'script':
                            return ko.utils.parseHtmlFragment(elemInstance.text);
                        case 'textarea':
                            return ko.utils.parseHtmlFragment(elemInstance.value);
                        case 'template':
                            // For browsers with proper <template> element support (i.e., where the .content property
                            // gives a document fragment), use that document fragment.
                            if (isDocumentFragment(elemInstance.content)) {
                                return ko.utils.cloneNodes(elemInstance.content.childNodes);
                            }
                    }

                    // Regular elements such as <div>, and <template> elements on old browsers that don't really
                    // understand <template> and just treat it as a regular container
                    return ko.utils.cloneNodes(elemInstance.childNodes);
                }

                function isDomElement(obj) {
                    if (window['HTMLElement']) {
                        return obj instanceof HTMLElement;
                    } else {
                        return obj && obj.tagName && obj.nodeType === 1;
                    }
                }

                function isDocumentFragment(obj) {
                    if (window['DocumentFragment']) {
                        return obj instanceof DocumentFragment;
                    } else {
                        return obj && obj.nodeType === 11;
                    }
                }

                function possiblyGetConfigFromAmd(errorCallback, config, callback) {
                    if (typeof config['require'] === 'string') {
                        // The config is the value of an AMD module
                        if (amdRequire || window['require']) {
                            (amdRequire || window['require'])([config['require']], callback);
                        } else {
                            errorCallback('Uses require, but no AMD loader is present');
                        }
                    } else {
                        callback(config);
                    }
                }

                function makeErrorCallback(componentName) {
                    return function (message) {
                        throw new Error('Component \'' + componentName + '\': ' + message);
                    };
                }

                ko.exportSymbol('components.register', ko.components.register);
                ko.exportSymbol('components.isRegistered', ko.components.isRegistered);
                ko.exportSymbol('components.unregister', ko.components.unregister);

                // Expose the default loader so that developers can directly ask it for configuration
                // or to resolve configuration
                ko.exportSymbol('components.defaultLoader', ko.components.defaultLoader);

                // By default, the default loader is the only registered component loader
                ko.components['loaders'].push(ko.components.defaultLoader);

                // Privately expose the underlying config registry for use in old-IE shim
                ko.components._allRegisteredComponents = defaultConfigRegistry;
            })();
            (function (undefined) {
                // Overridable API for determining which component name applies to a given node. By overriding this,
                // you can for example map specific tagNames to components that are not preregistered.
                ko.components['getComponentNameForNode'] = function(node) {
                    var tagNameLower = ko.utils.tagNameLower(node);
                    return ko.components.isRegistered(tagNameLower) && tagNameLower;
                };

                ko.components.addBindingsForCustomElement = function(allBindings, node, bindingContext, valueAccessors) {
                    // Determine if it's really a custom element matching a component
                    if (node.nodeType === 1) {
                        var componentName = ko.components['getComponentNameForNode'](node);
                        if (componentName) {
                            // It does represent a component, so add a component binding for it
                            allBindings = allBindings || {};

                            if (allBindings['component']) {
                                // Avoid silently overwriting some other 'component' binding that may already be on the element
                                throw new Error('Cannot use the "component" binding on a custom element matching a component');
                            }

                            var componentBindingValue = { 'name': componentName, 'params': getComponentParamsFromCustomElement(node, bindingContext) };

                            allBindings['component'] = valueAccessors
                                ? function() { return componentBindingValue; }
                                : componentBindingValue;
                        }
                    }

                    return allBindings;
                }

                var nativeBindingProviderInstance = new ko.bindingProvider();

                function getComponentParamsFromCustomElement(elem, bindingContext) {
                    var paramsAttribute = elem.getAttribute('params');

                    if (paramsAttribute) {
                        var params = nativeBindingProviderInstance['parseBindingsString'](paramsAttribute, bindingContext, elem, { 'valueAccessors': true, 'bindingParams': true }),
                            rawParamComputedValues = ko.utils.objectMap(params, function(paramValue, paramName) {
                                return ko.computed(paramValue, null, { disposeWhenNodeIsRemoved: elem });
                            }),
                            result = ko.utils.objectMap(rawParamComputedValues, function(paramValueComputed, paramName) {
                                var paramValue = paramValueComputed.peek();
                                // Does the evaluation of the parameter value unwrap any observables?
                                if (!paramValueComputed.isActive()) {
                                    // No it doesn't, so there's no need for any computed wrapper. Just pass through the supplied value directly.
                                    // Example: "someVal: firstName, age: 123" (whether or not firstName is an observable/computed)
                                    return paramValue;
                                } else {
                                    // Yes it does. Supply a computed property that unwraps both the outer (binding expression)
                                    // level of observability, and any inner (resulting model value) level of observability.
                                    // This means the component doesn't have to worry about multiple unwrapping. If the value is a
                                    // writable observable, the computed will also be writable and pass the value on to the observable.
                                    return ko.computed({
                                        'read': function() {
                                            return ko.utils.unwrapObservable(paramValueComputed());
                                        },
                                        'write': ko.isWriteableObservable(paramValue) && function(value) {
                                            paramValueComputed()(value);
                                        },
                                        disposeWhenNodeIsRemoved: elem
                                    });
                                }
                            });

                        // Give access to the raw computeds, as long as that wouldn't overwrite any custom param also called '$raw'
                        // This is in case the developer wants to react to outer (binding) observability separately from inner
                        // (model value) observability, or in case the model value observable has subobservables.
                        if (!result.hasOwnProperty('$raw')) {
                            result['$raw'] = rawParamComputedValues;
                        }

                        return result;
                    } else {
                        // For consistency, absence of a "params" attribute is treated the same as the presence of
                        // any empty one. Otherwise component viewmodels need special code to check whether or not
                        // 'params' or 'params.$raw' is null/undefined before reading subproperties, which is annoying.
                        return { '$raw': {} };
                    }
                }

                // --------------------------------------------------------------------------------
                // Compatibility code for older (pre-HTML5) IE browsers

                if (ko.utils.ieVersion < 9) {
                    // Whenever you preregister a component, enable it as a custom element in the current document
                    ko.components['register'] = (function(originalFunction) {
                        return function(componentName) {
                            document.createElement(componentName); // Allows IE<9 to parse markup containing the custom element
                            return originalFunction.apply(this, arguments);
                        }
                    })(ko.components['register']);

                    // Whenever you create a document fragment, enable all preregistered component names as custom elements
                    // This is needed to make innerShiv/jQuery HTML parsing correctly handle the custom elements
                    document.createDocumentFragment = (function(originalFunction) {
                        return function() {
                            var newDocFrag = originalFunction(),
                                allComponents = ko.components._allRegisteredComponents;
                            for (var componentName in allComponents) {
                                if (allComponents.hasOwnProperty(componentName)) {
                                    newDocFrag.createElement(componentName);
                                }
                            }
                            return newDocFrag;
                        };
                    })(document.createDocumentFragment);
                }
            })();(function(undefined) {

                var componentLoadingOperationUniqueId = 0;

                ko.bindingHandlers['component'] = {
                    'init': function(element, valueAccessor, ignored1, ignored2, bindingContext) {
                        var currentViewModel,
                            currentLoadingOperationId,
                            disposeAssociatedComponentViewModel = function () {
                                var currentViewModelDispose = currentViewModel && currentViewModel['dispose'];
                                if (typeof currentViewModelDispose === 'function') {
                                    currentViewModelDispose.call(currentViewModel);
                                }

                                // Any in-flight loading operation is no longer relevant, so make sure we ignore its completion
                                currentLoadingOperationId = null;
                            },
                            originalChildNodes = ko.utils.makeArray(ko.virtualElements.childNodes(element));

                        ko.utils.domNodeDisposal.addDisposeCallback(element, disposeAssociatedComponentViewModel);

                        ko.computed(function () {
                            var value = ko.utils.unwrapObservable(valueAccessor()),
                                componentName, componentParams;

                            if (typeof value === 'string') {
                                componentName = value;
                            } else {
                                componentName = ko.utils.unwrapObservable(value['name']);
                                componentParams = ko.utils.unwrapObservable(value['params']);
                            }

                            if (!componentName) {
                                throw new Error('No component name specified');
                            }

                            var loadingOperationId = currentLoadingOperationId = ++componentLoadingOperationUniqueId;
                            ko.components.get(componentName, function(componentDefinition) {
                                // If this is not the current load operation for this element, ignore it.
                                if (currentLoadingOperationId !== loadingOperationId) {
                                    return;
                                }

                                // Clean up previous state
                                disposeAssociatedComponentViewModel();

                                // Instantiate and bind new component. Implicitly this cleans any old DOM nodes.
                                if (!componentDefinition) {
                                    throw new Error('Unknown component \'' + componentName + '\'');
                                }
                                cloneTemplateIntoElement(componentName, componentDefinition, element);
                                var componentViewModel = createViewModel(componentDefinition, element, originalChildNodes, componentParams),
                                    childBindingContext = bindingContext['createChildContext'](componentViewModel, /* dataItemAlias */ undefined, function(ctx) {
                                        ctx['$component'] = componentViewModel;
                                        ctx['$componentTemplateNodes'] = originalChildNodes;
                                    });
                                currentViewModel = componentViewModel;
                                ko.applyBindingsToDescendants(childBindingContext, element);
                            });
                        }, null, { disposeWhenNodeIsRemoved: element });

                        return { 'controlsDescendantBindings': true };
                    }
                };

                ko.virtualElements.allowedBindings['component'] = true;

                function cloneTemplateIntoElement(componentName, componentDefinition, element) {
                    var template = componentDefinition['template'];
                    if (!template) {
                        throw new Error('Component \'' + componentName + '\' has no template');
                    }

                    var clonedNodesArray = ko.utils.cloneNodes(template);
                    ko.virtualElements.setDomNodeChildren(element, clonedNodesArray);
                }

                function createViewModel(componentDefinition, element, originalChildNodes, componentParams) {
                    var componentViewModelFactory = componentDefinition['createViewModel'];
                    return componentViewModelFactory
                        ? componentViewModelFactory.call(componentDefinition, componentParams, { 'element': element, 'templateNodes': originalChildNodes })
                        : componentParams; // Template-only component
                }

            })();
            var attrHtmlToJavascriptMap = { 'class': 'className', 'for': 'htmlFor' };
            ko.bindingHandlers['attr'] = {
                'update': function(element, valueAccessor, allBindings) {
                    var value = ko.utils.unwrapObservable(valueAccessor()) || {};
                    ko.utils.objectForEach(value, function(attrName, attrValue) {
                        attrValue = ko.utils.unwrapObservable(attrValue);

                        // To cover cases like "attr: { checked:someProp }", we want to remove the attribute entirely
                        // when someProp is a "no value"-like value (strictly null, false, or undefined)
                        // (because the absence of the "checked" attr is how to mark an element as not checked, etc.)
                        var toRemove = (attrValue === false) || (attrValue === null) || (attrValue === undefined);
                        if (toRemove)
                            element.removeAttribute(attrName);

                        // In IE <= 7 and IE8 Quirks Mode, you have to use the Javascript property name instead of the
                        // HTML attribute name for certain attributes. IE8 Standards Mode supports the correct behavior,
                        // but instead of figuring out the mode, we'll just set the attribute through the Javascript
                        // property for IE <= 8.
                        if (ko.utils.ieVersion <= 8 && attrName in attrHtmlToJavascriptMap) {
                            attrName = attrHtmlToJavascriptMap[attrName];
                            if (toRemove)
                                element.removeAttribute(attrName);
                            else
                                element[attrName] = attrValue;
                        } else if (!toRemove) {
                            element.setAttribute(attrName, attrValue.toString());
                        }

                        // Treat "name" specially - although you can think of it as an attribute, it also needs
                        // special handling on older versions of IE (https://github.com/SteveSanderson/knockout/pull/333)
                        // Deliberately being case-sensitive here because XHTML would regard "Name" as a different thing
                        // entirely, and there's no strong reason to allow for such casing in HTML.
                        if (attrName === "name") {
                            ko.utils.setElementName(element, toRemove ? "" : attrValue.toString());
                        }
                    });
                }
            };
            (function() {

                ko.bindingHandlers['checked'] = {
                    'after': ['value', 'attr'],
                    'init': function (element, valueAccessor, allBindings) {
                        var checkedValue = ko.pureComputed(function() {
                            // Treat "value" like "checkedValue" when it is included with "checked" binding
                            if (allBindings['has']('checkedValue')) {
                                return ko.utils.unwrapObservable(allBindings.get('checkedValue'));
                            } else if (allBindings['has']('value')) {
                                return ko.utils.unwrapObservable(allBindings.get('value'));
                            }

                            return element.value;
                        });

                        function updateModel() {
                            // This updates the model value from the view value.
                            // It runs in response to DOM events (click) and changes in checkedValue.
                            var isChecked = element.checked,
                                elemValue = useCheckedValue ? checkedValue() : isChecked;

                            // When we're first setting up this computed, don't change any model state.
                            if (ko.computedContext.isInitial()) {
                                return;
                            }

                            // We can ignore unchecked radio buttons, because some other radio
                            // button will be getting checked, and that one can take care of updating state.
                            if (isRadio && !isChecked) {
                                return;
                            }

                            var modelValue = ko.dependencyDetection.ignore(valueAccessor);
                            if (isValueArray) {
                                if (oldElemValue !== elemValue) {
                                    // When we're responding to the checkedValue changing, and the element is
                                    // currently checked, replace the old elem value with the new elem value
                                    // in the model array.
                                    if (isChecked) {
                                        ko.utils.addOrRemoveItem(modelValue, elemValue, true);
                                        ko.utils.addOrRemoveItem(modelValue, oldElemValue, false);
                                    }

                                    oldElemValue = elemValue;
                                } else {
                                    // When we're responding to the user having checked/unchecked a checkbox,
                                    // add/remove the element value to the model array.
                                    ko.utils.addOrRemoveItem(modelValue, elemValue, isChecked);
                                }
                            } else {
                                ko.expressionRewriting.writeValueToProperty(modelValue, allBindings, 'checked', elemValue, true);
                            }
                        };

                        function updateView() {
                            // This updates the view value from the model value.
                            // It runs in response to changes in the bound (checked) value.
                            var modelValue = ko.utils.unwrapObservable(valueAccessor());

                            if (isValueArray) {
                                // When a checkbox is bound to an array, being checked represents its value being present in that array
                                element.checked = ko.utils.arrayIndexOf(modelValue, checkedValue()) >= 0;
                            } else if (isCheckbox) {
                                // When a checkbox is bound to any other value (not an array), being checked represents the value being trueish
                                element.checked = modelValue;
                            } else {
                                // For radio buttons, being checked means that the radio button's value corresponds to the model value
                                element.checked = (checkedValue() === modelValue);
                            }
                        };

                        var isCheckbox = element.type == "checkbox",
                            isRadio = element.type == "radio";

                        // Only bind to check boxes and radio buttons
                        if (!isCheckbox && !isRadio) {
                            return;
                        }

                        var isValueArray = isCheckbox && (ko.utils.unwrapObservable(valueAccessor()) instanceof Array),
                            oldElemValue = isValueArray ? checkedValue() : undefined,
                            useCheckedValue = isRadio || isValueArray;

                        // IE 6 won't allow radio buttons to be selected unless they have a name
                        if (isRadio && !element.name)
                            ko.bindingHandlers['uniqueName']['init'](element, function() { return true });

                        // Set up two computeds to update the binding:

                        // The first responds to changes in the checkedValue value and to element clicks
                        ko.computed(updateModel, null, { disposeWhenNodeIsRemoved: element });
                        ko.utils.registerEventHandler(element, "click", updateModel);

                        // The second responds to changes in the model value (the one associated with the checked binding)
                        ko.computed(updateView, null, { disposeWhenNodeIsRemoved: element });
                    }
                };
                ko.expressionRewriting.twoWayBindings['checked'] = true;

                ko.bindingHandlers['checkedValue'] = {
                    'update': function (element, valueAccessor) {
                        element.value = ko.utils.unwrapObservable(valueAccessor());
                    }
                };

            })();var classesWrittenByBindingKey = '__ko__cssValue';
            ko.bindingHandlers['css'] = {
                'update': function (element, valueAccessor) {
                    var value = ko.utils.unwrapObservable(valueAccessor());
                    if (value !== null && typeof value == "object") {
                        ko.utils.objectForEach(value, function(className, shouldHaveClass) {
                            shouldHaveClass = ko.utils.unwrapObservable(shouldHaveClass);
                            ko.utils.toggleDomNodeCssClass(element, className, shouldHaveClass);
                        });
                    } else {
                        value = String(value || ''); // Make sure we don't try to store or set a non-string value
                        ko.utils.toggleDomNodeCssClass(element, element[classesWrittenByBindingKey], false);
                        element[classesWrittenByBindingKey] = value;
                        ko.utils.toggleDomNodeCssClass(element, value, true);
                    }
                }
            };
            ko.bindingHandlers['enable'] = {
                'update': function (element, valueAccessor) {
                    var value = ko.utils.unwrapObservable(valueAccessor());
                    if (value && element.disabled)
                        element.removeAttribute("disabled");
                    else if ((!value) && (!element.disabled))
                        element.disabled = true;
                }
            };

            ko.bindingHandlers['disable'] = {
                'update': function (element, valueAccessor) {
                    ko.bindingHandlers['enable']['update'](element, function() { return !ko.utils.unwrapObservable(valueAccessor()) });
                }
            };
// For certain common events (currently just 'click'), allow a simplified data-binding syntax
// e.g. click:handler instead of the usual full-length event:{click:handler}
            function makeEventHandlerShortcut(eventName) {
                ko.bindingHandlers[eventName] = {
                    'init': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                        var newValueAccessor = function () {
                            var result = {};
                            result[eventName] = valueAccessor();
                            return result;
                        };
                        return ko.bindingHandlers['event']['init'].call(this, element, newValueAccessor, allBindings, viewModel, bindingContext);
                    }
                }
            }

            ko.bindingHandlers['event'] = {
                'init' : function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    var eventsToHandle = valueAccessor() || {};
                    ko.utils.objectForEach(eventsToHandle, function(eventName) {
                        if (typeof eventName == "string") {
                            ko.utils.registerEventHandler(element, eventName, function (event) {
                                var handlerReturnValue;
                                var handlerFunction = valueAccessor()[eventName];
                                if (!handlerFunction)
                                    return;

                                try {
                                    // Take all the event args, and prefix with the viewmodel
                                    var argsForHandler = ko.utils.makeArray(arguments);
                                    viewModel = bindingContext['$data'];
                                    argsForHandler.unshift(viewModel);
                                    handlerReturnValue = handlerFunction.apply(viewModel, argsForHandler);
                                } finally {
                                    if (handlerReturnValue !== true) { // Normally we want to prevent default action. Developer can override this be explicitly returning true.
                                        if (event.preventDefault)
                                            event.preventDefault();
                                        else
                                            event.returnValue = false;
                                    }
                                }

                                var bubble = allBindings.get(eventName + 'Bubble') !== false;
                                if (!bubble) {
                                    event.cancelBubble = true;
                                    if (event.stopPropagation)
                                        event.stopPropagation();
                                }
                            });
                        }
                    });
                }
            };
// "foreach: someExpression" is equivalent to "template: { foreach: someExpression }"
// "foreach: { data: someExpression, afterAdd: myfn }" is equivalent to "template: { foreach: someExpression, afterAdd: myfn }"
            ko.bindingHandlers['foreach'] = {
                makeTemplateValueAccessor: function(valueAccessor) {
                    return function() {
                        var modelValue = valueAccessor(),
                            unwrappedValue = ko.utils.peekObservable(modelValue);    // Unwrap without setting a dependency here

                        // If unwrappedValue is the array, pass in the wrapped value on its own
                        // The value will be unwrapped and tracked within the template binding
                        // (See https://github.com/SteveSanderson/knockout/issues/523)
                        if ((!unwrappedValue) || typeof unwrappedValue.length == "number")
                            return { 'foreach': modelValue, 'templateEngine': ko.nativeTemplateEngine.instance };

                        // If unwrappedValue.data is the array, preserve all relevant options and unwrap again value so we get updates
                        ko.utils.unwrapObservable(modelValue);
                        return {
                            'foreach': unwrappedValue['data'],
                            'as': unwrappedValue['as'],
                            'includeDestroyed': unwrappedValue['includeDestroyed'],
                            'afterAdd': unwrappedValue['afterAdd'],
                            'beforeRemove': unwrappedValue['beforeRemove'],
                            'afterRender': unwrappedValue['afterRender'],
                            'beforeMove': unwrappedValue['beforeMove'],
                            'afterMove': unwrappedValue['afterMove'],
                            'templateEngine': ko.nativeTemplateEngine.instance
                        };
                    };
                },
                'init': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                    return ko.bindingHandlers['template']['init'](element, ko.bindingHandlers['foreach'].makeTemplateValueAccessor(valueAccessor));
                },
                'update': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                    return ko.bindingHandlers['template']['update'](element, ko.bindingHandlers['foreach'].makeTemplateValueAccessor(valueAccessor), allBindings, viewModel, bindingContext);
                }
            };
            ko.expressionRewriting.bindingRewriteValidators['foreach'] = false; // Can't rewrite control flow bindings
            ko.virtualElements.allowedBindings['foreach'] = true;
            var hasfocusUpdatingProperty = '__ko_hasfocusUpdating';
            var hasfocusLastValue = '__ko_hasfocusLastValue';
            ko.bindingHandlers['hasfocus'] = {
                'init': function(element, valueAccessor, allBindings) {
                    var handleElementFocusChange = function(isFocused) {
                        // Where possible, ignore which event was raised and determine focus state using activeElement,
                        // as this avoids phantom focus/blur events raised when changing tabs in modern browsers.
                        // However, not all KO-targeted browsers (Firefox 2) support activeElement. For those browsers,
                        // prevent a loss of focus when changing tabs/windows by setting a flag that prevents hasfocus
                        // from calling 'blur()' on the element when it loses focus.
                        // Discussion at https://github.com/SteveSanderson/knockout/pull/352
                        element[hasfocusUpdatingProperty] = true;
                        var ownerDoc = element.ownerDocument;
                        if ("activeElement" in ownerDoc) {
                            var active;
                            try {
                                active = ownerDoc.activeElement;
                            } catch(e) {
                                // IE9 throws if you access activeElement during page load (see issue #703)
                                active = ownerDoc.body;
                            }
                            isFocused = (active === element);
                        }
                        var modelValue = valueAccessor();
                        ko.expressionRewriting.writeValueToProperty(modelValue, allBindings, 'hasfocus', isFocused, true);

                        //cache the latest value, so we can avoid unnecessarily calling focus/blur in the update function
                        element[hasfocusLastValue] = isFocused;
                        element[hasfocusUpdatingProperty] = false;
                    };
                    var handleElementFocusIn = handleElementFocusChange.bind(null, true);
                    var handleElementFocusOut = handleElementFocusChange.bind(null, false);

                    ko.utils.registerEventHandler(element, "focus", handleElementFocusIn);
                    ko.utils.registerEventHandler(element, "focusin", handleElementFocusIn); // For IE
                    ko.utils.registerEventHandler(element, "blur",  handleElementFocusOut);
                    ko.utils.registerEventHandler(element, "focusout",  handleElementFocusOut); // For IE
                },
                'update': function(element, valueAccessor) {
                    var value = !!ko.utils.unwrapObservable(valueAccessor()); //force boolean to compare with last value
                    if (!element[hasfocusUpdatingProperty] && element[hasfocusLastValue] !== value) {
                        value ? element.focus() : element.blur();
                        ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, value ? "focusin" : "focusout"]); // For IE, which doesn't reliably fire "focus" or "blur" events synchronously
                    }
                }
            };
            ko.expressionRewriting.twoWayBindings['hasfocus'] = true;

            ko.bindingHandlers['hasFocus'] = ko.bindingHandlers['hasfocus']; // Make "hasFocus" an alias
            ko.expressionRewriting.twoWayBindings['hasFocus'] = true;
            ko.bindingHandlers['html'] = {
                'init': function() {
                    // Prevent binding on the dynamically-injected HTML (as developers are unlikely to expect that, and it has security implications)
                    return { 'controlsDescendantBindings': true };
                },
                'update': function (element, valueAccessor) {
                    // setHtml will unwrap the value if needed
                    ko.utils.setHtml(element, valueAccessor());
                }
            };
// Makes a binding like with or if
            function makeWithIfBinding(bindingKey, isWith, isNot, makeContextCallback) {
                ko.bindingHandlers[bindingKey] = {
                    'init': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                        var didDisplayOnLastUpdate,
                            savedNodes;
                        ko.computed(function() {
                            var dataValue = ko.utils.unwrapObservable(valueAccessor()),
                                shouldDisplay = !isNot !== !dataValue, // equivalent to isNot ? !dataValue : !!dataValue
                                isFirstRender = !savedNodes,
                                needsRefresh = isFirstRender || isWith || (shouldDisplay !== didDisplayOnLastUpdate);

                            if (needsRefresh) {
                                // Save a copy of the inner nodes on the initial update, but only if we have dependencies.
                                if (isFirstRender && ko.computedContext.getDependenciesCount()) {
                                    savedNodes = ko.utils.cloneNodes(ko.virtualElements.childNodes(element), true /* shouldCleanNodes */);
                                }

                                if (shouldDisplay) {
                                    if (!isFirstRender) {
                                        ko.virtualElements.setDomNodeChildren(element, ko.utils.cloneNodes(savedNodes));
                                    }
                                    ko.applyBindingsToDescendants(makeContextCallback ? makeContextCallback(bindingContext, dataValue) : bindingContext, element);
                                } else {
                                    ko.virtualElements.emptyNode(element);
                                }

                                didDisplayOnLastUpdate = shouldDisplay;
                            }
                        }, null, { disposeWhenNodeIsRemoved: element });
                        return { 'controlsDescendantBindings': true };
                    }
                };
                ko.expressionRewriting.bindingRewriteValidators[bindingKey] = false; // Can't rewrite control flow bindings
                ko.virtualElements.allowedBindings[bindingKey] = true;
            }

// Construct the actual binding handlers
            makeWithIfBinding('if');
            makeWithIfBinding('ifnot', false /* isWith */, true /* isNot */);
            makeWithIfBinding('with', true /* isWith */, false /* isNot */,
                function(bindingContext, dataValue) {
                    return bindingContext['createChildContext'](dataValue);
                }
            );
            var captionPlaceholder = {};
            ko.bindingHandlers['options'] = {
                'init': function(element) {
                    if (ko.utils.tagNameLower(element) !== "select")
                        throw new Error("options binding applies only to SELECT elements");

                    // Remove all existing <option>s.
                    while (element.length > 0) {
                        element.remove(0);
                    }

                    // Ensures that the binding processor doesn't try to bind the options
                    return { 'controlsDescendantBindings': true };
                },
                'update': function (element, valueAccessor, allBindings) {
                    function selectedOptions() {
                        return ko.utils.arrayFilter(element.options, function (node) { return node.selected; });
                    }

                    var selectWasPreviouslyEmpty = element.length == 0,
                        multiple = element.multiple,
                        previousScrollTop = (!selectWasPreviouslyEmpty && multiple) ? element.scrollTop : null,
                        unwrappedArray = ko.utils.unwrapObservable(valueAccessor()),
                        valueAllowUnset = allBindings.get('valueAllowUnset') && allBindings['has']('value'),
                        includeDestroyed = allBindings.get('optionsIncludeDestroyed'),
                        arrayToDomNodeChildrenOptions = {},
                        captionValue,
                        filteredArray,
                        previousSelectedValues = [];

                    if (!valueAllowUnset) {
                        if (multiple) {
                            previousSelectedValues = ko.utils.arrayMap(selectedOptions(), ko.selectExtensions.readValue);
                        } else if (element.selectedIndex >= 0) {
                            previousSelectedValues.push(ko.selectExtensions.readValue(element.options[element.selectedIndex]));
                        }
                    }

                    if (unwrappedArray) {
                        if (typeof unwrappedArray.length == "undefined") // Coerce single value into array
                            unwrappedArray = [unwrappedArray];

                        // Filter out any entries marked as destroyed
                        filteredArray = ko.utils.arrayFilter(unwrappedArray, function(item) {
                            return includeDestroyed || item === undefined || item === null || !ko.utils.unwrapObservable(item['_destroy']);
                        });

                        // If caption is included, add it to the array
                        if (allBindings['has']('optionsCaption')) {
                            captionValue = ko.utils.unwrapObservable(allBindings.get('optionsCaption'));
                            // If caption value is null or undefined, don't show a caption
                            if (captionValue !== null && captionValue !== undefined) {
                                filteredArray.unshift(captionPlaceholder);
                            }
                        }
                    } else {
                        // If a falsy value is provided (e.g. null), we'll simply empty the select element
                    }

                    function applyToObject(object, predicate, defaultValue) {
                        var predicateType = typeof predicate;
                        if (predicateType == "function")    // Given a function; run it against the data value
                            return predicate(object);
                        else if (predicateType == "string") // Given a string; treat it as a property name on the data value
                            return object[predicate];
                        else                                // Given no optionsText arg; use the data value itself
                            return defaultValue;
                    }

                    // The following functions can run at two different times:
                    // The first is when the whole array is being updated directly from this binding handler.
                    // The second is when an observable value for a specific array entry is updated.
                    // oldOptions will be empty in the first case, but will be filled with the previously generated option in the second.
                    var itemUpdate = false;
                    function optionForArrayItem(arrayEntry, index, oldOptions) {
                        if (oldOptions.length) {
                            previousSelectedValues = !valueAllowUnset && oldOptions[0].selected ? [ ko.selectExtensions.readValue(oldOptions[0]) ] : [];
                            itemUpdate = true;
                        }
                        var option = element.ownerDocument.createElement("option");
                        if (arrayEntry === captionPlaceholder) {
                            ko.utils.setTextContent(option, allBindings.get('optionsCaption'));
                            ko.selectExtensions.writeValue(option, undefined);
                        } else {
                            // Apply a value to the option element
                            var optionValue = applyToObject(arrayEntry, allBindings.get('optionsValue'), arrayEntry);
                            ko.selectExtensions.writeValue(option, ko.utils.unwrapObservable(optionValue));

                            // Apply some text to the option element
                            var optionText = applyToObject(arrayEntry, allBindings.get('optionsText'), optionValue);
                            ko.utils.setTextContent(option, optionText);
                        }
                        return [option];
                    }

                    // By using a beforeRemove callback, we delay the removal until after new items are added. This fixes a selection
                    // problem in IE<=8 and Firefox. See https://github.com/knockout/knockout/issues/1208
                    arrayToDomNodeChildrenOptions['beforeRemove'] =
                        function (option) {
                            element.removeChild(option);
                        };

                    function setSelectionCallback(arrayEntry, newOptions) {
                        if (itemUpdate && valueAllowUnset) {
                            // The model value is authoritative, so make sure its value is the one selected
                            // There is no need to use dependencyDetection.ignore since setDomNodeChildrenFromArrayMapping does so already.
                            ko.selectExtensions.writeValue(element, ko.utils.unwrapObservable(allBindings.get('value')), true /* allowUnset */);
                        } else if (previousSelectedValues.length) {
                            // IE6 doesn't like us to assign selection to OPTION nodes before they're added to the document.
                            // That's why we first added them without selection. Now it's time to set the selection.
                            var isSelected = ko.utils.arrayIndexOf(previousSelectedValues, ko.selectExtensions.readValue(newOptions[0])) >= 0;
                            ko.utils.setOptionNodeSelectionState(newOptions[0], isSelected);

                            // If this option was changed from being selected during a single-item update, notify the change
                            if (itemUpdate && !isSelected) {
                                ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, "change"]);
                            }
                        }
                    }

                    var callback = setSelectionCallback;
                    if (allBindings['has']('optionsAfterRender') && typeof allBindings.get('optionsAfterRender') == "function") {
                        callback = function(arrayEntry, newOptions) {
                            setSelectionCallback(arrayEntry, newOptions);
                            ko.dependencyDetection.ignore(allBindings.get('optionsAfterRender'), null, [newOptions[0], arrayEntry !== captionPlaceholder ? arrayEntry : undefined]);
                        }
                    }

                    ko.utils.setDomNodeChildrenFromArrayMapping(element, filteredArray, optionForArrayItem, arrayToDomNodeChildrenOptions, callback);

                    ko.dependencyDetection.ignore(function () {
                        if (valueAllowUnset) {
                            // The model value is authoritative, so make sure its value is the one selected
                            ko.selectExtensions.writeValue(element, ko.utils.unwrapObservable(allBindings.get('value')), true /* allowUnset */);
                        } else {
                            // Determine if the selection has changed as a result of updating the options list
                            var selectionChanged;
                            if (multiple) {
                                // For a multiple-select box, compare the new selection count to the previous one
                                // But if nothing was selected before, the selection can't have changed
                                selectionChanged = previousSelectedValues.length && selectedOptions().length < previousSelectedValues.length;
                            } else {
                                // For a single-select box, compare the current value to the previous value
                                // But if nothing was selected before or nothing is selected now, just look for a change in selection
                                selectionChanged = (previousSelectedValues.length && element.selectedIndex >= 0)
                                    ? (ko.selectExtensions.readValue(element.options[element.selectedIndex]) !== previousSelectedValues[0])
                                    : (previousSelectedValues.length || element.selectedIndex >= 0);
                            }

                            // Ensure consistency between model value and selected option.
                            // If the dropdown was changed so that selection is no longer the same,
                            // notify the value or selectedOptions binding.
                            if (selectionChanged) {
                                ko.utils.triggerEvent(element, "change");
                            }
                        }
                    });

                    // Workaround for IE bug
                    ko.utils.ensureSelectElementIsRenderedCorrectly(element);

                    if (previousScrollTop && Math.abs(previousScrollTop - element.scrollTop) > 20)
                        element.scrollTop = previousScrollTop;
                }
            };
            ko.bindingHandlers['options'].optionValueDomDataKey = ko.utils.domData.nextKey();
            ko.bindingHandlers['selectedOptions'] = {
                'after': ['options', 'foreach'],
                'init': function (element, valueAccessor, allBindings) {
                    ko.utils.registerEventHandler(element, "change", function () {
                        var value = valueAccessor(), valueToWrite = [];
                        ko.utils.arrayForEach(element.getElementsByTagName("option"), function(node) {
                            if (node.selected)
                                valueToWrite.push(ko.selectExtensions.readValue(node));
                        });
                        ko.expressionRewriting.writeValueToProperty(value, allBindings, 'selectedOptions', valueToWrite);
                    });
                },
                'update': function (element, valueAccessor) {
                    if (ko.utils.tagNameLower(element) != "select")
                        throw new Error("values binding applies only to SELECT elements");

                    var newValue = ko.utils.unwrapObservable(valueAccessor());
                    if (newValue && typeof newValue.length == "number") {
                        ko.utils.arrayForEach(element.getElementsByTagName("option"), function(node) {
                            var isSelected = ko.utils.arrayIndexOf(newValue, ko.selectExtensions.readValue(node)) >= 0;
                            ko.utils.setOptionNodeSelectionState(node, isSelected);
                        });
                    }
                }
            };
            ko.expressionRewriting.twoWayBindings['selectedOptions'] = true;
            ko.bindingHandlers['style'] = {
                'update': function (element, valueAccessor) {
                    var value = ko.utils.unwrapObservable(valueAccessor() || {});
                    ko.utils.objectForEach(value, function(styleName, styleValue) {
                        styleValue = ko.utils.unwrapObservable(styleValue);

                        if (styleValue === null || styleValue === undefined || styleValue === false) {
                            // Empty string removes the value, whereas null/undefined have no effect
                            styleValue = "";
                        }

                        element.style[styleName] = styleValue;
                    });
                }
            };
            ko.bindingHandlers['submit'] = {
                'init': function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    if (typeof valueAccessor() != "function")
                        throw new Error("The value for a submit binding must be a function");
                    ko.utils.registerEventHandler(element, "submit", function (event) {
                        var handlerReturnValue;
                        var value = valueAccessor();
                        try { handlerReturnValue = value.call(bindingContext['$data'], element); }
                        finally {
                            if (handlerReturnValue !== true) { // Normally we want to prevent default action. Developer can override this be explicitly returning true.
                                if (event.preventDefault)
                                    event.preventDefault();
                                else
                                    event.returnValue = false;
                            }
                        }
                    });
                }
            };
            ko.bindingHandlers['text'] = {
                'init': function() {
                    // Prevent binding on the dynamically-injected text node (as developers are unlikely to expect that, and it has security implications).
                    // It should also make things faster, as we no longer have to consider whether the text node might be bindable.
                    return { 'controlsDescendantBindings': true };
                },
                'update': function (element, valueAccessor) {
                    ko.utils.setTextContent(element, valueAccessor());
                }
            };
            ko.virtualElements.allowedBindings['text'] = true;
            (function () {

                if (window && window.navigator) {
                    var parseVersion = function (matches) {
                        if (matches) {
                            return parseFloat(matches[1]);
                        }
                    };

                    // Detect various browser versions because some old versions don't fully support the 'input' event
                    var operaVersion = window.opera && window.opera.version && parseInt(window.opera.version()),
                        userAgent = window.navigator.userAgent,
                        safariVersion = parseVersion(userAgent.match(/^(?:(?!chrome).)*version\/([^ ]*) safari/i)),
                        firefoxVersion = parseVersion(userAgent.match(/Firefox\/([^ ]*)/));
                }

// IE 8 and 9 have bugs that prevent the normal events from firing when the value changes.
// But it does fire the 'selectionchange' event on many of those, presumably because the
// cursor is moving and that counts as the selection changing. The 'selectionchange' event is
// fired at the document level only and doesn't directly indicate which element changed. We
// set up just one event handler for the document and use 'activeElement' to determine which
// element was changed.
                if (ko.utils.ieVersion < 10) {
                    var selectionChangeRegisteredName = ko.utils.domData.nextKey(),
                        selectionChangeHandlerName = ko.utils.domData.nextKey();
                    var selectionChangeHandler = function(event) {
                        var target = this.activeElement,
                            handler = target && ko.utils.domData.get(target, selectionChangeHandlerName);
                        if (handler) {
                            handler(event);
                        }
                    };
                    var registerForSelectionChangeEvent = function (element, handler) {
                        var ownerDoc = element.ownerDocument;
                        if (!ko.utils.domData.get(ownerDoc, selectionChangeRegisteredName)) {
                            ko.utils.domData.set(ownerDoc, selectionChangeRegisteredName, true);
                            ko.utils.registerEventHandler(ownerDoc, 'selectionchange', selectionChangeHandler);
                        }
                        ko.utils.domData.set(element, selectionChangeHandlerName, handler);
                    };
                }

                ko.bindingHandlers['textInput'] = {
                    'init': function (element, valueAccessor, allBindings) {

                        var previousElementValue = element.value,
                            timeoutHandle,
                            elementValueBeforeEvent;

                        var updateModel = function (event) {
                            clearTimeout(timeoutHandle);
                            elementValueBeforeEvent = timeoutHandle = undefined;

                            var elementValue = element.value;
                            if (previousElementValue !== elementValue) {
                                // Provide a way for tests to know exactly which event was processed
                                if (DEBUG && event) element['_ko_textInputProcessedEvent'] = event.type;
                                previousElementValue = elementValue;
                                ko.expressionRewriting.writeValueToProperty(valueAccessor(), allBindings, 'textInput', elementValue);
                            }
                        };

                        var deferUpdateModel = function (event) {
                            if (!timeoutHandle) {
                                // The elementValueBeforeEvent variable is set *only* during the brief gap between an
                                // event firing and the updateModel function running. This allows us to ignore model
                                // updates that are from the previous state of the element, usually due to techniques
                                // such as rateLimit. Such updates, if not ignored, can cause keystrokes to be lost.
                                elementValueBeforeEvent = element.value;
                                var handler = DEBUG ? updateModel.bind(element, {type: event.type}) : updateModel;
                                timeoutHandle = setTimeout(handler, 4);
                            }
                        };

                        var updateView = function () {
                            var modelValue = ko.utils.unwrapObservable(valueAccessor());

                            if (modelValue === null || modelValue === undefined) {
                                modelValue = '';
                            }

                            if (elementValueBeforeEvent !== undefined && modelValue === elementValueBeforeEvent) {
                                setTimeout(updateView, 4);
                                return;
                            }

                            // Update the element only if the element and model are different. On some browsers, updating the value
                            // will move the cursor to the end of the input, which would be bad while the user is typing.
                            if (element.value !== modelValue) {
                                previousElementValue = modelValue;  // Make sure we ignore events (propertychange) that result from updating the value
                                element.value = modelValue;
                            }
                        };

                        var onEvent = function (event, handler) {
                            ko.utils.registerEventHandler(element, event, handler);
                        };

                        if (DEBUG && ko.bindingHandlers['textInput']['_forceUpdateOn']) {
                            // Provide a way for tests to specify exactly which events are bound
                            ko.utils.arrayForEach(ko.bindingHandlers['textInput']['_forceUpdateOn'], function(eventName) {
                                if (eventName.slice(0,5) == 'after') {
                                    onEvent(eventName.slice(5), deferUpdateModel);
                                } else {
                                    onEvent(eventName, updateModel);
                                }
                            });
                        } else {
                            if (ko.utils.ieVersion < 10) {
                                // Internet Explorer <= 8 doesn't support the 'input' event, but does include 'propertychange' that fires whenever
                                // any property of an element changes. Unlike 'input', it also fires if a property is changed from JavaScript code,
                                // but that's an acceptable compromise for this binding. IE 9 does support 'input', but since it doesn't fire it
                                // when using autocomplete, we'll use 'propertychange' for it also.
                                onEvent('propertychange', function(event) {
                                    if (event.propertyName === 'value') {
                                        updateModel(event);
                                    }
                                });

                                if (ko.utils.ieVersion == 8) {
                                    // IE 8 has a bug where it fails to fire 'propertychange' on the first update following a value change from
                                    // JavaScript code. It also doesn't fire if you clear the entire value. To fix this, we bind to the following
                                    // events too.
                                    onEvent('keyup', updateModel);      // A single keystoke
                                    onEvent('keydown', updateModel);    // The first character when a key is held down
                                }
                                if (ko.utils.ieVersion >= 8) {
                                    // Internet Explorer 9 doesn't fire the 'input' event when deleting text, including using
                                    // the backspace, delete, or ctrl-x keys, clicking the 'x' to clear the input, dragging text
                                    // out of the field, and cutting or deleting text using the context menu. 'selectionchange'
                                    // can detect all of those except dragging text out of the field, for which we use 'dragend'.
                                    // These are also needed in IE8 because of the bug described above.
                                    registerForSelectionChangeEvent(element, updateModel);  // 'selectionchange' covers cut, paste, drop, delete, etc.
                                    onEvent('dragend', deferUpdateModel);
                                }
                            } else {
                                // All other supported browsers support the 'input' event, which fires whenever the content of the element is changed
                                // through the user interface.
                                onEvent('input', updateModel);

                                if (safariVersion < 5 && ko.utils.tagNameLower(element) === "textarea") {
                                    // Safari <5 doesn't fire the 'input' event for <textarea> elements (it does fire 'textInput'
                                    // but only when typing). So we'll just catch as much as we can with keydown, cut, and paste.
                                    onEvent('keydown', deferUpdateModel);
                                    onEvent('paste', deferUpdateModel);
                                    onEvent('cut', deferUpdateModel);
                                } else if (operaVersion < 11) {
                                    // Opera 10 doesn't always fire the 'input' event for cut, paste, undo & drop operations.
                                    // We can try to catch some of those using 'keydown'.
                                    onEvent('keydown', deferUpdateModel);
                                } else if (firefoxVersion < 4.0) {
                                    // Firefox <= 3.6 doesn't fire the 'input' event when text is filled in through autocomplete
                                    onEvent('DOMAutoComplete', updateModel);

                                    // Firefox <=3.5 doesn't fire the 'input' event when text is dropped into the input.
                                    onEvent('dragdrop', updateModel);       // <3.5
                                    onEvent('drop', updateModel);           // 3.5
                                }
                            }
                        }

                        // Bind to the change event so that we can catch programmatic updates of the value that fire this event.
                        onEvent('change', updateModel);

                        ko.computed(updateView, null, { disposeWhenNodeIsRemoved: element });
                    }
                };
                ko.expressionRewriting.twoWayBindings['textInput'] = true;

// textinput is an alias for textInput
                ko.bindingHandlers['textinput'] = {
                    // preprocess is the only way to set up a full alias
                    'preprocess': function (value, name, addBinding) {
                        addBinding('textInput', value);
                    }
                };

            })();ko.bindingHandlers['uniqueName'] = {
                'init': function (element, valueAccessor) {
                    if (valueAccessor()) {
                        var name = "ko_unique_" + (++ko.bindingHandlers['uniqueName'].currentIndex);
                        ko.utils.setElementName(element, name);
                    }
                }
            };
            ko.bindingHandlers['uniqueName'].currentIndex = 0;
            ko.bindingHandlers['value'] = {
                'after': ['options', 'foreach'],
                'init': function (element, valueAccessor, allBindings) {
                    // If the value binding is placed on a radio/checkbox, then just pass through to checkedValue and quit
                    if (element.tagName.toLowerCase() == "input" && (element.type == "checkbox" || element.type == "radio")) {
                        ko.applyBindingAccessorsToNode(element, { 'checkedValue': valueAccessor });
                        return;
                    }

                    // Always catch "change" event; possibly other events too if asked
                    var eventsToCatch = ["change"];
                    var requestedEventsToCatch = allBindings.get("valueUpdate");
                    var propertyChangedFired = false;
                    var elementValueBeforeEvent = null;

                    if (requestedEventsToCatch) {
                        if (typeof requestedEventsToCatch == "string") // Allow both individual event names, and arrays of event names
                            requestedEventsToCatch = [requestedEventsToCatch];
                        ko.utils.arrayPushAll(eventsToCatch, requestedEventsToCatch);
                        eventsToCatch = ko.utils.arrayGetDistinctValues(eventsToCatch);
                    }

                    var valueUpdateHandler = function() {
                        elementValueBeforeEvent = null;
                        propertyChangedFired = false;
                        var modelValue = valueAccessor();
                        var elementValue = ko.selectExtensions.readValue(element);
                        ko.expressionRewriting.writeValueToProperty(modelValue, allBindings, 'value', elementValue);
                    }

                    // Workaround for https://github.com/SteveSanderson/knockout/issues/122
                    // IE doesn't fire "change" events on textboxes if the user selects a value from its autocomplete list
                    var ieAutoCompleteHackNeeded = ko.utils.ieVersion && element.tagName.toLowerCase() == "input" && element.type == "text"
                        && element.autocomplete != "off" && (!element.form || element.form.autocomplete != "off");
                    if (ieAutoCompleteHackNeeded && ko.utils.arrayIndexOf(eventsToCatch, "propertychange") == -1) {
                        ko.utils.registerEventHandler(element, "propertychange", function () { propertyChangedFired = true });
                        ko.utils.registerEventHandler(element, "focus", function () { propertyChangedFired = false });
                        ko.utils.registerEventHandler(element, "blur", function() {
                            if (propertyChangedFired) {
                                valueUpdateHandler();
                            }
                        });
                    }

                    ko.utils.arrayForEach(eventsToCatch, function(eventName) {
                        // The syntax "after<eventname>" means "run the handler asynchronously after the event"
                        // This is useful, for example, to catch "keydown" events after the browser has updated the control
                        // (otherwise, ko.selectExtensions.readValue(this) will receive the control's value *before* the key event)
                        var handler = valueUpdateHandler;
                        if (ko.utils.stringStartsWith(eventName, "after")) {
                            handler = function() {
                                // The elementValueBeforeEvent variable is non-null *only* during the brief gap between
                                // a keyX event firing and the valueUpdateHandler running, which is scheduled to happen
                                // at the earliest asynchronous opportunity. We store this temporary information so that
                                // if, between keyX and valueUpdateHandler, the underlying model value changes separately,
                                // we can overwrite that model value change with the value the user just typed. Otherwise,
                                // techniques like rateLimit can trigger model changes at critical moments that will
                                // override the user's inputs, causing keystrokes to be lost.
                                elementValueBeforeEvent = ko.selectExtensions.readValue(element);
                                setTimeout(valueUpdateHandler, 0);
                            };
                            eventName = eventName.substring("after".length);
                        }
                        ko.utils.registerEventHandler(element, eventName, handler);
                    });

                    var updateFromModel = function () {
                        var newValue = ko.utils.unwrapObservable(valueAccessor());
                        var elementValue = ko.selectExtensions.readValue(element);

                        if (elementValueBeforeEvent !== null && newValue === elementValueBeforeEvent) {
                            setTimeout(updateFromModel, 0);
                            return;
                        }

                        var valueHasChanged = (newValue !== elementValue);

                        if (valueHasChanged) {
                            if (ko.utils.tagNameLower(element) === "select") {
                                var allowUnset = allBindings.get('valueAllowUnset');
                                var applyValueAction = function () {
                                    ko.selectExtensions.writeValue(element, newValue, allowUnset);
                                };
                                applyValueAction();

                                if (!allowUnset && newValue !== ko.selectExtensions.readValue(element)) {
                                    // If you try to set a model value that can't be represented in an already-populated dropdown, reject that change,
                                    // because you're not allowed to have a model value that disagrees with a visible UI selection.
                                    ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, "change"]);
                                } else {
                                    // Workaround for IE6 bug: It won't reliably apply values to SELECT nodes during the same execution thread
                                    // right after you've changed the set of OPTION nodes on it. So for that node type, we'll schedule a second thread
                                    // to apply the value as well.
                                    setTimeout(applyValueAction, 0);
                                }
                            } else {
                                ko.selectExtensions.writeValue(element, newValue);
                            }
                        }
                    };

                    ko.computed(updateFromModel, null, { disposeWhenNodeIsRemoved: element });
                },
                'update': function() {} // Keep for backwards compatibility with code that may have wrapped value binding
            };
            ko.expressionRewriting.twoWayBindings['value'] = true;
            ko.bindingHandlers['visible'] = {
                'update': function (element, valueAccessor) {
                    var value = ko.utils.unwrapObservable(valueAccessor());
                    var isCurrentlyVisible = !(element.style.display == "none");
                    if (value && !isCurrentlyVisible)
                        element.style.display = "";
                    else if ((!value) && isCurrentlyVisible)
                        element.style.display = "none";
                }
            };
// 'click' is just a shorthand for the usual full-length event:{click:handler}
            makeEventHandlerShortcut('click');
// If you want to make a custom template engine,
//
// [1] Inherit from this class (like ko.nativeTemplateEngine does)
// [2] Override 'renderTemplateSource', supplying a function with this signature:
//
//        function (templateSource, bindingContext, options) {
//            // - templateSource.text() is the text of the template you should render
//            // - bindingContext.$data is the data you should pass into the template
//            //   - you might also want to make bindingContext.$parent, bindingContext.$parents,
//            //     and bindingContext.$root available in the template too
//            // - options gives you access to any other properties set on "data-bind: { template: options }"
//            // - templateDocument is the document object of the template
//            //
//            // Return value: an array of DOM nodes
//        }
//
// [3] Override 'createJavaScriptEvaluatorBlock', supplying a function with this signature:
//
//        function (script) {
//            // Return value: Whatever syntax means "Evaluate the JavaScript statement 'script' and output the result"
//            //               For example, the jquery.tmpl template engine converts 'someScript' to '${ someScript }'
//        }
//
//     This is only necessary if you want to allow data-bind attributes to reference arbitrary template variables.
//     If you don't want to allow that, you can set the property 'allowTemplateRewriting' to false (like ko.nativeTemplateEngine does)
//     and then you don't need to override 'createJavaScriptEvaluatorBlock'.

            ko.templateEngine = function () { };

            ko.templateEngine.prototype['renderTemplateSource'] = function (templateSource, bindingContext, options, templateDocument) {
                throw new Error("Override renderTemplateSource");
            };

            ko.templateEngine.prototype['createJavaScriptEvaluatorBlock'] = function (script) {
                throw new Error("Override createJavaScriptEvaluatorBlock");
            };

            ko.templateEngine.prototype['makeTemplateSource'] = function(template, templateDocument) {
                // Named template
                if (typeof template == "string") {
                    templateDocument = templateDocument || document;
                    var elem = templateDocument.getElementById(template);
                    if (!elem)
                        throw new Error("Cannot find template with ID " + template);
                    return new ko.templateSources.domElement(elem);
                } else if ((template.nodeType == 1) || (template.nodeType == 8)) {
                    // Anonymous template
                    return new ko.templateSources.anonymousTemplate(template);
                } else
                    throw new Error("Unknown template type: " + template);
            };

            ko.templateEngine.prototype['renderTemplate'] = function (template, bindingContext, options, templateDocument) {
                var templateSource = this['makeTemplateSource'](template, templateDocument);
                return this['renderTemplateSource'](templateSource, bindingContext, options, templateDocument);
            };

            ko.templateEngine.prototype['isTemplateRewritten'] = function (template, templateDocument) {
                // Skip rewriting if requested
                if (this['allowTemplateRewriting'] === false)
                    return true;
                return this['makeTemplateSource'](template, templateDocument)['data']("isRewritten");
            };

            ko.templateEngine.prototype['rewriteTemplate'] = function (template, rewriterCallback, templateDocument) {
                var templateSource = this['makeTemplateSource'](template, templateDocument);
                var rewritten = rewriterCallback(templateSource['text']());
                templateSource['text'](rewritten);
                templateSource['data']("isRewritten", true);
            };

            ko.exportSymbol('templateEngine', ko.templateEngine);

            ko.templateRewriting = (function () {
                var memoizeDataBindingAttributeSyntaxRegex = /(<([a-z]+\d*)(?:\s+(?!data-bind\s*=\s*)[a-z0-9\-]+(?:=(?:\"[^\"]*\"|\'[^\']*\'|[^>]*))?)*\s+)data-bind\s*=\s*(["'])([\s\S]*?)\3/gi;
                var memoizeVirtualContainerBindingSyntaxRegex = /<!--\s*ko\b\s*([\s\S]*?)\s*-->/g;

                function validateDataBindValuesForRewriting(keyValueArray) {
                    var allValidators = ko.expressionRewriting.bindingRewriteValidators;
                    for (var i = 0; i < keyValueArray.length; i++) {
                        var key = keyValueArray[i]['key'];
                        if (allValidators.hasOwnProperty(key)) {
                            var validator = allValidators[key];

                            if (typeof validator === "function") {
                                var possibleErrorMessage = validator(keyValueArray[i]['value']);
                                if (possibleErrorMessage)
                                    throw new Error(possibleErrorMessage);
                            } else if (!validator) {
                                throw new Error("This template engine does not support the '" + key + "' binding within its templates");
                            }
                        }
                    }
                }

                function constructMemoizedTagReplacement(dataBindAttributeValue, tagToRetain, nodeName, templateEngine) {
                    var dataBindKeyValueArray = ko.expressionRewriting.parseObjectLiteral(dataBindAttributeValue);
                    validateDataBindValuesForRewriting(dataBindKeyValueArray);
                    var rewrittenDataBindAttributeValue = ko.expressionRewriting.preProcessBindings(dataBindKeyValueArray, {'valueAccessors':true});

                    // For no obvious reason, Opera fails to evaluate rewrittenDataBindAttributeValue unless it's wrapped in an additional
                    // anonymous function, even though Opera's built-in debugger can evaluate it anyway. No other browser requires this
                    // extra indirection.
                    var applyBindingsToNextSiblingScript =
                        "ko.__tr_ambtns(function($context,$element){return(function(){return{ " + rewrittenDataBindAttributeValue + " } })()},'" + nodeName.toLowerCase() + "')";
                    return templateEngine['createJavaScriptEvaluatorBlock'](applyBindingsToNextSiblingScript) + tagToRetain;
                }

                return {
                    ensureTemplateIsRewritten: function (template, templateEngine, templateDocument) {
                        if (!templateEngine['isTemplateRewritten'](template, templateDocument))
                            templateEngine['rewriteTemplate'](template, function (htmlString) {
                                return ko.templateRewriting.memoizeBindingAttributeSyntax(htmlString, templateEngine);
                            }, templateDocument);
                    },

                    memoizeBindingAttributeSyntax: function (htmlString, templateEngine) {
                        return htmlString.replace(memoizeDataBindingAttributeSyntaxRegex, function () {
                            return constructMemoizedTagReplacement(/* dataBindAttributeValue: */ arguments[4], /* tagToRetain: */ arguments[1], /* nodeName: */ arguments[2], templateEngine);
                        }).replace(memoizeVirtualContainerBindingSyntaxRegex, function() {
                            return constructMemoizedTagReplacement(/* dataBindAttributeValue: */ arguments[1], /* tagToRetain: */ "<!-- ko -->", /* nodeName: */ "#comment", templateEngine);
                        });
                    },

                    applyMemoizedBindingsToNextSibling: function (bindings, nodeName) {
                        return ko.memoization.memoize(function (domNode, bindingContext) {
                            var nodeToBind = domNode.nextSibling;
                            if (nodeToBind && nodeToBind.nodeName.toLowerCase() === nodeName) {
                                ko.applyBindingAccessorsToNode(nodeToBind, bindings, bindingContext);
                            }
                        });
                    }
                }
            })();


// Exported only because it has to be referenced by string lookup from within rewritten template
            ko.exportSymbol('__tr_ambtns', ko.templateRewriting.applyMemoizedBindingsToNextSibling);
            (function() {
                // A template source represents a read/write way of accessing a template. This is to eliminate the need for template loading/saving
                // logic to be duplicated in every template engine (and means they can all work with anonymous templates, etc.)
                //
                // Two are provided by default:
                //  1. ko.templateSources.domElement       - reads/writes the text content of an arbitrary DOM element
                //  2. ko.templateSources.anonymousElement - uses ko.utils.domData to read/write text *associated* with the DOM element, but
                //                                           without reading/writing the actual element text content, since it will be overwritten
                //                                           with the rendered template output.
                // You can implement your own template source if you want to fetch/store templates somewhere other than in DOM elements.
                // Template sources need to have the following functions:
                //   text() 			- returns the template text from your storage location
                //   text(value)		- writes the supplied template text to your storage location
                //   data(key)			- reads values stored using data(key, value) - see below
                //   data(key, value)	- associates "value" with this template and the key "key". Is used to store information like "isRewritten".
                //
                // Optionally, template sources can also have the following functions:
                //   nodes()            - returns a DOM element containing the nodes of this template, where available
                //   nodes(value)       - writes the given DOM element to your storage location
                // If a DOM element is available for a given template source, template engines are encouraged to use it in preference over text()
                // for improved speed. However, all templateSources must supply text() even if they don't supply nodes().
                //
                // Once you've implemented a templateSource, make your template engine use it by subclassing whatever template engine you were
                // using and overriding "makeTemplateSource" to return an instance of your custom template source.

                ko.templateSources = {};

                // ---- ko.templateSources.domElement -----

                ko.templateSources.domElement = function(element) {
                    this.domElement = element;
                }

                ko.templateSources.domElement.prototype['text'] = function(/* valueToWrite */) {
                    var tagNameLower = ko.utils.tagNameLower(this.domElement),
                        elemContentsProperty = tagNameLower === "script" ? "text"
                            : tagNameLower === "textarea" ? "value"
                            : "innerHTML";

                    if (arguments.length == 0) {
                        return this.domElement[elemContentsProperty];
                    } else {
                        var valueToWrite = arguments[0];
                        if (elemContentsProperty === "innerHTML")
                            ko.utils.setHtml(this.domElement, valueToWrite);
                        else
                            this.domElement[elemContentsProperty] = valueToWrite;
                    }
                };

                var dataDomDataPrefix = ko.utils.domData.nextKey() + "_";
                ko.templateSources.domElement.prototype['data'] = function(key /*, valueToWrite */) {
                    if (arguments.length === 1) {
                        return ko.utils.domData.get(this.domElement, dataDomDataPrefix + key);
                    } else {
                        ko.utils.domData.set(this.domElement, dataDomDataPrefix + key, arguments[1]);
                    }
                };

                // ---- ko.templateSources.anonymousTemplate -----
                // Anonymous templates are normally saved/retrieved as DOM nodes through "nodes".
                // For compatibility, you can also read "text"; it will be serialized from the nodes on demand.
                // Writing to "text" is still supported, but then the template data will not be available as DOM nodes.

                var anonymousTemplatesDomDataKey = ko.utils.domData.nextKey();
                ko.templateSources.anonymousTemplate = function(element) {
                    this.domElement = element;
                }
                ko.templateSources.anonymousTemplate.prototype = new ko.templateSources.domElement();
                ko.templateSources.anonymousTemplate.prototype.constructor = ko.templateSources.anonymousTemplate;
                ko.templateSources.anonymousTemplate.prototype['text'] = function(/* valueToWrite */) {
                    if (arguments.length == 0) {
                        var templateData = ko.utils.domData.get(this.domElement, anonymousTemplatesDomDataKey) || {};
                        if (templateData.textData === undefined && templateData.containerData)
                            templateData.textData = templateData.containerData.innerHTML;
                        return templateData.textData;
                    } else {
                        var valueToWrite = arguments[0];
                        ko.utils.domData.set(this.domElement, anonymousTemplatesDomDataKey, {textData: valueToWrite});
                    }
                };
                ko.templateSources.domElement.prototype['nodes'] = function(/* valueToWrite */) {
                    if (arguments.length == 0) {
                        var templateData = ko.utils.domData.get(this.domElement, anonymousTemplatesDomDataKey) || {};
                        return templateData.containerData;
                    } else {
                        var valueToWrite = arguments[0];
                        ko.utils.domData.set(this.domElement, anonymousTemplatesDomDataKey, {containerData: valueToWrite});
                    }
                };

                ko.exportSymbol('templateSources', ko.templateSources);
                ko.exportSymbol('templateSources.domElement', ko.templateSources.domElement);
                ko.exportSymbol('templateSources.anonymousTemplate', ko.templateSources.anonymousTemplate);
            })();
            (function () {
                var _templateEngine;
                ko.setTemplateEngine = function (templateEngine) {
                    if ((templateEngine != undefined) && !(templateEngine instanceof ko.templateEngine))
                        throw new Error("templateEngine must inherit from ko.templateEngine");
                    _templateEngine = templateEngine;
                }

                function invokeForEachNodeInContinuousRange(firstNode, lastNode, action) {
                    var node, nextInQueue = firstNode, firstOutOfRangeNode = ko.virtualElements.nextSibling(lastNode);
                    while (nextInQueue && ((node = nextInQueue) !== firstOutOfRangeNode)) {
                        nextInQueue = ko.virtualElements.nextSibling(node);
                        action(node, nextInQueue);
                    }
                }

                function activateBindingsOnContinuousNodeArray(continuousNodeArray, bindingContext) {
                    // To be used on any nodes that have been rendered by a template and have been inserted into some parent element
                    // Walks through continuousNodeArray (which *must* be continuous, i.e., an uninterrupted sequence of sibling nodes, because
                    // the algorithm for walking them relies on this), and for each top-level item in the virtual-element sense,
                    // (1) Does a regular "applyBindings" to associate bindingContext with this node and to activate any non-memoized bindings
                    // (2) Unmemoizes any memos in the DOM subtree (e.g., to activate bindings that had been memoized during template rewriting)

                    if (continuousNodeArray.length) {
                        var firstNode = continuousNodeArray[0],
                            lastNode = continuousNodeArray[continuousNodeArray.length - 1],
                            parentNode = firstNode.parentNode,
                            provider = ko.bindingProvider['instance'],
                            preprocessNode = provider['preprocessNode'];

                        if (preprocessNode) {
                            invokeForEachNodeInContinuousRange(firstNode, lastNode, function(node, nextNodeInRange) {
                                var nodePreviousSibling = node.previousSibling;
                                var newNodes = preprocessNode.call(provider, node);
                                if (newNodes) {
                                    if (node === firstNode)
                                        firstNode = newNodes[0] || nextNodeInRange;
                                    if (node === lastNode)
                                        lastNode = newNodes[newNodes.length - 1] || nodePreviousSibling;
                                }
                            });

                            // Because preprocessNode can change the nodes, including the first and last nodes, update continuousNodeArray to match.
                            // We need the full set, including inner nodes, because the unmemoize step might remove the first node (and so the real
                            // first node needs to be in the array).
                            continuousNodeArray.length = 0;
                            if (!firstNode) { // preprocessNode might have removed all the nodes, in which case there's nothing left to do
                                return;
                            }
                            if (firstNode === lastNode) {
                                continuousNodeArray.push(firstNode);
                            } else {
                                continuousNodeArray.push(firstNode, lastNode);
                                ko.utils.fixUpContinuousNodeArray(continuousNodeArray, parentNode);
                            }
                        }

                        // Need to applyBindings *before* unmemoziation, because unmemoization might introduce extra nodes (that we don't want to re-bind)
                        // whereas a regular applyBindings won't introduce new memoized nodes
                        invokeForEachNodeInContinuousRange(firstNode, lastNode, function(node) {
                            if (node.nodeType === 1 || node.nodeType === 8)
                                ko.applyBindings(bindingContext, node);
                        });
                        invokeForEachNodeInContinuousRange(firstNode, lastNode, function(node) {
                            if (node.nodeType === 1 || node.nodeType === 8)
                                ko.memoization.unmemoizeDomNodeAndDescendants(node, [bindingContext]);
                        });

                        // Make sure any changes done by applyBindings or unmemoize are reflected in the array
                        ko.utils.fixUpContinuousNodeArray(continuousNodeArray, parentNode);
                    }
                }

                function getFirstNodeFromPossibleArray(nodeOrNodeArray) {
                    return nodeOrNodeArray.nodeType ? nodeOrNodeArray
                        : nodeOrNodeArray.length > 0 ? nodeOrNodeArray[0]
                        : null;
                }

                function executeTemplate(targetNodeOrNodeArray, renderMode, template, bindingContext, options) {
                    options = options || {};
                    var firstTargetNode = targetNodeOrNodeArray && getFirstNodeFromPossibleArray(targetNodeOrNodeArray);
                    var templateDocument = (firstTargetNode || template || {}).ownerDocument;
                    var templateEngineToUse = (options['templateEngine'] || _templateEngine);
                    ko.templateRewriting.ensureTemplateIsRewritten(template, templateEngineToUse, templateDocument);
                    var renderedNodesArray = templateEngineToUse['renderTemplate'](template, bindingContext, options, templateDocument);

                    // Loosely check result is an array of DOM nodes
                    if ((typeof renderedNodesArray.length != "number") || (renderedNodesArray.length > 0 && typeof renderedNodesArray[0].nodeType != "number"))
                        throw new Error("Template engine must return an array of DOM nodes");

                    var haveAddedNodesToParent = false;
                    switch (renderMode) {
                        case "replaceChildren":
                            ko.virtualElements.setDomNodeChildren(targetNodeOrNodeArray, renderedNodesArray);
                            haveAddedNodesToParent = true;
                            break;
                        case "replaceNode":
                            ko.utils.replaceDomNodes(targetNodeOrNodeArray, renderedNodesArray);
                            haveAddedNodesToParent = true;
                            break;
                        case "ignoreTargetNode": break;
                        default:
                            throw new Error("Unknown renderMode: " + renderMode);
                    }

                    if (haveAddedNodesToParent) {
                        activateBindingsOnContinuousNodeArray(renderedNodesArray, bindingContext);
                        if (options['afterRender'])
                            ko.dependencyDetection.ignore(options['afterRender'], null, [renderedNodesArray, bindingContext['$data']]);
                    }

                    return renderedNodesArray;
                }

                function resolveTemplateName(template, data, context) {
                    // The template can be specified as:
                    if (ko.isObservable(template)) {
                        // 1. An observable, with string value
                        return template();
                    } else if (typeof template === 'function') {
                        // 2. A function of (data, context) returning a string
                        return template(data, context);
                    } else {
                        // 3. A string
                        return template;
                    }
                }

                ko.renderTemplate = function (template, dataOrBindingContext, options, targetNodeOrNodeArray, renderMode) {
                    options = options || {};
                    if ((options['templateEngine'] || _templateEngine) == undefined)
                        throw new Error("Set a template engine before calling renderTemplate");
                    renderMode = renderMode || "replaceChildren";

                    if (targetNodeOrNodeArray) {
                        var firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray);

                        var whenToDispose = function () { return (!firstTargetNode) || !ko.utils.domNodeIsAttachedToDocument(firstTargetNode); }; // Passive disposal (on next evaluation)
                        var activelyDisposeWhenNodeIsRemoved = (firstTargetNode && renderMode == "replaceNode") ? firstTargetNode.parentNode : firstTargetNode;

                        return ko.dependentObservable( // So the DOM is automatically updated when any dependency changes
                            function () {
                                // Ensure we've got a proper binding context to work with
                                var bindingContext = (dataOrBindingContext && (dataOrBindingContext instanceof ko.bindingContext))
                                    ? dataOrBindingContext
                                    : new ko.bindingContext(ko.utils.unwrapObservable(dataOrBindingContext));

                                var templateName = resolveTemplateName(template, bindingContext['$data'], bindingContext),
                                    renderedNodesArray = executeTemplate(targetNodeOrNodeArray, renderMode, templateName, bindingContext, options);

                                if (renderMode == "replaceNode") {
                                    targetNodeOrNodeArray = renderedNodesArray;
                                    firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray);
                                }
                            },
                            null,
                            { disposeWhen: whenToDispose, disposeWhenNodeIsRemoved: activelyDisposeWhenNodeIsRemoved }
                        );
                    } else {
                        // We don't yet have a DOM node to evaluate, so use a memo and render the template later when there is a DOM node
                        return ko.memoization.memoize(function (domNode) {
                            ko.renderTemplate(template, dataOrBindingContext, options, domNode, "replaceNode");
                        });
                    }
                };

                ko.renderTemplateForEach = function (template, arrayOrObservableArray, options, targetNode, parentBindingContext) {
                    // Since setDomNodeChildrenFromArrayMapping always calls executeTemplateForArrayItem and then
                    // activateBindingsCallback for added items, we can store the binding context in the former to use in the latter.
                    var arrayItemContext;

                    // This will be called by setDomNodeChildrenFromArrayMapping to get the nodes to add to targetNode
                    var executeTemplateForArrayItem = function (arrayValue, index) {
                        // Support selecting template as a function of the data being rendered
                        arrayItemContext = parentBindingContext['createChildContext'](arrayValue, options['as'], function(context) {
                            context['$index'] = index;
                        });

                        var templateName = resolveTemplateName(template, arrayValue, arrayItemContext);
                        return executeTemplate(null, "ignoreTargetNode", templateName, arrayItemContext, options);
                    }

                    // This will be called whenever setDomNodeChildrenFromArrayMapping has added nodes to targetNode
                    var activateBindingsCallback = function(arrayValue, addedNodesArray, index) {
                        activateBindingsOnContinuousNodeArray(addedNodesArray, arrayItemContext);
                        if (options['afterRender'])
                            options['afterRender'](addedNodesArray, arrayValue);

                        // release the "cache" variable, so that it can be collected by
                        // the GC when its value isn't used from within the bindings anymore.
                        arrayItemContext = null;
                    };

                    return ko.dependentObservable(function () {
                        var unwrappedArray = ko.utils.unwrapObservable(arrayOrObservableArray) || [];
                        if (typeof unwrappedArray.length == "undefined") // Coerce single value into array
                            unwrappedArray = [unwrappedArray];

                        // Filter out any entries marked as destroyed
                        var filteredArray = ko.utils.arrayFilter(unwrappedArray, function(item) {
                            return options['includeDestroyed'] || item === undefined || item === null || !ko.utils.unwrapObservable(item['_destroy']);
                        });

                        // Call setDomNodeChildrenFromArrayMapping, ignoring any observables unwrapped within (most likely from a callback function).
                        // If the array items are observables, though, they will be unwrapped in executeTemplateForArrayItem and managed within setDomNodeChildrenFromArrayMapping.
                        ko.dependencyDetection.ignore(ko.utils.setDomNodeChildrenFromArrayMapping, null, [targetNode, filteredArray, executeTemplateForArrayItem, options, activateBindingsCallback]);

                    }, null, { disposeWhenNodeIsRemoved: targetNode });
                };

                var templateComputedDomDataKey = ko.utils.domData.nextKey();
                function disposeOldComputedAndStoreNewOne(element, newComputed) {
                    var oldComputed = ko.utils.domData.get(element, templateComputedDomDataKey);
                    if (oldComputed && (typeof(oldComputed.dispose) == 'function'))
                        oldComputed.dispose();
                    ko.utils.domData.set(element, templateComputedDomDataKey, (newComputed && newComputed.isActive()) ? newComputed : undefined);
                }

                ko.bindingHandlers['template'] = {
                    'init': function(element, valueAccessor) {
                        // Support anonymous templates
                        var bindingValue = ko.utils.unwrapObservable(valueAccessor());
                        if (typeof bindingValue == "string" || bindingValue['name']) {
                            // It's a named template - clear the element
                            ko.virtualElements.emptyNode(element);
                        } else if ('nodes' in bindingValue) {
                            // We've been given an array of DOM nodes. Save them as the template source.
                            // There is no known use case for the node array being an observable array (if the output
                            // varies, put that behavior *into* your template - that's what templates are for), and
                            // the implementation would be a mess, so assert that it's not observable.
                            var nodes = bindingValue['nodes'] || [];
                            if (ko.isObservable(nodes)) {
                                throw new Error('The "nodes" option must be a plain, non-observable array.');
                            }
                            var container = ko.utils.moveCleanedNodesToContainerElement(nodes); // This also removes the nodes from their current parent
                            new ko.templateSources.anonymousTemplate(element)['nodes'](container);
                        } else {
                            // It's an anonymous template - store the element contents, then clear the element
                            var templateNodes = ko.virtualElements.childNodes(element),
                                container = ko.utils.moveCleanedNodesToContainerElement(templateNodes); // This also removes the nodes from their current parent
                            new ko.templateSources.anonymousTemplate(element)['nodes'](container);
                        }
                        return { 'controlsDescendantBindings': true };
                    },
                    'update': function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                        var value = valueAccessor(),
                            dataValue,
                            options = ko.utils.unwrapObservable(value),
                            shouldDisplay = true,
                            templateComputed = null,
                            templateName;

                        if (typeof options == "string") {
                            templateName = value;
                            options = {};
                        } else {
                            templateName = options['name'];

                            // Support "if"/"ifnot" conditions
                            if ('if' in options)
                                shouldDisplay = ko.utils.unwrapObservable(options['if']);
                            if (shouldDisplay && 'ifnot' in options)
                                shouldDisplay = !ko.utils.unwrapObservable(options['ifnot']);

                            dataValue = ko.utils.unwrapObservable(options['data']);
                        }

                        if ('foreach' in options) {
                            // Render once for each data point (treating data set as empty if shouldDisplay==false)
                            var dataArray = (shouldDisplay && options['foreach']) || [];
                            templateComputed = ko.renderTemplateForEach(templateName || element, dataArray, options, element, bindingContext);
                        } else if (!shouldDisplay) {
                            ko.virtualElements.emptyNode(element);
                        } else {
                            // Render once for this single data point (or use the viewModel if no data was provided)
                            var innerBindingContext = ('data' in options) ?
                                bindingContext['createChildContext'](dataValue, options['as']) :  // Given an explitit 'data' value, we create a child binding context for it
                                bindingContext;                                                        // Given no explicit 'data' value, we retain the same binding context
                            templateComputed = ko.renderTemplate(templateName || element, innerBindingContext, options, element);
                        }

                        // It only makes sense to have a single template computed per element (otherwise which one should have its output displayed?)
                        disposeOldComputedAndStoreNewOne(element, templateComputed);
                    }
                };

                // Anonymous templates can't be rewritten. Give a nice error message if you try to do it.
                ko.expressionRewriting.bindingRewriteValidators['template'] = function(bindingValue) {
                    var parsedBindingValue = ko.expressionRewriting.parseObjectLiteral(bindingValue);

                    if ((parsedBindingValue.length == 1) && parsedBindingValue[0]['unknown'])
                        return null; // It looks like a string literal, not an object literal, so treat it as a named template (which is allowed for rewriting)

                    if (ko.expressionRewriting.keyValueArrayContainsKey(parsedBindingValue, "name"))
                        return null; // Named templates can be rewritten, so return "no error"
                    return "This template engine does not support anonymous templates nested within its templates";
                };

                ko.virtualElements.allowedBindings['template'] = true;
            })();

            ko.exportSymbol('setTemplateEngine', ko.setTemplateEngine);
            ko.exportSymbol('renderTemplate', ko.renderTemplate);
// Go through the items that have been added and deleted and try to find matches between them.
            ko.utils.findMovesInArrayComparison = function (left, right, limitFailedCompares) {
                if (left.length && right.length) {
                    var failedCompares, l, r, leftItem, rightItem;
                    for (failedCompares = l = 0; (!limitFailedCompares || failedCompares < limitFailedCompares) && (leftItem = left[l]); ++l) {
                        for (r = 0; rightItem = right[r]; ++r) {
                            if (leftItem['value'] === rightItem['value']) {
                                leftItem['moved'] = rightItem['index'];
                                rightItem['moved'] = leftItem['index'];
                                right.splice(r, 1);         // This item is marked as moved; so remove it from right list
                                failedCompares = r = 0;     // Reset failed compares count because we're checking for consecutive failures
                                break;
                            }
                        }
                        failedCompares += r;
                    }
                }
            };

            ko.utils.compareArrays = (function () {
                var statusNotInOld = 'added', statusNotInNew = 'deleted';

                // Simple calculation based on Levenshtein distance.
                function compareArrays(oldArray, newArray, options) {
                    // For backward compatibility, if the third arg is actually a bool, interpret
                    // it as the old parameter 'dontLimitMoves'. Newer code should use { dontLimitMoves: true }.
                    options = (typeof options === 'boolean') ? { 'dontLimitMoves': options } : (options || {});
                    oldArray = oldArray || [];
                    newArray = newArray || [];

                    if (oldArray.length <= newArray.length)
                        return compareSmallArrayToBigArray(oldArray, newArray, statusNotInOld, statusNotInNew, options);
                    else
                        return compareSmallArrayToBigArray(newArray, oldArray, statusNotInNew, statusNotInOld, options);
                }

                function compareSmallArrayToBigArray(smlArray, bigArray, statusNotInSml, statusNotInBig, options) {
                    var myMin = Math.min,
                        myMax = Math.max,
                        editDistanceMatrix = [],
                        smlIndex, smlIndexMax = smlArray.length,
                        bigIndex, bigIndexMax = bigArray.length,
                        compareRange = (bigIndexMax - smlIndexMax) || 1,
                        maxDistance = smlIndexMax + bigIndexMax + 1,
                        thisRow, lastRow,
                        bigIndexMaxForRow, bigIndexMinForRow;

                    for (smlIndex = 0; smlIndex <= smlIndexMax; smlIndex++) {
                        lastRow = thisRow;
                        editDistanceMatrix.push(thisRow = []);
                        bigIndexMaxForRow = myMin(bigIndexMax, smlIndex + compareRange);
                        bigIndexMinForRow = myMax(0, smlIndex - 1);
                        for (bigIndex = bigIndexMinForRow; bigIndex <= bigIndexMaxForRow; bigIndex++) {
                            if (!bigIndex)
                                thisRow[bigIndex] = smlIndex + 1;
                            else if (!smlIndex)  // Top row - transform empty array into new array via additions
                                thisRow[bigIndex] = bigIndex + 1;
                            else if (smlArray[smlIndex - 1] === bigArray[bigIndex - 1])
                                thisRow[bigIndex] = lastRow[bigIndex - 1];                  // copy value (no edit)
                            else {
                                var northDistance = lastRow[bigIndex] || maxDistance;       // not in big (deletion)
                                var westDistance = thisRow[bigIndex - 1] || maxDistance;    // not in small (addition)
                                thisRow[bigIndex] = myMin(northDistance, westDistance) + 1;
                            }
                        }
                    }

                    var editScript = [], meMinusOne, notInSml = [], notInBig = [];
                    for (smlIndex = smlIndexMax, bigIndex = bigIndexMax; smlIndex || bigIndex;) {
                        meMinusOne = editDistanceMatrix[smlIndex][bigIndex] - 1;
                        if (bigIndex && meMinusOne === editDistanceMatrix[smlIndex][bigIndex-1]) {
                            notInSml.push(editScript[editScript.length] = {     // added
                                'status': statusNotInSml,
                                'value': bigArray[--bigIndex],
                                'index': bigIndex });
                        } else if (smlIndex && meMinusOne === editDistanceMatrix[smlIndex - 1][bigIndex]) {
                            notInBig.push(editScript[editScript.length] = {     // deleted
                                'status': statusNotInBig,
                                'value': smlArray[--smlIndex],
                                'index': smlIndex });
                        } else {
                            --bigIndex;
                            --smlIndex;
                            if (!options['sparse']) {
                                editScript.push({
                                    'status': "retained",
                                    'value': bigArray[bigIndex] });
                            }
                        }
                    }

                    // Set a limit on the number of consecutive non-matching comparisons; having it a multiple of
                    // smlIndexMax keeps the time complexity of this algorithm linear.
                    ko.utils.findMovesInArrayComparison(notInSml, notInBig, smlIndexMax * 10);

                    return editScript.reverse();
                }

                return compareArrays;
            })();

            ko.exportSymbol('utils.compareArrays', ko.utils.compareArrays);
            (function () {
                // Objective:
                // * Given an input array, a container DOM node, and a function from array elements to arrays of DOM nodes,
                //   map the array elements to arrays of DOM nodes, concatenate together all these arrays, and use them to populate the container DOM node
                // * Next time we're given the same combination of things (with the array possibly having mutated), update the container DOM node
                //   so that its children is again the concatenation of the mappings of the array elements, but don't re-map any array elements that we
                //   previously mapped - retain those nodes, and just insert/delete other ones

                // "callbackAfterAddingNodes" will be invoked after any "mapping"-generated nodes are inserted into the container node
                // You can use this, for example, to activate bindings on those nodes.

                function mapNodeAndRefreshWhenChanged(containerNode, mapping, valueToMap, callbackAfterAddingNodes, index) {
                    // Map this array value inside a dependentObservable so we re-map when any dependency changes
                    var mappedNodes = [];
                    var dependentObservable = ko.dependentObservable(function() {
                        var newMappedNodes = mapping(valueToMap, index, ko.utils.fixUpContinuousNodeArray(mappedNodes, containerNode)) || [];

                        // On subsequent evaluations, just replace the previously-inserted DOM nodes
                        if (mappedNodes.length > 0) {
                            ko.utils.replaceDomNodes(mappedNodes, newMappedNodes);
                            if (callbackAfterAddingNodes)
                                ko.dependencyDetection.ignore(callbackAfterAddingNodes, null, [valueToMap, newMappedNodes, index]);
                        }

                        // Replace the contents of the mappedNodes array, thereby updating the record
                        // of which nodes would be deleted if valueToMap was itself later removed
                        mappedNodes.length = 0;
                        ko.utils.arrayPushAll(mappedNodes, newMappedNodes);
                    }, null, { disposeWhenNodeIsRemoved: containerNode, disposeWhen: function() { return !ko.utils.anyDomNodeIsAttachedToDocument(mappedNodes); } });
                    return { mappedNodes : mappedNodes, dependentObservable : (dependentObservable.isActive() ? dependentObservable : undefined) };
                }

                var lastMappingResultDomDataKey = ko.utils.domData.nextKey();

                ko.utils.setDomNodeChildrenFromArrayMapping = function (domNode, array, mapping, options, callbackAfterAddingNodes) {
                    // Compare the provided array against the previous one
                    array = array || [];
                    options = options || {};
                    var isFirstExecution = ko.utils.domData.get(domNode, lastMappingResultDomDataKey) === undefined;
                    var lastMappingResult = ko.utils.domData.get(domNode, lastMappingResultDomDataKey) || [];
                    var lastArray = ko.utils.arrayMap(lastMappingResult, function (x) { return x.arrayEntry; });
                    var editScript = ko.utils.compareArrays(lastArray, array, options['dontLimitMoves']);

                    // Build the new mapping result
                    var newMappingResult = [];
                    var lastMappingResultIndex = 0;
                    var newMappingResultIndex = 0;

                    var nodesToDelete = [];
                    var itemsToProcess = [];
                    var itemsForBeforeRemoveCallbacks = [];
                    var itemsForMoveCallbacks = [];
                    var itemsForAfterAddCallbacks = [];
                    var mapData;

                    function itemMovedOrRetained(editScriptIndex, oldPosition) {
                        mapData = lastMappingResult[oldPosition];
                        if (newMappingResultIndex !== oldPosition)
                            itemsForMoveCallbacks[editScriptIndex] = mapData;
                        // Since updating the index might change the nodes, do so before calling fixUpContinuousNodeArray
                        mapData.indexObservable(newMappingResultIndex++);
                        ko.utils.fixUpContinuousNodeArray(mapData.mappedNodes, domNode);
                        newMappingResult.push(mapData);
                        itemsToProcess.push(mapData);
                    }

                    function callCallback(callback, items) {
                        if (callback) {
                            for (var i = 0, n = items.length; i < n; i++) {
                                if (items[i]) {
                                    ko.utils.arrayForEach(items[i].mappedNodes, function(node) {
                                        callback(node, i, items[i].arrayEntry);
                                    });
                                }
                            }
                        }
                    }

                    for (var i = 0, editScriptItem, movedIndex; editScriptItem = editScript[i]; i++) {
                        movedIndex = editScriptItem['moved'];
                        switch (editScriptItem['status']) {
                            case "deleted":
                                if (movedIndex === undefined) {
                                    mapData = lastMappingResult[lastMappingResultIndex];

                                    // Stop tracking changes to the mapping for these nodes
                                    if (mapData.dependentObservable)
                                        mapData.dependentObservable.dispose();

                                    // Queue these nodes for later removal
                                    nodesToDelete.push.apply(nodesToDelete, ko.utils.fixUpContinuousNodeArray(mapData.mappedNodes, domNode));
                                    if (options['beforeRemove']) {
                                        itemsForBeforeRemoveCallbacks[i] = mapData;
                                        itemsToProcess.push(mapData);
                                    }
                                }
                                lastMappingResultIndex++;
                                break;

                            case "retained":
                                itemMovedOrRetained(i, lastMappingResultIndex++);
                                break;

                            case "added":
                                if (movedIndex !== undefined) {
                                    itemMovedOrRetained(i, movedIndex);
                                } else {
                                    mapData = { arrayEntry: editScriptItem['value'], indexObservable: ko.observable(newMappingResultIndex++) };
                                    newMappingResult.push(mapData);
                                    itemsToProcess.push(mapData);
                                    if (!isFirstExecution)
                                        itemsForAfterAddCallbacks[i] = mapData;
                                }
                                break;
                        }
                    }

                    // Call beforeMove first before any changes have been made to the DOM
                    callCallback(options['beforeMove'], itemsForMoveCallbacks);

                    // Next remove nodes for deleted items (or just clean if there's a beforeRemove callback)
                    ko.utils.arrayForEach(nodesToDelete, options['beforeRemove'] ? ko.cleanNode : ko.removeNode);

                    // Next add/reorder the remaining items (will include deleted items if there's a beforeRemove callback)
                    for (var i = 0, nextNode = ko.virtualElements.firstChild(domNode), lastNode, node; mapData = itemsToProcess[i]; i++) {
                        // Get nodes for newly added items
                        if (!mapData.mappedNodes)
                            ko.utils.extend(mapData, mapNodeAndRefreshWhenChanged(domNode, mapping, mapData.arrayEntry, callbackAfterAddingNodes, mapData.indexObservable));

                        // Put nodes in the right place if they aren't there already
                        for (var j = 0; node = mapData.mappedNodes[j]; nextNode = node.nextSibling, lastNode = node, j++) {
                            if (node !== nextNode)
                                ko.virtualElements.insertAfter(domNode, node, lastNode);
                        }

                        // Run the callbacks for newly added nodes (for example, to apply bindings, etc.)
                        if (!mapData.initialized && callbackAfterAddingNodes) {
                            callbackAfterAddingNodes(mapData.arrayEntry, mapData.mappedNodes, mapData.indexObservable);
                            mapData.initialized = true;
                        }
                    }

                    // If there's a beforeRemove callback, call it after reordering.
                    // Note that we assume that the beforeRemove callback will usually be used to remove the nodes using
                    // some sort of animation, which is why we first reorder the nodes that will be removed. If the
                    // callback instead removes the nodes right away, it would be more efficient to skip reordering them.
                    // Perhaps we'll make that change in the future if this scenario becomes more common.
                    callCallback(options['beforeRemove'], itemsForBeforeRemoveCallbacks);

                    // Finally call afterMove and afterAdd callbacks
                    callCallback(options['afterMove'], itemsForMoveCallbacks);
                    callCallback(options['afterAdd'], itemsForAfterAddCallbacks);

                    // Store a copy of the array items we just considered so we can difference it next time
                    ko.utils.domData.set(domNode, lastMappingResultDomDataKey, newMappingResult);
                }
            })();

            ko.exportSymbol('utils.setDomNodeChildrenFromArrayMapping', ko.utils.setDomNodeChildrenFromArrayMapping);
            ko.nativeTemplateEngine = function () {
                this['allowTemplateRewriting'] = false;
            }

            ko.nativeTemplateEngine.prototype = new ko.templateEngine();
            ko.nativeTemplateEngine.prototype.constructor = ko.nativeTemplateEngine;
            ko.nativeTemplateEngine.prototype['renderTemplateSource'] = function (templateSource, bindingContext, options, templateDocument) {
                var useNodesIfAvailable = !(ko.utils.ieVersion < 9), // IE<9 cloneNode doesn't work properly
                    templateNodesFunc = useNodesIfAvailable ? templateSource['nodes'] : null,
                    templateNodes = templateNodesFunc ? templateSource['nodes']() : null;

                if (templateNodes) {
                    return ko.utils.makeArray(templateNodes.cloneNode(true).childNodes);
                } else {
                    var templateText = templateSource['text']();
                    return ko.utils.parseHtmlFragment(templateText, templateDocument);
                }
            };

            ko.nativeTemplateEngine.instance = new ko.nativeTemplateEngine();
            ko.setTemplateEngine(ko.nativeTemplateEngine.instance);

            ko.exportSymbol('nativeTemplateEngine', ko.nativeTemplateEngine);
            (function() {
                ko.jqueryTmplTemplateEngine = function () {
                    // Detect which version of jquery-tmpl you're using. Unfortunately jquery-tmpl
                    // doesn't expose a version number, so we have to infer it.
                    // Note that as of Knockout 1.3, we only support jQuery.tmpl 1.0.0pre and later,
                    // which KO internally refers to as version "2", so older versions are no longer detected.
                    var jQueryTmplVersion = this.jQueryTmplVersion = (function() {
                        if (!jQueryInstance || !(jQueryInstance['tmpl']))
                            return 0;
                        // Since it exposes no official version number, we use our own numbering system. To be updated as jquery-tmpl evolves.
                        try {
                            if (jQueryInstance['tmpl']['tag']['tmpl']['open'].toString().indexOf('__') >= 0) {
                                // Since 1.0.0pre, custom tags should append markup to an array called "__"
                                return 2; // Final version of jquery.tmpl
                            }
                        } catch(ex) { /* Apparently not the version we were looking for */ }

                        return 1; // Any older version that we don't support
                    })();

                    function ensureHasReferencedJQueryTemplates() {
                        if (jQueryTmplVersion < 2)
                            throw new Error("Your version of jQuery.tmpl is too old. Please upgrade to jQuery.tmpl 1.0.0pre or later.");
                    }

                    function executeTemplate(compiledTemplate, data, jQueryTemplateOptions) {
                        return jQueryInstance['tmpl'](compiledTemplate, data, jQueryTemplateOptions);
                    }

                    this['renderTemplateSource'] = function(templateSource, bindingContext, options, templateDocument) {
                        templateDocument = templateDocument || document;
                        options = options || {};
                        ensureHasReferencedJQueryTemplates();

                        // Ensure we have stored a precompiled version of this template (don't want to reparse on every render)
                        var precompiled = templateSource['data']('precompiled');
                        if (!precompiled) {
                            var templateText = templateSource['text']() || "";
                            // Wrap in "with($whatever.koBindingContext) { ... }"
                            templateText = "{{ko_with $item.koBindingContext}}" + templateText + "{{/ko_with}}";

                            precompiled = jQueryInstance['template'](null, templateText);
                            templateSource['data']('precompiled', precompiled);
                        }

                        var data = [bindingContext['$data']]; // Prewrap the data in an array to stop jquery.tmpl from trying to unwrap any arrays
                        var jQueryTemplateOptions = jQueryInstance['extend']({ 'koBindingContext': bindingContext }, options['templateOptions']);

                        var resultNodes = executeTemplate(precompiled, data, jQueryTemplateOptions);
                        resultNodes['appendTo'](templateDocument.createElement("div")); // Using "appendTo" forces jQuery/jQuery.tmpl to perform necessary cleanup work

                        jQueryInstance['fragments'] = {}; // Clear jQuery's fragment cache to avoid a memory leak after a large number of template renders
                        return resultNodes;
                    };

                    this['createJavaScriptEvaluatorBlock'] = function(script) {
                        return "{{ko_code ((function() { return " + script + " })()) }}";
                    };

                    this['addTemplate'] = function(templateName, templateMarkup) {
                        document.write("<script type='text/html' id='" + templateName + "'>" + templateMarkup + "<" + "/script>");
                    };

                    if (jQueryTmplVersion > 0) {
                        jQueryInstance['tmpl']['tag']['ko_code'] = {
                            open: "__.push($1 || '');"
                        };
                        jQueryInstance['tmpl']['tag']['ko_with'] = {
                            open: "with($1) {",
                            close: "} "
                        };
                    }
                };

                ko.jqueryTmplTemplateEngine.prototype = new ko.templateEngine();
                ko.jqueryTmplTemplateEngine.prototype.constructor = ko.jqueryTmplTemplateEngine;

                // Use this one by default *only if jquery.tmpl is referenced*
                var jqueryTmplTemplateEngineInstance = new ko.jqueryTmplTemplateEngine();
                if (jqueryTmplTemplateEngineInstance.jQueryTmplVersion > 0)
                    ko.setTemplateEngine(jqueryTmplTemplateEngineInstance);

                ko.exportSymbol('jqueryTmplTemplateEngine', ko.jqueryTmplTemplateEngine);
            })();
        }));
    }());
})();
/// Knockout Mapping plugin v2.4.1
/// (c) 2013 Steven Sanderson, Roy Jacobs - http://knockoutjs.com/
/// License: MIT (http://www.opensource.org/licenses/mit-license.php)
(function(e){"function"===typeof require&&"object"===typeof exports&&"object"===typeof module?e(require("knockout"),exports):"function"===typeof define&&define.amd?define(["knockout","exports"],e):e(ko,ko.mapping={})})(function(e,f){function y(b,c){var a,d;for(d in c)if(c.hasOwnProperty(d)&&c[d])if(a=f.getType(b[d]),d&&b[d]&&"array"!==a&&"string"!==a)y(b[d],c[d]);else if("array"===f.getType(b[d])&&"array"===f.getType(c[d])){a=b;for(var e=d,l=b[d],n=c[d],t={},g=l.length-1;0<=g;--g)t[l[g]]=l[g];for(g=
n.length-1;0<=g;--g)t[n[g]]=n[g];l=[];n=void 0;for(n in t)l.push(t[n]);a[e]=l}else b[d]=c[d]}function E(b,c){var a={};y(a,b);y(a,c);return a}function z(b,c){for(var a=E({},b),e=L.length-1;0<=e;e--){var f=L[e];a[f]&&(a[""]instanceof Object||(a[""]={}),a[""][f]=a[f],delete a[f])}c&&(a.ignore=h(c.ignore,a.ignore),a.include=h(c.include,a.include),a.copy=h(c.copy,a.copy),a.observe=h(c.observe,a.observe));a.ignore=h(a.ignore,j.ignore);a.include=h(a.include,j.include);a.copy=h(a.copy,j.copy);a.observe=h(a.observe,
j.observe);a.mappedProperties=a.mappedProperties||{};a.copiedProperties=a.copiedProperties||{};return a}function h(b,c){"array"!==f.getType(b)&&(b="undefined"===f.getType(b)?[]:[b]);"array"!==f.getType(c)&&(c="undefined"===f.getType(c)?[]:[c]);return e.utils.arrayGetDistinctValues(b.concat(c))}function F(b,c,a,d,k,l,n){var t="array"===f.getType(e.utils.unwrapObservable(c));l=l||"";if(f.isMapped(b)){var g=e.utils.unwrapObservable(b)[p];a=E(g,a)}var j=n||k,h=function(){return a[d]&&a[d].create instanceof
Function},x=function(b){var f=G,g=e.dependentObservable;e.dependentObservable=function(a,b,c){c=c||{};a&&"object"==typeof a&&(c=a);var d=c.deferEvaluation,M=!1;c.deferEvaluation=!0;a=new H(a,b,c);if(!d){var g=a,d=e.dependentObservable;e.dependentObservable=H;a=e.isWriteableObservable(g);e.dependentObservable=d;d=H({read:function(){M||(e.utils.arrayRemoveItem(f,g),M=!0);return g.apply(g,arguments)},write:a&&function(a){return g(a)},deferEvaluation:!0});d.__DO=g;a=d;f.push(a)}return a};e.dependentObservable.fn=
H.fn;e.computed=e.dependentObservable;b=e.utils.unwrapObservable(k)instanceof Array?a[d].create({data:b||c,parent:j,skip:N}):a[d].create({data:b||c,parent:j});e.dependentObservable=g;e.computed=e.dependentObservable;return b},u=function(){return a[d]&&a[d].update instanceof Function},v=function(b,f){var g={data:f||c,parent:j,target:e.utils.unwrapObservable(b)};e.isWriteableObservable(b)&&(g.observable=b);return a[d].update(g)};if(n=I.get(c))return n;d=d||"";if(t){var t=[],s=!1,m=function(a){return a};
a[d]&&a[d].key&&(m=a[d].key,s=!0);e.isObservable(b)||(b=e.observableArray([]),b.mappedRemove=function(a){var c="function"==typeof a?a:function(b){return b===m(a)};return b.remove(function(a){return c(m(a))})},b.mappedRemoveAll=function(a){var c=C(a,m);return b.remove(function(a){return-1!=e.utils.arrayIndexOf(c,m(a))})},b.mappedDestroy=function(a){var c="function"==typeof a?a:function(b){return b===m(a)};return b.destroy(function(a){return c(m(a))})},b.mappedDestroyAll=function(a){var c=C(a,m);return b.destroy(function(a){return-1!=
e.utils.arrayIndexOf(c,m(a))})},b.mappedIndexOf=function(a){var c=C(b(),m);a=m(a);return e.utils.arrayIndexOf(c,a)},b.mappedGet=function(a){return b()[b.mappedIndexOf(a)]},b.mappedCreate=function(a){if(-1!==b.mappedIndexOf(a))throw Error("There already is an object with the key that you specified.");var c=h()?x(a):a;u()&&(a=v(c,a),e.isWriteableObservable(c)?c(a):c=a);b.push(c);return c});n=C(e.utils.unwrapObservable(b),m).sort();g=C(c,m);s&&g.sort();s=e.utils.compareArrays(n,g);n={};var J,A=e.utils.unwrapObservable(c),
y={},z=!0,g=0;for(J=A.length;g<J;g++){var r=m(A[g]);if(void 0===r||r instanceof Object){z=!1;break}y[r]=A[g]}var A=[],B=0,g=0;for(J=s.length;g<J;g++){var r=s[g],q,w=l+"["+g+"]";switch(r.status){case "added":var D=z?y[r.value]:K(e.utils.unwrapObservable(c),r.value,m);q=F(void 0,D,a,d,b,w,k);h()||(q=e.utils.unwrapObservable(q));w=O(e.utils.unwrapObservable(c),D,n);q===N?B++:A[w-B]=q;n[w]=!0;break;case "retained":D=z?y[r.value]:K(e.utils.unwrapObservable(c),r.value,m);q=K(b,r.value,m);F(q,D,a,d,b,w,
k);w=O(e.utils.unwrapObservable(c),D,n);A[w]=q;n[w]=!0;break;case "deleted":q=K(b,r.value,m)}t.push({event:r.status,item:q})}b(A);a[d]&&a[d].arrayChanged&&e.utils.arrayForEach(t,function(b){a[d].arrayChanged(b.event,b.item)})}else if(P(c)){b=e.utils.unwrapObservable(b);if(!b){if(h())return s=x(),u()&&(s=v(s)),s;if(u())return v(s);b={}}u()&&(b=v(b));I.save(c,b);if(u())return b;Q(c,function(d){var f=l.length?l+"."+d:d;if(-1==e.utils.arrayIndexOf(a.ignore,f))if(-1!=e.utils.arrayIndexOf(a.copy,f))b[d]=
c[d];else if("object"!=typeof c[d]&&"array"!=typeof c[d]&&0<a.observe.length&&-1==e.utils.arrayIndexOf(a.observe,f))b[d]=c[d],a.copiedProperties[f]=!0;else{var g=I.get(c[d]),k=F(b[d],c[d],a,d,b,f,b),g=g||k;if(0<a.observe.length&&-1==e.utils.arrayIndexOf(a.observe,f))b[d]=g(),a.copiedProperties[f]=!0;else{if(e.isWriteableObservable(b[d])){if(g=e.utils.unwrapObservable(g),b[d]()!==g)b[d](g)}else g=void 0===b[d]?g:e.utils.unwrapObservable(g),b[d]=g;a.mappedProperties[f]=!0}}})}else switch(f.getType(c)){case "function":u()?
e.isWriteableObservable(c)?(c(v(c)),b=c):b=v(c):b=c;break;default:if(e.isWriteableObservable(b))return q=u()?v(b):e.utils.unwrapObservable(c),b(q),q;h()||u();b=h()?x():e.observable(e.utils.unwrapObservable(c));u()&&b(v(b))}return b}function O(b,c,a){for(var d=0,e=b.length;d<e;d++)if(!0!==a[d]&&b[d]===c)return d;return null}function R(b,c){var a;c&&(a=c(b));"undefined"===f.getType(a)&&(a=b);return e.utils.unwrapObservable(a)}function K(b,c,a){b=e.utils.unwrapObservable(b);for(var d=0,f=b.length;d<
f;d++){var l=b[d];if(R(l,a)===c)return l}throw Error("When calling ko.update*, the key '"+c+"' was not found!");}function C(b,c){return e.utils.arrayMap(e.utils.unwrapObservable(b),function(a){return c?R(a,c):a})}function Q(b,c){if("array"===f.getType(b))for(var a=0;a<b.length;a++)c(a);else for(a in b)c(a)}function P(b){var c=f.getType(b);return("object"===c||"array"===c)&&null!==b}function T(){var b=[],c=[];this.save=function(a,d){var f=e.utils.arrayIndexOf(b,a);0<=f?c[f]=d:(b.push(a),c.push(d))};
this.get=function(a){a=e.utils.arrayIndexOf(b,a);return 0<=a?c[a]:void 0}}function S(){var b={},c=function(a){var c;try{c=a}catch(e){c="$$$"}a=b[c];void 0===a&&(a=new T,b[c]=a);return a};this.save=function(a,b){c(a).save(a,b)};this.get=function(a){return c(a).get(a)}}var p="__ko_mapping__",H=e.dependentObservable,B=0,G,I,L=["create","update","key","arrayChanged"],N={},x={include:["_destroy"],ignore:[],copy:[],observe:[]},j=x;f.isMapped=function(b){return(b=e.utils.unwrapObservable(b))&&b[p]};f.fromJS=
function(b){if(0==arguments.length)throw Error("When calling ko.fromJS, pass the object you want to convert.");try{B++||(G=[],I=new S);var c,a;2==arguments.length&&(arguments[1][p]?a=arguments[1]:c=arguments[1]);3==arguments.length&&(c=arguments[1],a=arguments[2]);a&&(c=E(c,a[p]));c=z(c);var d=F(a,b,c);a&&(d=a);if(!--B)for(;G.length;){var e=G.pop();e&&(e(),e.__DO.throttleEvaluation=e.throttleEvaluation)}d[p]=E(d[p],c);return d}catch(f){throw B=0,f;}};f.fromJSON=function(b){var c=e.utils.parseJson(b);
arguments[0]=c;return f.fromJS.apply(this,arguments)};f.updateFromJS=function(){throw Error("ko.mapping.updateFromJS, use ko.mapping.fromJS instead. Please note that the order of parameters is different!");};f.updateFromJSON=function(){throw Error("ko.mapping.updateFromJSON, use ko.mapping.fromJSON instead. Please note that the order of parameters is different!");};f.toJS=function(b,c){j||f.resetDefaultOptions();if(0==arguments.length)throw Error("When calling ko.mapping.toJS, pass the object you want to convert.");
if("array"!==f.getType(j.ignore))throw Error("ko.mapping.defaultOptions().ignore should be an array.");if("array"!==f.getType(j.include))throw Error("ko.mapping.defaultOptions().include should be an array.");if("array"!==f.getType(j.copy))throw Error("ko.mapping.defaultOptions().copy should be an array.");c=z(c,b[p]);return f.visitModel(b,function(a){return e.utils.unwrapObservable(a)},c)};f.toJSON=function(b,c){var a=f.toJS(b,c);return e.utils.stringifyJson(a)};f.defaultOptions=function(){if(0<arguments.length)j=
arguments[0];else return j};f.resetDefaultOptions=function(){j={include:x.include.slice(0),ignore:x.ignore.slice(0),copy:x.copy.slice(0)}};f.getType=function(b){if(b&&"object"===typeof b){if(b.constructor===Date)return"date";if(b.constructor===Array)return"array"}return typeof b};f.visitModel=function(b,c,a){a=a||{};a.visitedObjects=a.visitedObjects||new S;var d,k=e.utils.unwrapObservable(b);if(P(k))a=z(a,k[p]),c(b,a.parentName),d="array"===f.getType(k)?[]:{};else return c(b,a.parentName);a.visitedObjects.save(b,
d);var l=a.parentName;Q(k,function(b){if(!(a.ignore&&-1!=e.utils.arrayIndexOf(a.ignore,b))){var j=k[b],g=a,h=l||"";"array"===f.getType(k)?l&&(h+="["+b+"]"):(l&&(h+="."),h+=b);g.parentName=h;if(!(-1===e.utils.arrayIndexOf(a.copy,b)&&-1===e.utils.arrayIndexOf(a.include,b)&&k[p]&&k[p].mappedProperties&&!k[p].mappedProperties[b]&&k[p].copiedProperties&&!k[p].copiedProperties[b]&&"array"!==f.getType(k)))switch(f.getType(e.utils.unwrapObservable(j))){case "object":case "array":case "undefined":g=a.visitedObjects.get(j);
d[b]="undefined"!==f.getType(g)?g:f.visitModel(j,c,a);break;default:d[b]=c(j,a.parentName)}}});return d}});

/*
Handles the display and editing of UTC dates.

Declares a Knockout extender that allows UTC ISODates to be displayed and edited as simple dates in the form
 dd-MM-yyyy and with local timezone adjustment. Hours and minutes can optionally be shown and edited.

Declares a custom binding that allows dates to be changed using the Bootstrap datepicker
 (https://github.com/eternicode/bootstrap-datepicker).

The date values in the ViewModel are maintained as UTC dates as strings in ISO format (ISO8601 without milliseconds).

The extender adds a 'formattedDate' property to the observable. It is this property that should be bound
 to an element, eg

    <input data-bind="value: myDate.formattedDate" type=...../> or
    <span data-bind="text: myDate.formattedDate" />

The date is defined in the view model like this:

    self.myDate = ko.observable("${myDate}").extend({simpleDate: false});

The boolean indicates whether to show the time as well.

The extender also adds a 'date' property to the observable that holds the value as a Javascript date object.
This is used by the datepicker custom binding.

The custom binding listens for changes via the datepicker as well as direct edits to the input field and
 updates the model. It also updates the datepicker on change to the model.

*/

(function(){

    // creates an ISO8601 date string but without millis - to match the format used by the java thingy for BSON dates
    Date.prototype.toISOStringNoMillis = function() {
        function pad(n) { return n < 10 ? '0' + n : n }
        return this.getUTCFullYear() + '-'
            + pad(this.getUTCMonth() + 1) + '-'
            + pad(this.getUTCDate()) + 'T'
            + pad(this.getUTCHours()) + ':'
            + pad(this.getUTCMinutes()) + ':'
            + pad(this.getUTCSeconds()) + 'Z';
    };

    // Use native ISO date parsing or shim for old browsers (IE8)
    var D= new Date('2011-06-02T09:34:29+02:00');
    if(!D || +D!== 1307000069000){
        Date.fromISO= function(s){
            var day, tz,
                rx=/^(\d{4}\-\d\d\-\d\d([tT ][\d:\.]*)?)([zZ]|([+\-])(\d\d):(\d\d))?$/,
                p= rx.exec(s) || [];
            if(p[1]){
                day= p[1].split(/\D/);
                for(var i= 0, L= day.length; i<L; i++){
                    day[i]= parseInt(day[i], 10) || 0;
                }
                day[1]-= 1;
                day= new Date(Date.UTC.apply(Date, day));
                if(!day.getDate()) return NaN;
                if(p[5]){
                    tz= (parseInt(p[5], 10)*60);
                    if(p[6]) tz+= parseInt(p[6], 10);
                    if(p[4]== '+') tz*= -1;
                    if(tz) day.setUTCMinutes(day.getUTCMinutes()+ tz);
                }
                return day;
            }
            return NaN;
        }
    }
    else{
        Date.fromISO= function(s){
            return new Date(s);
        }
    }
})();

function isValidDate(d) {
    if ( Object.prototype.toString.call(d) !== "[object Date]" )
        return false;
    return !isNaN(d.getTime());
}

function convertToSimpleDate(isoDate, includeTime) {
    if (!isoDate) { return ''}
    var date = isoDate, strDate;
    if (typeof isoDate === 'string') {
        date = Date.fromISO(isoDate);
    }
    if (!isValidDate(date)) { return '' }
    strDate = pad(date.getDate(),2) + '-' + pad(date.getMonth() + 1,2) + '-' + date.getFullYear();
    strDate = pad(date.getDate(),2) + '-' + pad(date.getMonth() + 1,2) + '-' + date.getFullYear();
    if (includeTime) {
        strDate = strDate + ' ' + pad(date.getHours(),2) + ':' + pad(date.getMinutes(),2);
    }
    return strDate;
}

function convertToIsoDate(date) {
    if (typeof date === 'string') {
        if (date.length === 20 && date.charAt(19) === 'Z') {
            // already an ISO date string
            return date;
        } else if (date.length > 9){
            // assume a short date of the form dd-mm-yyyy
            var year = date.substr(6,4),
                month = Number(date.substr(3,2))- 1,
                day = date.substr(0,2),
                hours = date.length > 12 ? date.substr(11,2) : 0,
                minutes = date.length > 15 ? date.substr(14,2) : 0;
            return new Date(year, month, day, hours, minutes).toISOStringNoMillis();
        } else {
            return '';
        }
    } else if (typeof date === 'object') {
        // assume a date object
        return date.toISOStringNoMillis();
    } else {
        return '';
    }
}

function stringToDate(date) {
    if (typeof date === 'string') {
        if (date.length === 20 && date.charAt(19) === 'Z') {
            // already an ISO date string
            return Date.fromISO(date);
        } else if (date.length > 9){
            // assume a short date of the form dd-mm-yyyy
            var year = date.substr(6,4),
                month = Number(date.substr(3,2))- 1,
                day = date.substr(0,2),
                hours = date.length > 12 ? date.substr(11,2) : 0,
                minutes = date.length > 15 ? date.substr(14,2) : 0;
            return new Date(year, month, day, hours, minutes);
        } else {
            return undefined;
        }
    } else if (typeof date === 'object') {
        // assume a date object
        return date;
    } else {
        return undefined;
    }
}

(function() {

    // Binding to exclude the contained html from the current binding context.
    // Used when you want to bind a section of html to a different viewModel.
    ko.bindingHandlers.stopBinding = {
        init: function() {
            return { controlsDescendantBindings: true };
        }
    };
    ko.virtualElements.allowedBindings.stopBinding = true;

    // This extends an observable that holds a UTC ISODate. It creates properties that hold:
    //  a JS Date object - useful with datepicker; and
    //  a simple formatted date of the form dd-mm-yyyy useful for display.
    // The formatted date will include hh:MM if the includeTime argument is true
    ko.extenders.simpleDate = function (target, includeTime) {
        target.date = ko.computed({
            read: function () {
                return Date.fromISO(target());
            },

            write: function (newValue) {
                if (newValue) {
                    var current = target(),
                        valueToWrite = convertToIsoDate(newValue);

                    if (valueToWrite !== current) {
                        target(valueToWrite);
                    }
                } else {
                    // date has been cleared
                    target("");
                }
            }
        });
        target.formattedDate = ko.computed({
            read: function () {
                return convertToSimpleDate(target(), includeTime);
            },

            write: function (newValue) {
                if (newValue) {
                    var current = target(),
                        valueToWrite = convertToIsoDate(newValue);

                    if (valueToWrite !== current) {
                        target(valueToWrite);
                    }
                }
            }
        });

        target.date(target());
        target.formattedDate(target());

        return target;
    };

    /* Custom binding for Bootstrap datepicker */
    // This binds an element and a model observable to the bootstrap datepicker.
    // The element can be an input or container such as span, div, td.
    // The datepicker is 2-way bound to the model. An input element will be updated automatically,
    //  other elements may need an explicit text binding to the formatted model date (see
    //  clickToPickDate for an example of a simple element).
    ko.bindingHandlers.datepicker = {
        init: function(element, valueAccessor, allBindingsAccessor) {
            // set current date into the element
            var $element = $(element),
                initialDate = ko.utils.unwrapObservable(valueAccessor()),
                initialDateStr = convertToSimpleDate(initialDate);
            if ($element.is('input')) {
                $element.val(initialDateStr);
            } else {
                $element.data('date', initialDateStr);
            }

            //initialize datepicker with some optional options
            $element.datepicker({format: 'dd-mm-yyyy', autoclose: true});

            // if the parent container holds any element with the class 'open-datepicker'
            // then add a hook to do so
            $element.parent().find('.open-datepicker').click(function () {
                $element.datepicker('show');
            });

            var changeHandler = function(event) {
                var value = valueAccessor();
                if (ko.isObservable(value)) {
                    value(event.date);
                }
            };

            //when a user changes the date via the datepicker, update the view model
            ko.utils.registerEventHandler(element, "changeDate", changeHandler);
            ko.utils.registerEventHandler(element, "hide", changeHandler);

            //when a user changes the date via the input, update the view model
            ko.utils.registerEventHandler(element, "change", function() {
                var value = valueAccessor();
                if (ko.isObservable(value)) {
                    value(stringToDate(element.value));
                    $(element).trigger('blur');  // This is to trigger revalidation of the date field to remove existing validation errors.
                }
            });
        },
        update: function(element, valueAccessor)   {
            var widget = $(element).data("datepicker");
            //when the view model is updated, update the widget
            if (widget) {
                var date = ko.utils.unwrapObservable(valueAccessor());
                widget.date = date;
                if (!isNaN(widget.date)) {
                    widget.setDate(widget.date);
                }
            }


        }
    };

}());

function pad(number, length){
    var str = "" + number
    while (str.length < length) {
        str = '0'+str
    }
    return str
}

//wrapper for an observable that protects value until committed
// CG - Changed the way the protected observable works from value doesn't change until commit to
// value changes as edits are made with rollback.  This was to enable cross field dependencies in a table
// row - using a temp variable meant observers were not notified of changes until commit.
ko.protectedObservable = function(initialValue) {
    //private variables
    var _current = ko.observable(initialValue);
    var _committed = initialValue;

    var result = ko.dependentObservable({
        read: _current,
        write: function(newValue) {
           _current(newValue);
        }
    });

    //commit the temporary value to our observable, if it is different
    result.commit = function() {
        _committed = _current();
    };

    //notify subscribers to update their value with the original
    result.reset = function() {
        _current(_committed);
    };

    return result;
};

// This binding allows dates to be displayed as simple text that can be clicked to access
//  a date picker for in-place editing.
// A user prompt appears if the model has no value. this can be customised.
// A calendar icon is added after the bound element as a visual indicator that the date can be edited.
// A computed 'hasChanged' property provides an observable isDirty flag for external save/revert mechanisms.
// The 'datepicker' binding is applied to the element to integrate the bootstrap datepicker.
// NOTE you can use the datepicker binding directly if you have an input as your predefined element.
ko.bindingHandlers.clickToPickDate = {
    init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
        var observable = valueAccessor(),
            userPrompt = $(element).attr('data-prompt'),
            prompt = userPrompt || 'Click to edit',
            icon = $('<i class="icon-calendar open-datepicker" title="Click to change date"></i>');

        observable.originalValue = observable.date();
        observable.hasChanged = ko.computed(function () {
            //console.log("original: " + observable.originalValue + " current: " + observable.date());
            var original = observable.originalValue.getTime();
            var current = observable.date().getTime();
            return (original != current) && (!isNaN(original) || !isNaN(current));
        });

        $(element).parent().append(icon);

        ko.applyBindingsToNode(element, {
            text: ko.computed(function() {
                // todo: style default text as grey
                return ko.utils.unwrapObservable(observable) !== "" ? observable.formattedDate() : prompt;
            }),
            datepicker: observable.date
        });
    }
};

/*
This binding allows text values to be displayed as simple text that can be clicked to access
 an input control for in-place editing.
 */
ko.bindingHandlers.clickToEdit = {
    init: function(element, valueAccessor) {
        var observable = valueAccessor(),
            link = document.createElement("a"),
            input = document.createElement("input"),
            dblclick = $(element).attr('data-edit-on-dblclick'),
            userPrompt = $(element).attr('data-prompt'),
            prompt = userPrompt || (dblclick ? 'Double-click to edit' : 'Click to edit'),
            linkBindings;

        // add any classes specified for the link element
        $(link).addClass($(element).attr('data-link-class'));
        // add any classes specified for the input element
        $(input).addClass($(element).attr('data-input-class'));

        element.appendChild(link);
        element.appendChild(input);

        observable.editing = ko.observable(false);
        observable.stopEditing = function () {
            $(input).blur();
            observable.editing(false)
        };

        linkBindings = {
            text: ko.computed(function() {
                // todo: style default text as grey
                var value = ko.utils.unwrapObservable(observable);
                return value !== "" ? value : prompt;
            }),
            visible: ko.computed(function() {
                return !observable.editing();
            })
        };

        // bind to either the click or dblclick event
        if (dblclick) {
            linkBindings.event = { dblclick: observable.editing.bind(null, true) };
        } else {
            linkBindings.click = observable.editing.bind(null, true);
        }

        ko.applyBindingsToNode(link, linkBindings);

        ko.applyBindingsToNode(input, {
            value: observable,
            visible: observable.editing,
            hasfocus: observable.editing
        });

        // quit editing on enter key
        $(input).keydown(function(e) {
            if (e.which === 13) {
                observable.stopEditing();
            }
        });
    }
};

/*
This binding allows small non-negative integers in the model to be displayed as a number of ticks
 and edited by spinner buttons.
 */
ko.bindingHandlers.ticks = {
    init: function(element, valueAccessor) {
        var observable = valueAccessor(),
            $parent = $(element).parent(),
            $buttons,
            $widget = $('<div class="tick-controls btn-group btn-group-vertical"></div>');

        $parent.css('padding','4px');
        $widget.append($('<button class="up btn btn-mini"><i class="icon-chevron-up"></i></button>'));
        $widget.append($('<button class="down btn btn-mini"><i class="icon-chevron-down"></i></button>'));
        $parent.append($widget);
        $buttons = $parent.find('button');

        $buttons.hide();

        ko.utils.registerEventHandler($parent, "mouseover", function() {
            $buttons.show();
        });

        ko.utils.registerEventHandler($parent, "mouseout", function() {
            $buttons.hide();
        });

        ko.utils.registerEventHandler($buttons, "click", function() {
            var isUp = $(this).hasClass('up'),
                value = Number(observable());
            if (isNaN(value)) { value = 0; }

            if (isUp) {
                observable("" + (value + 1));
            } else {
                if (value > 0) {
                    observable("" + (value - 1));
                }
            }
            return false;
        });
    },
    update: function(element, valueAccessor) {
        var observable = valueAccessor(), value,
            tick = '<i class="icon-ok"></i>', ticks = "";
        if (observable) {
            value = Number(ko.utils.unwrapObservable(observable));
            if (isNaN(value)) {
                $(element).html("");
            } else {
                //$(element).html(value);
                $(element).empty();
                for (i=0; i < value; i++) {
                    ticks += tick;
                }
                $(element).html(ticks);
            }
        }
    }
};

// handles simple or deferred computed objects
// see activity/edit.gsp for an example of use
ko.extenders.async = function(computedDeferred, initialValue) {

    var plainObservable = ko.observable(initialValue), currentDeferred;
    plainObservable.inProgress = ko.observable(false);

    ko.computed(function() {
        if (currentDeferred) {
            currentDeferred.reject();
            currentDeferred = null;
        }

        var newDeferred = computedDeferred();
        if (newDeferred &&
            (typeof newDeferred.done == "function")) {

            // It's a deferred
            plainObservable.inProgress(true);

            // Create our own wrapper so we can reject
            currentDeferred = $.Deferred().done(function(data) {
                plainObservable.inProgress(false);
                plainObservable(data);
            });
            newDeferred.done(currentDeferred.resolve);
        } else {
            // A real value, so just publish it immediately
            plainObservable(newDeferred);
        }
    });

    return plainObservable;
};

ko.bindingHandlers.fileUploadNoImage = {
    init: function(element, options) {

        var defaults = {autoUpload:true, forceIframeTransport:true};
        var settings = {};
        $.extend(settings, defaults, options());
        $(element).fileupload(settings);
    }
}

// A handy binding to iterate over the properties of an object.
ko.bindingHandlers.foreachprop = {
    transformObject: function (obj) {
        var properties = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                properties.push({ key: key, value: obj[key] });
            }
        }
        return properties;
    },
    init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = ko.utils.unwrapObservable(valueAccessor()),
            properties = ko.bindingHandlers.foreachprop.transformObject(value);
        ko.applyBindingsToNode(element, { foreach: properties });
        return { controlsDescendantBindings: true };
    }
};

// Compares this column to the current sort parameters and displays the appropriate sort icons.
// If this is the column that the model is currently sorted by, then shows an up or down icon
//  depending on the current sort order.
// Usage example: <th data-bind="sortIcon:sortParamsObject,click:sortBy" data-column="type">Type</th>
// The sortIcon binding takes an object or observable that contains a 'by' property and an 'order' property.
// The data-column attr defines the model value that the column holds. This is compared to the
//  current sort by value to see if this is the active column.
ko.bindingHandlers.sortIcon = {
    update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var $element = $(element),
            name = $element.data('column'),
            $icon = $element.find('i'),
            className = "icon-blank",
            sortParams = ko.utils.unwrapObservable(valueAccessor());
        // see if this is the active sort column
        if (sortParams.by() === name) {
            // and if so, choose an icon based on sort order
            className = sortParams.order() === 'desc' ? 'icon-chevron-down' : 'icon-chevron-up';
        }
        // insert the icon markup if it doesn't exist
        if ($icon.length === 0) {
            $icon = $("<i class='icon-blank'></i>").appendTo($element);
        }
        // set the computed class
        $icon.removeClass('icon-chevron-down').removeClass('icon-chevron-up').removeClass('icon-blank').addClass(className);
    }
};


ko.bindingHandlers.autocomplete = {
    init: function (element, params) {
        var param = params();
        var url = ko.utils.unwrapObservable(param.url);
        var list = ko.utils.unwrapObservable(param.listId);
        var valueCallback = ko.utils.unwrapObservable(param.valueChangeCallback)
        var options = {};

        options.source = function(request, response) {
            $(element).addClass("ac_loading");

            if (valueCallback !== undefined) {
                valueCallback(request.term);
            }
            var data = {q:request.term};
            if (list) {
                $.extend(data, {druid: list});
            }
            $.ajax({
                url: url,
                dataType:'json',
                data: data,
                success: function(data) {
                    var items = $.map(data.autoCompleteList, function(item) {
                        return {
                            label:item.name,
                            value: item.name,
                            source: item
                        }
                    });
                    items = [{label:"Missing or unidentified species", value:request.term, source: {listId:'unmatched', name: request.term}}].concat(items);
                    response(items);

                },
                error: function() {
                    items = [{label:"Error during species lookup", value:request.term, source: {listId:'error-unmatched', name: request.term}}];
                    response(items);
                },
                complete: function() {
                    $(element).removeClass("ac_loading");
                }
            });
        };
        options.select = function(event, ui) {
            ko.utils.unwrapObservable(param.result)(event, ui.item.source);
        };

        var render = ko.utils.unwrapObservable(param.render);
        if (render) {

            $(element).autocomplete(options).data("ui-autocomplete")._renderItem = function(ul, item) {
                var result = $('<li></li>').html(render(item.source));
                return result.appendTo(ul);

            };
        }
        else {
            $(element).autocomplete(options);
        }
    }
};

/**
 * Creates a flag that indicates whether the model has been modified.
 *
 * Compares the model to its initial state each time an observable changes. Uses the model's
 * modelAsJSON method if it is defined else uses ko.toJSON.
 *
 * @param root the model to watch
 * @param isInitiallyDirty
 * @returns an object (function) with the methods 'isDirty' and 'reset'
 */
ko.dirtyFlag = function(root, isInitiallyDirty) {
    var result = function() {};
    var _isInitiallyDirty = ko.observable(isInitiallyDirty);
    // this allows for models that do not have a modelAsJSON method
    var getRepresentation = function () {
        return (typeof root.modelAsJSON === 'function') ? root.modelAsJSON() : ko.toJSON(root);
    };
    var _initialState = ko.observable(getRepresentation());

    result.isDirty = ko.dependentObservable(function() {
        var dirty = _isInitiallyDirty() || _initialState() !== getRepresentation();
        /*if (dirty) {
            console.log('Initial: ' + _initialState());
            console.log('Actual: ' + getRepresentation());
        }*/
        return dirty;
    });

    result.reset = function() {
        _initialState(getRepresentation());
        _isInitiallyDirty(false);
    };

    return result;
};

/**
 * A simple dirty flag that will detect the first change to a model, then afterwards always return true (meaning
 * dirty).  This is to prevent the full model being re-serialized to JSON on every change, which can cause
 * performance issues for large models.
 * From: http://www.knockmeout.net/2011/05/creating-smart-dirty-flag-in-knockoutjs.html
 * @param root the model.
 * @returns true if the model has changed since this function was added.
 */
ko.simpleDirtyFlag = function(root) {
    var _initialized = ko.observable(false);

    // this allows for models that do not have a modelAsJSON method
    var getRepresentation = function () {
        return (typeof root.modelAsJSON === 'function') ? root.modelAsJSON() : ko.toJSON(root);
    };

    var result = function() {};

    //one-time dirty flag that gives up its dependencies on first change
    result.isDirty = ko.computed(function () {
        if (!_initialized()) {

            //just for subscriptions
            getRepresentation();

            //next time return true and avoid ko.toJS
            _initialized(true);

            //on initialization this flag is not dirty
            return false;
        }

        //on subsequent changes, flag is now dirty
        return true;
    });
    result.reset = function() {
        _initialized(false);
    }

    return result;
};



/**
 * A vetoableObservable is an observable that provides a mechanism to prevent changes to its value under certain
 * conditions.  When a change is notified, the vetoCheck function is executed - if it returns false the change is
 * disallowed and the vetoCallback function is invoked.  Otherwise the change is allowed and the noVetoCallback
 * function is invoked.
 * The only current example of it's use is when the type of an activity is changed, it
 * can potentially invalidate any target score values that have been supplied by the user - hence the user is
 * asked if they wish to proceed, and if so, the targets can be removed.
 * @param initialValue the initial value for the observable.
 * @param vetoCheck a function or string that will be invoked when the value of the vetoableObservable changes.  Returning
 * false from this function will disallow the change.  If a string is supplied, it is used as the question text
 * for a window.confirm function.
 * @param noVetoCallback this callback will be invoked when a change to the vetoableObservable is allowed.
 * @param vetoCallback this callback will be invoked when a change to the vetoableObservable is disallowed (has been vetoed).
 * @returns {*}
 */
ko.vetoableObservable = function(initialValue, vetoCheck, noVetoCallback, vetoCallback) {
    //private variables
    var _current = ko.observable(initialValue);

    var vetoFunction = typeof (vetoCheck) === 'function' ? vetoCheck : function() {
        return window.confirm(vetoCheck);
    };
    var result = ko.dependentObservable({
        read: _current,
        write: function(newValue) {

            // The equality check is treating undefined as equal to an empty string to prevent
            // the initial population of the value with an empty select option from triggering the veto.
            if (_current() !== newValue && (_current() !== undefined || newValue !== '')) {

                if (vetoFunction()) {
                    _current(newValue);
                    if (noVetoCallback !== undefined) {
                        noVetoCallback();
                    }
                }
                else {
                    _current.notifySubscribers();
                    if (vetoCallback !== undefined) {
                        vetoCallback();
                    }
                }
            }

        }
    });

    return result;
};

/**
 * Attaches a bootstrap popover to the bound element.  The details for the popover should be supplied as the
 * value of this binding.
 * e.g.  <a href="#" data-bind="popover: {title:"Popover title", content:"Popover content"}>My link with popover</a>
 *
 * The content and title must be supplied, other popover options have defaults.
 *
 */
ko.bindingHandlers.popover = {

    init: function(element, valueAccessor) {
        ko.bindingHandlers.popover.initPopover(element, valueAccessor);
    },
    update: function(element, valueAccessor) {

        var $element = $(element);
        $element.popover('destroy');
        var options = ko.bindingHandlers.popover.initPopover(element, valueAccessor);
        if (options.autoShow) {
            if ($element.data('firstPopover') === false) {
                $element.popover('show');
                $('body').on('click', function(e) {

                    if (e.target != element && $element.find(e.target).length == 0) {
                        $element.popover('hide');
                    }
                });
            }
            $element.data('firstPopover', false);
        }

    },

    defaultOptions: {
        placement: "right",
        animation: true,
        html: true,
        trigger: "hover"
    },

    initPopover: function(element, valueAccessor) {
        var options = ko.utils.unwrapObservable(valueAccessor());

        var combinedOptions = ko.utils.extend({}, ko.bindingHandlers.popover.defaultOptions);
        var content = ko.utils.unwrapObservable(options.content);
        ko.utils.extend(combinedOptions, options);
        combinedOptions.description = content;

        $(element).popover(combinedOptions);

        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            $(element).popover("destroy");
        });
        return options;
    }
};

ko.bindingHandlers.independentlyValidated = {
    init: function(element, valueAccessor) {
        $(element).addClass('validationEngineContainer');
        $(element).find('thead').attr('data-validation-engine', 'validate'); // Horrible hack.
        $(element).validationEngine('attach', {scroll:false});
    }
};

/**
 *
 * @param target the knockoutjs object being extended.
 * @param options {currencySymbol, decimalSeparator, thousandsSeparator}
 */
ko.extenders.currency = function(target, options) {

    var symbol, d,t;
    if (options !== undefined) {
        symbol = options.currencySymbol;
        d = options.decimalSeparator;
        t = options.thousandsSeparator;
    }
    target.formattedCurrency = ko.computed(function() {
        var n = target(),
            c = isNaN(c = Math.abs(c)) ? 2 : c,
            d = d == undefined ? "." : d,
            t = t == undefined ? "," : t,
            s = n < 0 ? "-" : "",
            sym = symbol == undefined ? "$" : symbol,
            i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
            j = (j = i.length) > 3 ? j % 3 : 0;
        return sym + s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
    });
    return target;
};

// custom validator to ensure that only one of two fields is populated
function exclusive (field, rules, i, options) {
    var otherFieldId = rules[i+2], // get the id of the other field
        otherValue = $('#'+otherFieldId).val(),
        thisValue = field.val(),
        message = rules[i+3];
    // checking thisValue is technically redundant as this validator is only called
    // if there is a value in the field
    if (otherValue !== '' && thisValue !== '') {
        return message;
    } else {
        return true;
    }
};

/**
 * Converts markdown formatted text into html, filters an allowed list of tags.  (To prevent script injection).
 * @param target the knockout observable holding the text.
 * @param options unused.
 * @returns {*}
 */
ko.extenders.markdown = function(target, options) {
    var converter = new window.Showdown.converter();
    var filterOptions = window.WMDEditor.defaults.tagFilter;

    target.markdownToHtml = ko.computed(function() {
        var text = target();
        if (text) {
            text = text.replace(/<[^<>]*>?/gi, function (tag) {
                return (tag.match(filterOptions.allowedTags) || tag.match(filterOptions.patternLink) || tag.match(filterOptions.patternImage)) ? tag : "";
            });
        }
        else {
            text = '';
        }
        return converter.makeHtml(text);
    });
    return target;
};


ko.bindingHandlers.stagedImageUpload = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {

        var defaultConfig = {
            maxWidth: 300,
            minWidth:150,
            minHeight:150,
            maxHeight: 300,
            previewSelector: '.preview'
        };
        var size = ko.observable();
        var progress = ko.observable();
        var error = ko.observable();
        var complete = ko.observable(true);

        var uploadProperties = {
            size: size,
            progress: progress,
            error:error,
            complete:complete
        };
        var innerContext = bindingContext.createChildContext(bindingContext);
        ko.utils.extend(innerContext, uploadProperties);

        var target = valueAccessor();
        var $elem = $(element);
        var role = $elem.data('role');
        var ownerKey = $elem.data('owner-type');
        var ownerValue = $elem.data('owner-id');
        var url = $elem.data('url');
        var owner = {};
        owner[ownerKey] = ownerValue;
        var config = {
            url:url,
            role: role,
            owner:owner
        };
        config = $.extend({}, defaultConfig, config);

         // Expected to be a ko.observableArray
        $(element).fileupload({
            url:config.url,
            autoUpload:true,
            forceIframeTransport: true
        }).on('fileuploadadd', function(e, data) {
            complete(false);
            progress(1);
        }).on('fileuploadprocessalways', function(e, data) {
            if (data.files[0].preview) {
                if (config.previewSelector !== undefined) {
                    var previewElem = $(element).parent().find(config.previewSelector);
                    previewElem.append(data.files[0].preview);
                }
            }
        }).on('fileuploadprogressall', function(e, data) {
            progress(Math.floor(data.loaded / data.total * 100));
            size(data.total);
        }).on('fileuploaddone', function(e, data) {

            var resultText = $('pre', data.result).text();
            var result = $.parseJSON(resultText);

            if (!result) {
                result = {};
                error('No response from server');
            }

            if (result.files[0]) {
                target.push(ko.bindingHandlers.stagedImageUpload.toDocument(result.files[0], config));
                complete(true);
            }
            else {
                error(result.error);
            }

        }).on('fileuploadfail', function(e, data) {
            error(data.errorThrown);
        });

        ko.applyBindingsToDescendants(innerContext, element);

        return { controlsDescendantBindings: true };
    },
    toDocument:function(f, config) {

        var data = {
            thumbnailUrl: f.thumbnail_url,
            url: f.url,
            contentType: f.contentType,
            filename: f.name,
            filesize: f.size,
            dateTaken: f.isoDate,
            lat: f.decimalLatitude,
            lng: f.decimalLongitude,
            name: f.name,
            type: 'image',
            role:config.role
        };

        return $.extend({}, data, config.owner);
    }
};

var ACTIVITY_PROGRESS_CLASSES = {
    'planned':'btn-warning',
    'started':'btn-success',
    'finished':'btn-info',
    'deferred':'btn-danger',
    'cancelled':'btn-inverse'
};

ko.bindingHandlers.activityProgress = {
    update: function(element, valueAccessor) {
        var progressValue = ko.utils.unwrapObservable(valueAccessor());

        for (progress in ACTIVITY_PROGRESS_CLASSES) {
            ko.utils.toggleDomNodeCssClass(element, ACTIVITY_PROGRESS_CLASSES[progress], progress === progressValue);
        }
    }
}

/** Returns a bootstrap class used to style activity progress labels */
function activityProgressClass(progress) {
    return ACTIVITY_PROGRESS_CLASSES[progress];
}

ko.bindingHandlers.numeric = {
    init: function (element, valueAccessor) {
        $(element).on("keydown", function (event) {
            // Allow: backspace, delete, tab, escape, and enter
            if (event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 || event.keyCode == 13 ||
                    // Allow: Ctrl+A
                (event.keyCode == 65 && event.ctrlKey === true) ||
                    // Allow: . ,
                (event.keyCode == 190 || event.keyCode == 110) ||
                    // Allow: home, end, left, right
                (event.keyCode >= 35 && event.keyCode <= 39)) {
                // let it happen, don't do anything
                return;
            }
            else {
                // Ensure that it is a number and stop the keypress
                if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105)) {
                    event.preventDefault();
                }
            }
        });
    }
};

/** Allows a subscription to an observable that passes both the old and new value to the callback */
ko.subscribable.fn.subscribeChanged = function (callback) {
    var savedValue = this.peek();
    return this.subscribe(function (latestValue) {
        var oldValue = savedValue;
        savedValue = latestValue;
        callback(latestValue, oldValue);
    });
};

ko.extenders.numericString = function(target, precision) {
    //create a writable computed observable to intercept writes to our observable
    var result = ko.computed({
        read: target,  //always return the original observables value
        write: function(newValue) {
            var val = newValue;
            if (typeof val === 'string') {
                val = newValue.replace(/,|\$/g, '');
            }
            var current = target(),
                roundingMultiplier = Math.pow(10, precision),
                newValueAsNum = isNaN(val) ? 0 : parseFloat(+val),
                valueToWrite = Math.round(newValueAsNum * roundingMultiplier) / roundingMultiplier;

            //only write if it changed
            if (valueToWrite.toString() !== current || isNaN(val)) {
                target(isNaN(val) ? newValue : valueToWrite.toString());
            }
            else {
                if (newValue !== current) {
                    target.notifySubscribers(valueToWrite.toString());
                }
            }
        }
    }).extend({ notify: 'always' });

    //initialize with current value to make sure it is rounded appropriately
    result(target());

    //return the new computed observable
    return result;
};

ko.extenders.url = function(target) {
    var result = ko.pureComputed({
        read:target,
        write: function(url) {
            var value = typeof url == 'string' && url.indexOf("://") < 0? ("http://" + url): url;
            target(value);
        }
    });
    result(target());
    return result;
};
/**
 * User: MEW
 * Date: 18/06/13
 * Time: 2:24 PM
 */

//iterates over the outputs specified in the meta-model and builds a temp object for
// each containing the name, and the scores and id of any matching outputs in the data
ko.bindingHandlers.foreachModelOutput = {
    init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        if (valueAccessor() === undefined) {
            var dummyRow = {name: 'No model was found for this activity', scores: [], outputId: '', editLink:''};
            ko.applyBindingsToNode(element, { foreach: [dummyRow] });
            return { controlsDescendantBindings: true };
        }
        var metaOutputs = ko.utils.unwrapObservable(valueAccessor()),// list of String names of outputs
            activity = bindingContext.$data,// activity data
            transformedOutputs = [];//created list of temp objects

        $.each(metaOutputs, function (i, name) { // for each output name
            var scores = [],
                outputId = '',
                editLink = fcConfig.serverUrl + "/output/";

            // search for corresponding outputs in the data
            $.each(activity.outputs(), function (i,output) { // iterate output data in the activity to
                                                             // find any matching the meta-model name
                if (output.name === name) {
                    outputId = output.outputId;
                    $.each(output.scores, function (k, v) {
                        scores.push({key: k, value: v});
                    });
                }
            });

            if (outputId) {
                // build edit link
                editLink += 'edit/' + outputId +
                    "?returnTo=" + returnTo;
            } else {
                // build create link
                editLink += 'create?activityId=' + activity.activityId +
                    '&outputName=' + encodeURIComponent(name) +
                    "&returnTo=" + returnTo;
            }
            // build the array that we will actually iterate over in the inner template
            transformedOutputs.push({name: name, scores: scores, outputId: outputId,
                editLink: editLink});
        });

        // re-cast the binding to iterate over our new array
        ko.applyBindingsToNode(element, { foreach: transformedOutputs });
        return { controlsDescendantBindings: true };
    }
};
ko.virtualElements.allowedBindings.foreachModelOutput = true;

// handle activity accordion
$('#activities').
    on('show', 'div.collapse', function() {
        $(this).parents('tr').prev().find('td:first-child a').empty()
            .html("&#9660;").attr('title','hide').parent('a').tooltip();
    }).
    on('hide', 'div.collapse', function() {
        $(this).parents('tr').prev().find('td:first-child a').empty()
            .html("&#9658;").attr('title','expand');
    }).
    on('shown', 'div.collapse', function() {
        trackState();
    }).
    on('hidden', 'div.collapse', function() {
        trackState();
    });

function trackState () {
    var $leaves = $('#activityList div.collapse'),
        state = [];
    $.each($leaves, function (i, leaf) {
        if ($(leaf).hasClass('in')) {
            state.push($(leaf).attr('id'));
        }
    });
    console.log('state stored = ' + state);
    amplify.store.sessionStorage('output-accordion-state',state);
}

function readState () {
    var $leaves = $('#activityList div.collapse'),
        state = amplify.store.sessionStorage('output-accordion-state'),
        id;
    console.log('state retrieved = ' + state);
    $.each($leaves, function (i, leaf) {
        id = $(leaf).attr('id');
        if (($.inArray(id, state) > -1)) {
            $(leaf).collapse('show');
        }
    });
}

var image = function(props) {

    var imageObj = {
        id:props.id,
        name:props.name,
        size:props.size,
        url: props.url,
        thumbnail_url: props.thumbnail_url,
        viewImage : function() {
            window['showImageInViewer'](this.id, this.url, this.name);
        }
    };
    return imageObj;
};

ko.bindingHandlers.photoPoint = {
    init: function(element, valueAccessor) {

    }
}


ko.bindingHandlers.photoPointUpload = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {

        var defaultConfig = {
            maxWidth: 300,
            minWidth:150,
            minHeight:150,
            maxHeight: 300,
            previewSelector: '.preview'
        };
        var size = ko.observable();
        var progress = ko.observable();
        var error = ko.observable();
        var complete = ko.observable(true);

        var uploadProperties = {

            size: size,
            progress: progress,
            error:error,
            complete:complete

        };
        var innerContext = bindingContext.createChildContext(bindingContext);
        ko.utils.extend(innerContext, uploadProperties);

        var config = valueAccessor();
        config = $.extend({}, config, defaultConfig);

        var target = config.target; // Expected to be a ko.observableArray
        $(element).fileupload({
            url:config.url,
            autoUpload:true,
            forceIframeTransport: true
        }).on('fileuploadadd', function(e, data) {
            complete(false);
            progress(1);
        }).on('fileuploadprocessalways', function(e, data) {
            if (data.files[0].preview) {
                if (config.previewSelector !== undefined) {
                    var previewElem = $(element).parent().find(config.previewSelector);
                    previewElem.append(data.files[0].preview);
                }
            }
        }).on('fileuploadprogressall', function(e, data) {
            progress(Math.floor(data.loaded / data.total * 100));
            size(data.total);
        }).on('fileuploaddone', function(e, data) {

//            var resultText = $('pre', data.result).text();
//            var result = $.parseJSON(resultText);


            var result = data.result;
            if (!result) {
                result = {};
                error('No response from server');
            }

            if (result.files[0]) {
                target.push(result.files[0]);
                complete(true);
            }
            else {
                error(result.error);
            }

        }).on('fileuploadfail', function(e, data) {
            error(data.errorThrown);
        });

        ko.applyBindingsToDescendants(innerContext, element);

        return { controlsDescendantBindings: true };
    }
};

ko.bindingHandlers.imageUpload = {
    init: function(element, valueAccessor) {

        var config = {autoUpload:true};
        var observable;
        var params = valueAccessor();
        if (ko.isObservable(params)) {
            observable = params;
        }
        else {
            observable = params.target;
            $.extend(config, params.config);
        }

        var addCallbacks = function() {
            // The upload URL is specified using the data-url attribute to allow it to be easily pulled from the
            // application configuration.
            $(element).fileupload('option', 'completed', function(e, data) {
                if (data.result && data.result.files) {
                    $.each(data.result.files, function(index, obj) {
                        if (observable.hasOwnProperty('push')) {
                            observable.push(image(obj));
                        }
                        else {
                            observable(image(obj))
                        }
                    });
                }
            });
            $(element).fileupload('option', 'destroyed', function(e, data) {
                var filename = $(e.currentTarget).attr('data-filename');

                if (observable.hasOwnProperty('remove')) {
                    var images = observable();

                    // We rely on the template rendering the filename into the delete button so we can identify which
                    // object has been deleted.
                    $.each(images, function(index, obj) {
                        if (obj.name === filename) {
                            observable.remove(obj);
                            return false;
                        }
                    });
                }
                else {
                    observable({})
                }
            });

        };

        $(element).fileupload(config);

        var value = ko.utils.unwrapObservable(observable);
        var isArray = value.hasOwnProperty('length');

        if ((isArray && value.length > 0) || (!isArray && value['name'] !== undefined)) {
            // Render the existing model items - we are currently storing all of the metadata needed by the
            // jquery-file-upload plugin in the model but we should probably only store the core data and decorate
            // it in the templating code (e.g. the delete URL and HTTP method).
            $(element).fileupload('option', 'completed', function(e, data) {
                addCallbacks();
            });
            var data = {result:{}};
            if (isArray)  {
                data.result.files = value
            }
            else {
                data.result.files = [value];
            }
            var doneFunction = $(element).fileupload('option', 'done');
            var e = {isDefaultPrevented:function(){return false;}};

            doneFunction.call(element, e, data);
        }
        else {
            addCallbacks();
        }

        // Enable iframe cross-domain access via redirect option:
        $(element).fileupload(
            'option',
            'redirect',
            window.location.href.replace(
                /\/[^\/]*$/,
                '/cors/result.html?%s'
            )
        );

    }

};

ko.bindingHandlers.editDocument = {
    init:function(element, valueAccessor) {
        if (ko.isObservable(valueAccessor())) {
            var document = ko.utils.unwrapObservable(valueAccessor());
            if (typeof document.status == 'function') {
                document.status.subscribe(function(status) {
                    if (status == 'deleted') {
                        valueAccessor()(null);
                    }
                });
            }
        }
        var options = {
            name:'documentEditTemplate',
            data:valueAccessor()
        };
        return ko.bindingHandlers['template'].init(element, function() {return options;});
    },
    update:function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var options = {
            name:'documentEditTemplate',
            data:valueAccessor()
        };
        ko.bindingHandlers['template'].update(element, function() {return options;}, allBindings, viewModel, bindingContext);
    }
}

