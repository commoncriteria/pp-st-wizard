#!/usr/bin/env python3
""" 
Module that converts PP xml documents to an HTML worksheet
"""

import base64
from io import StringIO 
import warnings
import sys
import xml.etree.ElementTree as ET
import PPObject


class PPMap:
    """ Structure that saves modules to their associated bases """

    # Maps a base to a module
    baseToMods={}

    # Maps a module to possible bases
    modToBase={}

    # List of all modules
    allmods=[]

    def __init__(self):
        self.base=None
        self.modules=[]


    def add_mod(modroot, bases):
        """ Adds a module """
        PPMap.allmods.append(modroot)                # Add to all modules
        for base in bases:
            baseMap = PPMap.get_pp_map(base.attrib["name"])
            baseMap.modules.append(modroot)          # Add it to the bases

    def get_pp_map(name):
        if not name in PPMap.baseToMods:
            PPMap.baseToMods[name]=PPMap()
        return PPMap.baseToMods[name]

    def write_init_pp_structures(out):
        out.write("function initPPStructures(){")
        out.write("}")

    def build_worksheet(out):
        out.write("<div id='ws_base'>")
        out.write("<h3>Select the Base Protection Profile:</h3>")
        modsec=""
        for name in PPMap.baseToMods:
            map=PPMap.baseToMods[name]
            if map.base == None:
                sys.err.print("Some module modifies an unknown base: "+name)
                del PPMap.baseToMods[name]
                continue
            id=PPObject.translateToId(name)
            # THis will break if modules have a double quote in their name
            # Probably no risk of that.
            out.write("<input type='checkbox' class='basecheck' onchange='baseChange(this); return false;'")
            out.write(" data-mods='")
            for module in map.modules:
                out.write(module.attrib["name"]+",")
            out.write("' id='bases:"+id+"'></input>")
            out.write(name + "<br/>\n")
            # for module in map.modules:
        out.write("</div>\n")
        
        out.write("<div id='ws_mods' class='disabled");
        
        for base in PPMap.baseToMods:
            out.write(" dep:")
            out.write(PPObject.translateToId(base))
        out.write("'>")
        out.write("<h3>Select All Applicable Modules</h3>")
        # Run through all modules
        for mod in PPMap.allmods:
            name=mod.attrib["name"]
            id=PPObject.translateToId(name)
            out.write("<div class='hidable modcheckdiv")
            for base in mod.findall(".//cc:base-pp",  PPObject.ns):
                out.write(" dep:")
                out.write(PPObject.translateToId(base.attrib["name"]))
            out.write("'>")
            out.write("<input type='checkbox' class='modcheck' onchange='moduleChange()' id='mods:"+id+"'></input>")
            out.write(name + "</div>\n")
        out.write("</div>") # Ends ws_mods

        # Run through all the bases
        for name in PPMap.baseToMods:
            map=PPMap.baseToMods[name]
            id=PPObject.translateToId(name)
            out.write("<div class='hidable dep:"+id+"' id='base:"+id+"'>");
            out.write("<h3>"+name+"</h3>")
            obj = PPObject.PP(map.base)
            out.write(obj.handle_contents(obj.root, False))
            out.write("</div>")

        # Run through all the modules
        for mod in PPMap.allmods:
            id=PPObject.translateToId(mod.attrib["name"])
            out.write("<div class='hidable dep:"+id + "'>");
            out.write("<h3>"+mod.attrib["name"]+"</h3>")
            obj = PPObject.PP(mod)
            out.write(obj.handle_contents(obj.root, False))
            out.write("</div>")

            
###############################################
#           Start main
###############################################
if __name__ == "__main__":
    if len(sys.argv) < 6:
        #        0       1          2          3          4          5       6
        print("Usage: <js-file> <css-file> <xsl-file> <out-file   <in-1> [<in-2> [...]]")
        sys.exit(0)

    jsfile=sys.argv[1]
    cssfile=sys.argv[2]
    xslfile=sys.argv[3]
    outfile=sys.argv[4]



    with open(jsfile, "r") as in_handle:
        js = in_handle.read()

    with open(cssfile, "r") as in_handle:
        css = in_handle.read()

    with open(xslfile, "rb") as in_handle:
        xslb64 = base64.b64encode(in_handle.read()).decode('ascii')

    for inIndex in range(5, len(sys.argv)):
        root = ET.parse(sys.argv[inIndex]).getroot()
        bases = root.findall( ".//cc:base-pp", PPObject.ns)
        if len( bases ) > 0:
            PPMap.add_mod(root, bases)
        else:
            ppmap = PPMap.get_pp_map(root.attrib["name"])
            ppmap.base= root

    with open(outfile, "w") as out:
        out.write(
"""<html xmlns='http://www.w3.org/1999/xhtml'>
   <head>\n
      <meta charset='utf-8'></meta>\n
      <title>Protection Profile Security Target Generator</title>\n
      <style type='text/css'>
""")
        out.write(css)
        out.write("""      </style>
           <script type='text/javascript'>//<![CDATA[
""")
        # out.write(" const ORIG64='"+inb64+"';\n")
        # out.write(" const XSL64='"+xslb64+"';\n")
        out.write(js)
        PPMap.write_init_pp_structures(out)
        out.write( """
//]]>
       </script>
    </head>
    <body onkeypress='handleKey(event); return true;' onload='init();'>
      <h1>Security Target Wizard</h1>
      <div class='warning-pane'>
        <noscript><h2 class="warning">This page requires JavaScript.</h2></noscript>
           <h2 class="warning" id='url-warning' style="display: none;">
             Most browsers do not store cookies from local pages (i.e, 'file:///...').
             When you close this page, all data will most likely be lost.</h2>
</div>
    """)
        PPMap.build_worksheet(out)
        out.write("<div class='")
        for base in PPMap.baseToMods:
            out.write("dep:"+PPObject.translateToId(base)+" ")
        out.write( """'>
         <button type="button" onclick="generateReport()">XML Record</button>
         <button type="button" onclick="fullReport()">HTML Report</button>
       <div>
       <div id='report-node' style="display: none;"/>
    </body>
</html>
""")
    sys.exit(0)

 
    # state.makeSelectionMap()
    # out.write( state.handle_contents(state.root, False)

