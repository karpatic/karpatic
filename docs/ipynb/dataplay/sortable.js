window.sortable=function(){"use strict";function addData(e,t,r){if(void 0===r)return e&&e.h5s&&e.h5s.data&&e.h5s.data[t];e.h5s=e.h5s||{},e.h5s.data=e.h5s.data||{},e.h5s.data[t]=r}var filter=function(e,t){if(!(e instanceof NodeList||e instanceof HTMLCollection||e instanceof Array))throw new Error("You must provide a nodeList/HTMLCollection/Array of elements to be filtered.");return"string"!=typeof t?Array.from(e):Array.from(e).filter((function(e){return 1===e.nodeType&&e.matches(t)}))},e=new Map,t=function(){function Store(){this._config=new Map,this._placeholder=void 0,this._data=new Map}return Object.defineProperty(Store.prototype,"config",{get:function(){var e={};return this._config.forEach((function(t,r){e[r]=t})),e},set:function(e){if("object"!=typeof e)throw new Error("You must provide a valid configuration object to the config setter.");var t=Object.assign({},e);this._config=new Map(Object.entries(t))},enumerable:!1,configurable:!0}),Store.prototype.setConfig=function(e,t){if(!this._config.has(e))throw new Error("Trying to set invalid configuration item: "+e);this._config.set(e,t)},Store.prototype.getConfig=function(e){if(!this._config.has(e))throw new Error("Invalid configuration item requested: "+e);return this._config.get(e)},Object.defineProperty(Store.prototype,"placeholder",{get:function(){return this._placeholder},set:function(e){if(!(e instanceof HTMLElement)&&null!==e)throw new Error("A placeholder must be an html element or null.");this._placeholder=e},enumerable:!1,configurable:!0}),Store.prototype.setData=function(e,t){if("string"!=typeof e)throw new Error("The key must be a string.");this._data.set(e,t)},Store.prototype.getData=function(e){if("string"!=typeof e)throw new Error("The key must be a string.");return this._data.get(e)},Store.prototype.deleteData=function(e){if("string"!=typeof e)throw new Error("The key must be a string.");return this._data.delete(e)},Store}(),store=function(r){if(!(r instanceof HTMLElement))throw new Error("Please provide a sortable to the store function.");return e.has(r)||e.set(r,new t),e.get(r)};function addEventListener(e,t,r){if(e instanceof Array)for(var n=0;n<e.length;++n)addEventListener(e[n],t,r);else e.addEventListener(t,r),store(e).setData("event"+t,r)}function removeEventListener(e,t){if(e instanceof Array)for(var r=0;r<e.length;++r)removeEventListener(e[r],t);else e.removeEventListener(t,store(e).getData("event"+t)),store(e).deleteData("event"+t)}function addAttribute(e,t,r){if(e instanceof Array)for(var n=0;n<e.length;++n)addAttribute(e[n],t,r);else e.setAttribute(t,r)}function removeAttribute(e,t){if(e instanceof Array)for(var r=0;r<e.length;++r)removeAttribute(e[r],t);else e.removeAttribute(t)}var offset=function(e){if(!e.parentElement||0===e.getClientRects().length)throw new Error("target element must be part of the dom");var t=e.getClientRects()[0];return{left:t.left+window.pageXOffset,right:t.right+window.pageXOffset,top:t.top+window.pageYOffset,bottom:t.bottom+window.pageYOffset}},getIndex=function(e,t){if(!(e instanceof HTMLElement&&(t instanceof NodeList||t instanceof HTMLCollection||t instanceof Array)))throw new Error("You must provide an element and a list of elements.");return Array.from(t).indexOf(e)},isInDom=function(e){if(!(e instanceof HTMLElement))throw new Error("Element is not a node element.");return null!==e.parentNode},insertNode=function(e,t,r){if(!(e instanceof HTMLElement&&e.parentElement instanceof HTMLElement))throw new Error("target and element must be a node");e.parentElement.insertBefore(t,"before"===r?e:e.nextElementSibling)},getElementHeight=function(e){if(!(e instanceof HTMLElement))throw new Error("You must provide a valid dom element");var t=window.getComputedStyle(e);return"border-box"===t.getPropertyValue("box-sizing")?parseInt(t.getPropertyValue("height"),10):["height","padding-top","padding-bottom"].map((function(e){var r=parseInt(t.getPropertyValue(e),10);return isNaN(r)?0:r})).reduce((function(e,t){return e+t}))},getElementWidth=function(e){if(!(e instanceof HTMLElement))throw new Error("You must provide a valid dom element");var t=window.getComputedStyle(e);return["width","padding-left","padding-right"].map((function(e){var r=parseInt(t.getPropertyValue(e),10);return isNaN(r)?0:r})).reduce((function(e,t){return e+t}))},getHandles=function(e,t){if(!(e instanceof Array))throw new Error("You must provide a Array of HTMLElements to be filtered.");return"string"!=typeof t?e:e.filter((function(e){return e.querySelector(t)instanceof HTMLElement||e.shadowRoot&&e.shadowRoot.querySelector(t)instanceof HTMLElement})).map((function(e){return e.querySelector(t)||e.shadowRoot&&e.shadowRoot.querySelector(t)}))},getEventTarget=function(e){return e.composedPath&&e.composedPath()[0]||e.target},defaultDragImage=function(e,t,r){return{element:e,posX:r.pageX-t.left,posY:r.pageY-t.top}},listsConnected=function(e,t){if(!0===e.isSortable){var r=store(e).getConfig("acceptFrom");if(null!==r&&!1!==r&&"string"!=typeof r)throw new Error('HTML5Sortable: Wrong argument, "acceptFrom" must be "null", "false", or a valid selector string.');if(null!==r)return!1!==r&&r.split(",").filter((function(e){return e.length>0&&t.matches(e)})).length>0;if(e===t)return!0;if(void 0!==store(e).getConfig("connectWith")&&null!==store(e).getConfig("connectWith"))return store(e).getConfig("connectWith")===store(t).getConfig("connectWith")}return!1},r={items:null,connectWith:null,disableIEFix:null,acceptFrom:null,copy:!1,placeholder:null,placeholderClass:"sortable-placeholder",draggingClass:"sortable-dragging",hoverClass:!1,dropTargetContainerClass:!1,debounce:0,throttleTime:100,maxItems:0,itemSerializer:void 0,containerSerializer:void 0,customDragImage:null,orientation:"vertical"};var n,o,a,i,l,s,d,c,f,enableHoverClass=function(e,t){if("string"==typeof store(e).getConfig("hoverClass")){var r=store(e).getConfig("hoverClass").split(" ");!0===t?(addEventListener(e,"mousemove",function throttle(e,t){var r=this;if(void 0===t&&(t=250),"function"!=typeof e)throw new Error("You must provide a function as the first argument for throttle.");if("number"!=typeof t)throw new Error("You must provide a number as the second argument for throttle.");var n=null;return function(){for(var o=[],a=0;a<arguments.length;a++)o[a]=arguments[a];var i=Date.now();(null===n||i-n>=t)&&(n=i,e.apply(r,o))}}((function(t){0===t.buttons&&filter(e.children,store(e).getConfig("items")).forEach((function(e){var n,o;e===t.target||e.contains(t.target)?(n=e.classList).add.apply(n,r):(o=e.classList).remove.apply(o,r)}))}),store(e).getConfig("throttleTime"))),addEventListener(e,"mouseleave",(function(){filter(e.children,store(e).getConfig("items")).forEach((function(e){var t;(t=e.classList).remove.apply(t,r)}))}))):(removeEventListener(e,"mousemove"),removeEventListener(e,"mouseleave"))}},removeItemEvents=function(e){removeEventListener(e,"dragstart"),removeEventListener(e,"dragend"),removeEventListener(e,"dragover"),removeEventListener(e,"dragenter"),removeEventListener(e,"drop"),removeEventListener(e,"mouseenter"),removeEventListener(e,"mouseleave")},removeContainerEvents=function(e,t){e&&removeEventListener(e,"dragleave"),t&&t!==e&&removeEventListener(t,"dragleave")},removeSortableData=function(e){!function removeData(e){e.h5s&&delete e.h5s.data}(e),removeAttribute(e,"aria-dropeffect")},removeItemData=function(e){removeAttribute(e,"aria-grabbed"),removeAttribute(e,"aria-copied"),removeAttribute(e,"draggable"),removeAttribute(e,"role")};function findSortable(e,t){if(t.composedPath)return t.composedPath().find((function(e){return e.isSortable}));for(;!0!==e.isSortable;)e=e.parentElement;return e}function findDragElement(e,t){var r=addData(e,"opts"),n=filter(e.children,r.items).filter((function(e){return e.contains(t)||e.shadowRoot&&e.shadowRoot.contains(t)}));return n.length>0?n[0]:t}var enableSortable=function(e){var t=addData(e,"opts"),r=filter(e.children,t.items),n=getHandles(r,t.handle);(addAttribute(e,"aria-dropeffect","move"),addData(e,"_disabled","false"),addAttribute(n,"draggable","true"),enableHoverClass(e,!0),!1===t.disableIEFix)&&("function"==typeof(document||window.document).createElement("span").dragDrop&&addEventListener(n,"mousedown",(function(){if(-1!==r.indexOf(this))this.dragDrop();else{for(var e=this.parentElement;-1===r.indexOf(e);)e=e.parentElement;e.dragDrop()}})))};function sortable(t,u){var m=String(u);return u=u||{},"string"==typeof t&&(t=document.querySelectorAll(t)),t instanceof HTMLElement&&(t=[t]),t=Array.prototype.slice.call(t),/serialize/.test(m)?t.map((function(e){var t=addData(e,"opts");return function(e,t,r){if(void 0===t&&(t=function(e,t){return e}),void 0===r&&(r=function(e){return e}),!(e instanceof HTMLElement)||1==!e.isSortable)throw new Error("You need to provide a sortableContainer to be serialized.");if("function"!=typeof t||"function"!=typeof r)throw new Error("You need to provide a valid serializer for items and the container.");var n=addData(e,"opts").items,o=filter(e.children,n),a=o.map((function(t){return{parent:e,node:t,html:t.outerHTML,index:getIndex(t,o)}}));return{container:r({node:e,itemCount:a.length}),items:a.map((function(r){return t(r,e)}))}}(e,t.itemSerializer,t.containerSerializer)})):(t.forEach((function(t){if(/enable|disable|destroy/.test(m))return sortable[m](t);["connectWith","disableIEFix"].forEach((function(e){Object.prototype.hasOwnProperty.call(u,e)&&null!==u[e]&&console.warn('HTML5Sortable: You are using the deprecated configuration "'+e+'". This will be removed in an upcoming version, make sure to migrate to the new options when updating.')})),u=Object.assign({},r,store(t).config,u),store(t).config=u,addData(t,"opts",u),t.isSortable=!0,function(e){var t=addData(e,"opts"),r=filter(e.children,t.items),n=getHandles(r,t.handle);addData(e,"_disabled","false"),removeItemEvents(r),removeContainerEvents(i,c),removeEventListener(n,"mousedown"),removeEventListener(e,"dragover"),removeEventListener(e,"dragenter"),removeEventListener(e,"drop")}(t);var p,v=filter(t.children,u.items);if(null!==u.placeholder&&void 0!==u.placeholder){var g=document.createElement(t.tagName);u.placeholder instanceof HTMLElement?g.appendChild(u.placeholder):g.innerHTML=u.placeholder,p=g.children[0]}store(t).placeholder=function(e,t,r){var n;if(void 0===r&&(r="sortable-placeholder"),!(e instanceof HTMLElement))throw new Error("You must provide a valid element as a sortable.");if(!(t instanceof HTMLElement)&&void 0!==t)throw new Error("You must provide a valid element as a placeholder or set ot to undefined.");return void 0===t&&(["UL","OL"].includes(e.tagName)?t=document.createElement("li"):["TABLE","TBODY"].includes(e.tagName)?(t=document.createElement("tr")).innerHTML='<td colspan="100"></td>':t=document.createElement("div")),"string"==typeof r&&(n=t.classList).add.apply(n,r.split(" ")),t}(t,p,u.placeholderClass),addData(t,"items",u.items),u.acceptFrom?addData(t,"acceptFrom",u.acceptFrom):u.connectWith&&addData(t,"connectWith",u.connectWith),enableSortable(t),addAttribute(v,"role","option"),addAttribute(v,"aria-grabbed","false"),addEventListener(t,"dragstart",(function(e){var t=getEventTarget(e);if(!0!==t.isSortable&&(e.stopImmediatePropagation(),(!u.handle||t.matches(u.handle))&&"false"!==t.getAttribute("draggable"))){var r=findSortable(t,e),c=findDragElement(r,t);d=filter(r.children,u.items),l=d.indexOf(c),s=getIndex(c,r.children),i=r,function(e,t,r){if(!(e instanceof Event))throw new Error("setDragImage requires a DragEvent as the first argument.");if(!(t instanceof HTMLElement))throw new Error("setDragImage requires the dragged element as the second argument.");if(r||(r=defaultDragImage),e.dataTransfer&&e.dataTransfer.setDragImage){var n=r(t,offset(t),e);if(!(n.element instanceof HTMLElement)||"number"!=typeof n.posX||"number"!=typeof n.posY)throw new Error("The customDragImage function you provided must return and object with the properties element[string], posX[integer], posY[integer].");e.dataTransfer.effectAllowed="copyMove",e.dataTransfer.setData("text/plain",getEventTarget(e).id),e.dataTransfer.setDragImage(n.element,n.posX,n.posY)}}(e,c,u.customDragImage),o=getElementHeight(c),a=getElementWidth(c),c.classList.add(u.draggingClass),n=function(e,t){var r=e;return!0===store(t).getConfig("copy")&&(addAttribute(r=e.cloneNode(!0),"aria-copied","true"),e.parentElement.appendChild(r),r.style.display="none",r.oldDisplay=e.style.display),r}(c,r),addAttribute(n,"aria-grabbed","true"),r.dispatchEvent(new CustomEvent("sortstart",{detail:{origin:{elementIndex:s,index:l,container:i},item:n,originalTarget:t}}))}})),addEventListener(t,"dragenter",(function(e){var r=getEventTarget(e),o=findSortable(r,e);o&&o!==c&&(f=filter(o.children,addData(o,"items")).filter((function(e){return e!==store(t).placeholder})),u.dropTargetContainerClass&&o.classList.add(u.dropTargetContainerClass),o.dispatchEvent(new CustomEvent("sortenter",{detail:{origin:{elementIndex:s,index:l,container:i},destination:{container:o,itemsBeforeUpdate:f},item:n,originalTarget:r}})),addEventListener(o,"dragleave",(function(e){var t=e.relatedTarget||e.fromElement;e.currentTarget.contains(t)||(u.dropTargetContainerClass&&o.classList.remove(u.dropTargetContainerClass),o.dispatchEvent(new CustomEvent("sortleave",{detail:{origin:{elementIndex:s,index:l,container:o},item:n,originalTarget:r}})))}))),c=o})),addEventListener(t,"dragend",(function(r){if(n){n.classList.remove(u.draggingClass),addAttribute(n,"aria-grabbed","false"),"true"===n.getAttribute("aria-copied")&&"true"!==addData(n,"dropped")&&n.remove(),void 0!==n.oldDisplay&&(n.style.display=n.oldDisplay,delete n.oldDisplay);var d=Array.from(e.values()).map((function(e){return e.placeholder})).filter((function(e){return e instanceof HTMLElement})).filter(isInDom)[0];d&&d.remove(),t.dispatchEvent(new CustomEvent("sortstop",{detail:{origin:{elementIndex:s,index:l,container:i},item:n}})),c=null,n=null,o=null,a=null}})),addEventListener(t,"drop",(function(r){if(listsConnected(t,n.parentElement)){r.preventDefault(),r.stopPropagation(),addData(n,"dropped","true");var o=Array.from(e.values()).map((function(e){return e.placeholder})).filter((function(e){return e instanceof HTMLElement})).filter(isInDom)[0];if(o){o.replaceWith(n),void 0!==n.oldDisplay&&(n.style.display=n.oldDisplay,delete n.oldDisplay),t.dispatchEvent(new CustomEvent("sortstop",{detail:{origin:{elementIndex:s,index:l,container:i},item:n}}));var a=store(t).placeholder,c=filter(i.children,u.items).filter((function(e){return e!==a})),m=!0===this.isSortable?this:this.parentElement,p=filter(m.children,addData(m,"items")).filter((function(e){return e!==a})),v=getIndex(n,Array.from(n.parentElement.children).filter((function(e){return e!==a}))),g=getIndex(n,p);u.dropTargetContainerClass&&m.classList.remove(u.dropTargetContainerClass),s===v&&i===m||t.dispatchEvent(new CustomEvent("sortupdate",{detail:{origin:{elementIndex:s,index:l,container:i,itemsBeforeUpdate:d,items:c},destination:{index:g,elementIndex:v,container:m,itemsBeforeUpdate:f,items:p},item:n}}))}else addData(n,"dropped","false")}}));var h,E,b,y=(h=function(t,r,i,l){if(n)if(u.forcePlaceholderSize&&(store(t).placeholder.style.height=o+"px",store(t).placeholder.style.width=a+"px"),Array.from(t.children).indexOf(r)>-1){var s=getElementHeight(r),d=getElementWidth(r),c=getIndex(store(t).placeholder,r.parentElement.children),f=getIndex(r,r.parentElement.children);if(s>o||d>a){var m=s-o,p=d-a,v=offset(r).top,g=offset(r).left;if(c<f&&("vertical"===u.orientation&&l<v||"horizontal"===u.orientation&&i<g))return;if(c>f&&("vertical"===u.orientation&&l>v+s-m||"horizontal"===u.orientation&&i>g+d-p))return}void 0===n.oldDisplay&&(n.oldDisplay=n.style.display),"none"!==n.style.display&&(n.style.display="none");var h=!1;try{var E=offset(r).top+r.offsetHeight/2,b=offset(r).left+r.offsetWidth/2;h="vertical"===u.orientation&&l>=E||"horizontal"===u.orientation&&i>=b}catch(e){h=c<f}h?function(e,t){insertNode(e,t,"after")}(r,store(t).placeholder):function(e,t){insertNode(e,t,"before")}(r,store(t).placeholder),Array.from(e.values()).filter((function(e){return void 0!==e.placeholder})).forEach((function(e){e.placeholder!==store(t).placeholder&&e.placeholder.remove()}))}else{var y=Array.from(e.values()).filter((function(e){return void 0!==e.placeholder})).map((function(e){return e.placeholder}));-1!==y.indexOf(r)||t!==r||filter(r.children,u.items).length||(y.forEach((function(e){return e.remove()})),r.appendChild(store(t).placeholder))}},void 0===(E=u.debounce)&&(E=0),function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];clearTimeout(b),b=setTimeout((function(){h.apply(void 0,e)}),E)}),onDragOverEnter=function(e){var t=e.target,r=!0===t.isSortable?t:findSortable(t,e);if(t=findDragElement(r,t),n&&listsConnected(r,n.parentElement)&&"true"!==addData(r,"_disabled")){var o=addData(r,"opts");parseInt(o.maxItems)&&filter(r.children,addData(r,"items")).length>parseInt(o.maxItems)&&n.parentElement!==r||(e.preventDefault(),e.stopPropagation(),e.dataTransfer.dropEffect=!0===store(r).getConfig("copy")?"copy":"move",y(r,t,e.pageX,e.pageY))}};addEventListener(v.concat(t),"dragover",onDragOverEnter),addEventListener(v.concat(t),"dragenter",onDragOverEnter)})),t)}return sortable.destroy=function(e){!function(e){var t=addData(e,"opts")||{},r=filter(e.children,t.items),n=getHandles(r,t.handle);enableHoverClass(e,!1),removeEventListener(e,"dragover"),removeEventListener(e,"dragenter"),removeEventListener(e,"dragstart"),removeEventListener(e,"dragend"),removeEventListener(e,"drop"),removeSortableData(e),removeEventListener(n,"mousedown"),removeItemEvents(r),removeItemData(r),removeContainerEvents(i,c),e.isSortable=!1}(e)},sortable.enable=function(e){enableSortable(e)},sortable.disable=function(e){!function(e){var t=addData(e,"opts"),r=filter(e.children,t.items),n=getHandles(r,t.handle);addAttribute(e,"aria-dropeffect","none"),addData(e,"_disabled","true"),addAttribute(n,"draggable","false"),removeEventListener(n,"mousedown"),enableHoverClass(e,!1)}(e)},sortable.__testing={data:addData,removeItemEvents:removeItemEvents,removeItemData:removeItemData,removeSortableData:removeSortableData,removeContainerEvents:removeContainerEvents},sortable}();