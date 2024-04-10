console.log('start233');
window.labels = {}


window.setMapping = function(label, vizid, viztype, rows, cols) {
    let record = window.labels[label]
    record ||= {};
    record.mappings ||= [];
    Object.keys(window.labels).forEach(lblKey => {
        // Remove mappings for vizId if it is not the current label
        window.labels[lblKey].mappings = window.labels[lblKey].mappings?.filter(mapping => {
            if (mapping.vizid === vizid && lblKey !== label) {
                return false;
            }

            // 
            !(mapping.vizid === vizid && (lblKey !== label || (viztype ||= mapping.viztype)))
        });
    });
    console.log('setMapping:', {label, vizid, viztype, rows, cols}); 
    record.mappings.push({ label, vizid, viztype, rows, cols });
};

window.setMapping = function(label, vizid, viztype, rows, cols) {
    let record = window.labels[label] || {};
    record.mappings = record.mappings || [];
    let oldMapping = {}

    // Clear conflicting mappings
    Object.keys(window.labels).forEach(lblKey => { 
        window.labels[lblKey].mappings = window.labels[lblKey].mappings.filter(mapping => {
            let sameId = mapping.vizid == vizid;
            let sameLabel = lblKey == label; 
            if(!sameId) { return true; } // not sameId, keep it
            if(!sameLabel) { return false; } // sameId but different label, remove it. 
            oldMapping = mapping;
            return false // It's the record we want but we'll just copy the values and remove it.
        });
    });

    // Determine the new mapping values
    let newMapping = {
        label, 
        vizid, 
        viztype: viztype ? viztype : (oldMapping.viztype || 'Table'),
        rows: rows !== false ? rows : (oldMapping.rows || ''),
        cols: cols !== false ? cols : (oldMapping.cols || '')
    };

    // Add the new mapping
    record.mappings.push(newMapping);

    console.log('setMapping:', newMapping);
};



window.unsetMapping = function(vizid) {
    console.log('unsetting:', vizid); 
    Object.keys(window.labels).forEach(lblKey => 
        window.labels[lblKey].mappings = window.labels[lblKey].mappings?.filter(mapping => 
            mapping.vizid !== vizid)
    );
    document.getElementById(vizid)?.remove();
};

window.setData = function(label, data) {
    console.log('SetData:', label, data); 
    // link data to a label
    window.labels[label] ||= {}
    window.labels[label].data = data
};

window.setVizType = function(vizid, viztype, rows, cols) {
    console.log('SetVizType:', {vizid, viztype, rows, cols});
    window.labels?.forEach(label => { 
        label.mappings.forEach(mapping => {
            if (mapping.vizid === vizid || label == vizid) {
                console.log('SetVizType: found mapping', mapping.vizType, viztype)
                // Update 'viztype' if the value is not false; otherwise, set default if not present
                if (viztype !== false) { mapping.viztype = viztype; } 
                else if (!mapping.viztype) { mapping.viztype = 'Table'; }
                // Update 'rows' and 'cols' if the value is not false; otherwise, set defaults if not present
                mapping.rows = rows !== false ? rows : (mapping.rows ?? '');
                mapping.cols = cols !== false ? cols : (mapping.cols ?? '');
            }
        });
    });
}


window.update = function({ label, vizid, viztype, ds, unset, rows, cols} = {}) {
    console.log('update: ', {label, vizid, viztype, ds, unset, rows, cols})
    if(!label){ 
        if(unset){ window.unsetMapping(vizid) } 
        else{ window.setVizType(vizid, viztype, rows, cols) }
    }
    else{
        // Update Data
        if(ds){ window.setData(label, ds) }

        // Update Visual
        window.setMapping(label, vizid||label, viztype, rows, cols) 

        // Display
        window.displayElements(label);
    }
};

window.DELETEdisplayElementsDELETE = function(label) {
    console.log('displayElements: ', {label, lblobj:window.labels[label]} )
    // Display all Mappings 
    window.labels[label]?.mappings?.forEach(element => { 
        window.displayElement(
            window.labels[label].data, 
            element.vizid||label, 
            element.viztype, 
            element.rows,
            element.cols, 
        )
    }); 
}

window.displayElements = function(label) {
    console.log('displayElements: ', { label, lblobj: window.labels[label] });

    let record = window.labels[label];
    if (record) {
        let data = record.data;
        let mappings = record.mappings;

        if (mappings && mappings.length > 0) {
            mappings.forEach(element => {
                window.displayElement(
                    data, 
                    element.vizid || label, 
                    element.viztype, 
                    element.rows, 
                    element.cols
                );
            });
        } else {
            // Call displayElement with default parameters if mappings are not present
            window.displayElement(data, label, 'Table', '', '');
        }
    }
}


// Display a single element with dataset
window.displayElement = function(data, vizid=false, viztype='Table', rows='', cols='') {
    console.log('displayElement:', {vizid, viztype, rows, cols})
    vizid = vizid || 'dataplayVisual' + Math.round(Math.random() * 100).toString(); 
    window.callPivot(data, vizid, rows, cols, viztype)
};

window.callPivot = function(json_data, output_id, rows, cols, renderName) {
    console.log('callPivot:', {json_data, output_id, renderName, rows, cols})
    // Check if df is a label or if output_id maps to one.
    // Use window.labels[label].data if it exists
    // when a user pivots. update window.labels[label].mapping.rows / cols / viztype.  
    // check if element exists
    let exists = typeof window.pivotUI === "function";
    let parent = document.currentScript.parentElement;
    let fn = () => {
        let targetElement = document.getElementById(output_id);
        if (!targetElement) {
            targetElement = document.createElement('div');
            targetElement.id = output_id; 
            parent.appendChild(targetElement);
        }
        console.log({pivotUtilities})
        window.pivotUI(
            targetElement,
            json_data,
            {
                rows: rows,
                cols: cols,
                rendererName: renderName,
                showUI: true,
                renderers: Object.assign(
                    {},
                    pivotUtilities.renderers
                )
            },
            true,
        ); 
    }
    exists ? fn() : setTimeout(() => { fn() }, 5000);
    
}