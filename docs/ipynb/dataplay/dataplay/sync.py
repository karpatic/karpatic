import os
from IPython.display import display, HTML, Javascript
import pandas as pd
import json
from dataplay import pivot

import json
def getValidDf(ds):
    # Convert DataFrame to a serializable format if it's a DataFrame
    if isinstance(ds, pd.DataFrame):
        # Convert DataFrame to a dictionary in a format that can be serialized
        data = ds.to_dict(orient='records')
        data_str = json.dumps(data)
    else:
        data_str = "undefined"
    return data_str

def getValidNames(names):
    # Default to not using any.
    # But if it's a string, check if it's a comma separated list
    if names == False: return 'false'
    if names == None: names = []
    if type(names) == str: 
        if "," in names: names = names.split(",")
        else: names = [names]
    return names

def init(usePivot=True):
    pivot_code = """
        window.loadScripts = (scripts) => {{
            let index = 0;
            function loadScript(url, onload) {{
                var script = document.createElement("script");
                script.src = url;
                onload && (script.onload = onload);
                document.head.appendChild(script);
            }} 
            function loadNext() {{
                if (index < scripts.length) {{
                    console.log('loadScripts', scripts[index])
                    loadScript(scripts[index], () => {{ index++; loadNext(); }});
                }}
            }}
            loadNext();
        }}
        //   "http://localhost:8080/ipynb/dataplay/renderer_d3.js"
        //   "http://localhost:8080/ipynb/dataplay/renderer_c3.js",
        //   "https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.2/jquery.min.js", 
	    //   "https://cdnjs.cloudflare.com/ajax/libs/c3/0.4.11/c3.min.js",
        //   "https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js",
            "http://localhost:8080/ipynb/dataplay/renderer_pivottable.js",
        window.scripts = [
            "https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.2/jquery.min.js", 
            "http://localhost:8080/ipynb/dataplay/sortable.js",
            "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js",
            "http://localhost:8080/ipynb/dataplay/pivottable.js",
            "http://localhost:8080/ipynb/dataplay/renderer_pivottable_copy.js",
        ];
        loadScripts(scripts);
    """
    js_file_path = os.path.join(os.getcwd(), 'dataplay.js') 
    with open(js_file_path, 'r') as file:
        js_code = file.read()
        if(usePivot==True): js_code = js_code + pivot_code
        html_code = f"<script>{js_code}</script>"
        if(usePivot==True): html_code += "<link rel='stylesheet' type='text/css' href='https://pivottable.js.org/dist/pivot.css'><link rel='stylesheet' type='text/css' href='https://cdnjs.cloudflare.com/ajax/libs/c3/0.4.11/c3.min.css'>"
        display(HTML(html_code)) 

def setData(label, data):
    # Link data to a label. Updates existing or adds new 
    display(HTML(f"<script>window.setData('{label}', {getValidDf(data)})</script>"))

def setMapping(label='', vizid='', viztype='', rows=False, cols=False):
    # Link element_id to a label. Updates existing or adds new
    display(HTML(f'<script>window.setMapping("{label}", "{vizid}", "{viztype}", {getValidNames(rows)}, {getValidNames(cols)});</script>'))

def setVizType(vizid, viztype, rows=False, cols=False):
    # Make a best effort attempt to update an existing record even when no label was provided
    display(HTML(f'<script>window.setVizType("{vizid}", "{viztype}, {getValidNames(rows)}, {getValidNames(cols)});'))

def unsetMapping(vizid):
    # Remove a specific mapping based on vizid
    display(HTML(f'<script>window.unsetMapping("{vizid}");'))

def displayElements(label):
    # Display all Mappings for a given label
    display(HTML(f'<div><script>window.displayElements("{label}")</script></div>')) 

def displayElement(data, vizid='', viztype='Table', rows=False, cols=False):
    # Display a single element with dataset
    display(HTML(f'<div><script>window.displayElement({getValidDf(data)}, "{vizid}", "{viztype}", {getValidNames(rows)}, {getValidNames(cols)} )</script></div>')) 

def update(label='', vizid='', viztype='', ds=None, unset=False, rows=False, cols=False):
    update_command = f'window.update({{ \
        "label": "{label}", \
        "vizid": "{vizid}", \
        "viztype": "{viztype}", \
        "ds": {getValidDf(ds)}, \
        "unset": {str(unset).lower()}, \
        "rows": {getValidNames(rows)}, \
        "cols": {getValidNames(cols)} \
    }});'
    display(HTML(f"<div><script>{update_command}</script></div>"))

init()