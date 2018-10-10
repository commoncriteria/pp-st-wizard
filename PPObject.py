import re
import xml.etree.ElementTree as ET
import sys
from xml.sax.saxutils import escape

# JavaScript naming convensions
# ${ID}=Name of PP with spaces replaced with underscores
# Base checkboxes:
#  bases:${ID}
# Module checkboxes:
#  mods:${ID}

# Things that are dependents of a base or module(if they're checked they appear):
#     dep:${ID}
#




PPNS='https://niap-ccevs.org/cc/v1'
HTMNS="http://www.w3.org/1999/xhtml"
ns={"cc":PPNS, "htm":HTMNS}

def translateToId(name):
    return name.replace(" ", "_")
    
def translateToName(id):
    return id.replace("_", " ")


def cc(tag):
    """ Creates a CC tag for tests"""
    return "{"+PPNS+"}"+tag

def htm(tag):
    """ Creates HTML tag representation for tests"""
    return "{"+HTMNS + "}"+tag

def attr(el,at):
    """ Non exception throwing way to ask for attributes. 
    No attribute is returned as empty string 
    """
    if at in el.attrib: 
        return el.attrib[at]
    return ""

class PP:
    """ Represents a Module or PP definition """ 
    def __init__(self, theroot):
        """ Initializes PP"""
        # Maps selection IDs to Requirements
        # If the selection is made, then the requirement is included
        self.selMap={}
        # Maps component IDs to sections
        self.compMap={}
        # Current index for the selectables
        self.selectables_index=0
        # Map from management function table values to HTML
        self.man_fun_map={}
        # Value for mandatory function
        self.man_fun_map['M']="X"
        # Value of N/A function
        self.man_fun_map['-']="-"
        # Value for Optional function
        self.man_fun_map['O']="<select onchange='update();' class='val'><option value='O'>O</option><option value='X'>X</option></select>"
        # Holds the root
        self.root=theroot
        # Maps IDs to elements
        self.parent_map = {c:p for p in self.root.iter() for c in p}
        # Used to run 'getElementByClassname'
        self.create_classmapping()
        # Grab out name and make it an id
        self.id = translateToId(theroot.attrib["name"])

        # # Holds the name of the base that the components apply to
        # # if they are not specific to a specific base, it's empty
        # self.baseName=""

        # Make mappings to selections
        self.makeSelectionMap()

    def get_js_representation(self):
        return "";

    def up(self, node):
        return self.parent_map[node]

    def create_classmapping(self):
        "Builds database to emulate getElementByClassname"
        self.classmap={}
        for el in self.root.findall(".//*[@class]"):
            classes = el.attrib["class"].split(",")
            for clazz in classes:
                # If we already have this class in the classmap
                if clazz in self.classmap:
                    # Grab the old
                    clazzset = self.classmap[clazz]
                    clazzset.add(el)
                else:
                    self.classmap[clazz]={el}


    def handle_management_function_set(self, elem):
        ret = "<table class='mfun-table'>\n"
        defaultVal = attr(elem,"default")
        if defaultVal == "":
            defaultVal="O"
            
        ret+= "<tr><th>Management Function</th>"
        for col in elem.findall( 'cc:manager', ns):
            ret += "<th>"
            ret += self.handle_contents(col, True)
            ret += "</th>"
        ret+= "</tr>\n"

        # Step through the rows
        for row in elem.findall( 'cc:management-function', ns):
            val={}
            # Build a dictionary where the key is 'ref' and
            # it maps to 'M', 'O', or '-'.
            for man in row.findall( 'cc:M', ns):
                val[man.attrib['ref']]='M'
            for opt in row.findall( 'cc:O', ns):
                val[man.attrib['ref']]='O'
            for das in row.findall( 'cc:_', ns):
                val[man.attrib['ref']]='-'
            # Now we convert this to the expected columns
            ret += "<tr>\n"
            # First column is the management function text
            ret += "<td>"+self.handle_contents( row.find( 'cc:text', ns), True) + "</td>"
            # And step through every other column
            for col in elem.findall( 'cc:manager', ns):
                ret += "<td>"
                colId = col.attrib["id"]
                if colId in val:
                    ret += self.man_fun_map[ val[colId] ]
                else:
                    ret += self.man_fun_map[ defaultVal ]
                ret += "</td>"
            ret += "</tr>\n"
        ret += "</table>\n"
        return ret

    def handle_selectables(self, node):
        """Handles selectables elements"""
        sels=[]
        contentCtr=0
        ret="<span class='selectables"
        if attr(node,"exclusive")=="yes":
            ret+=" onlyone"
        ret+="' data-rindex='"+ str(self.selectables_index) +"'>"

        self.selectables_index+=1
        rindex=0
        for child in node.findall("cc:selectable", ns):
            contents = self.handle_contents(child,True)
            contentCtr+=len(contents)
            chk = "<input type='checkbox'"
            onChange=""
            classes=""
            if attr(child,"exclusive") == "yes":
                onChange+="chooseMe(this);"
            id=attr(child,"id")
            if id!="" and id in self.selMap:
                onChange+="updateDependency(this,"
                delim="["
                for sel in self.selMap[id]:
                    classes+=" "+sel+"_m"
                    onChange+=delim+"\""+sel+"\""
                    delim=","
                onChange+="]);"
            chk+= " onchange='update(); "+onChange+"'"
            chk+= " data-rindex='"+str(rindex)+"'"
            chk +=" class='val selbox"+classes+"'"
            chk +="></input><span>"+ contents+"</span>\n"
            sels.append(chk)
            rindex+=1
        # If the text is short, put it on one line
        if contentCtr < 50:
            for sel in sels:
                ret+= sel
        # Else convert them to bullets
        else:
            ret+="<ul>\n"
            for sel in sels:
                ret+= "<li>"+sel+"</li>\n"
            ret+="</ul>\n"
        return ret+"</span>"

    def handle_cc_node(self, node, show_text):
        if node.tag == cc("base-pp"):
            return self.handle_base(node)

        elif node.tag == cc("selectables"):
            return self.handle_selectables(node)

        elif node.tag == cc("refinement"):
            ret = "<span class='refinement'>"
            ret += self.handle_contents(node, True)
            ret += "</span>"
            return ret

        elif node.tag == cc("assignable"):
            ret = "<textarea onchange='update();' class='assignment val' rows='1' placeholder='"
            ret += ' '.join(self.handle_contents(node, True).split())
            ret +="'></textarea>"
            return ret

        elif node.tag == cc("abbr") or node.tag == cc("linkref"):
            if show_text:
                return attr(node,"linkend")

        elif node.tag == cc("management-function-set"):
            ret=self.handle_management_function_set(node)
            return ret

        elif node.tag == cc("section"):
            idAttr=node.attrib["id"]
            ret =""
            if "SFRs" == idAttr or "SARs" == idAttr:
                ret+="<h2>"+node.attrib["title"]+"</h2>\n"
            ret += self.handle_contents(node, False)
            return ret

        elif node.tag == cc("ctr-ref") and show_text:
            refid=node.attrib['refid']
            ret="<a onclick='showTarget(\"cc-"+refid+"\")' href=\"#cc-"+refid+"\" class=\"cc-"+refid+"-ref\">"
            target=self.root.find(".//*[@id='"+refid+"']")
            # What is prefix for?
            prefix=target.attrib["ctr-type"]+" "
            if "pre" in target.attrib:
                prefix=target.attrib["pre"]
            ret+="<span class=\"counter\">"+refid+"</span>"
            ret+="</a>"
            return ret
            
            
        elif node.tag == cc("ctr") and show_text:
            ctrtype=node.attrib["ctr-type"]
            prefix=ctrtype+" "
            if "pre" in node.attrib:
                prefix=node.attrib["pre"]
            idAttr=node.attrib["id"]
            ret="<span class='ctr' data-myid='"+idAttr+"+data-counter-type='ct-"
            ret+=ctrtype+"' id='cc-"+idAttr+"'>\n"
            ret+=prefix
            ret+="<span class='counter'>"+idAttr+"</span>"
            ret+=self.handle_contents(node, True)
            ret+="</span>"
            return ret
        
        # elif node.tag == cc("f-element") or node.tag == cc("a-element"):
        #     # Requirements are handled in the title section
        #     return self.handle_contents( node.find( 'cc:title', ns), True)

        elif node.tag == cc("f-component") or node.tag == cc("a-component"):
            return self.handle_component(node)
        elif node.tag == cc("title"):
            self.selectables_index=0
            req_id = self.up(node).attrib['id']
            com_id = self.up(self.up(node)).attrib['id']
            slaves = self.up(self.up(node)).findall( 'cc:selection-depends', ns)
            ret=""
            ret+="<div id='"+ req_id +"' class='requirement'>"
            ret+="<div class='f-el-title'>"+req_id.upper()+"</div>"
            ret+="<div class='words'>"
            ret+=self.handle_contents(node, True)
            ret+="</div>\n"
            ret+="</div><!-- End: "+req_id+" -->\n"
            return ret
        else:
            return self.handle_contents(node, show_text)
        return ""

    def handle_base(self, node):
        # for sfr in node.find("cc:modified-sfrs", ns)
        safeId= translateToId(node.attrib["name"])
        ret = "<div "
        ret += "id='"+self.id+":"+safeId+"' "
        ret += "class='dep:"+safeId+"'>"
        ret += self.handle_contents(node, False)
        ret += "</div><!--End dep:"+safeId+" -->\n"
        return ret

    def handle_component(self, node):
        status= attr(node,"status")
        ret=""
        id=node.attrib["id"]
        tooltip=""
        if status == "optional" or status == "objective":
            ret+="<span class='tooltipped'>"
            ret+="<input type='checkbox' onchange='modifyClass(this.nextSibling, \"disabled\", !this.checked)'></input>"
            tooltip="<span class='tooltiptext'>"+status+"</span>"
            ret+="</span>\n"

        ret+= "<span id='"+id+"'"
        # ret = "<div onfocusin='handleEnter(this)' id='"+id+"'"
        # The only direct descendants are possible should be the children
        node.findall( 'cc:selection-depends', ns)
        ret+=" class='component"
        if status!="":
            ret+=" disabled"
        ret+="'>"
        #<a href='#"+id+"'>

        # The toggle(this
        ret+="""<span class='f-comp-status'></span>
                <a onclick='toggle(this); return false;' href='#"+id+"' class='f-comp-title'>"""
        ret+=id.upper()+" &#8212; "+ node.attrib["name"]+"</a>"
        ret+=tooltip
        ret+="\n<div class='reqgroup'>\n"
        ret+=self.handle_contents(node, False)
        ret+="\n</div></span><!-- End: "+id+" --><br/>"
        return ret




    def handle_node(self, node, show_text):           
        if node.tag.startswith(cc("")):
            return self.handle_cc_node(node, show_text)
        # If we're not showing things OR it's a strike, just leave.
        elif not show_text or node.tag == htm("strike"):
            return ""
        elif node.tag == htm("br"):
            return "<br/>"
        elif node.tag.startswith(htm("")):
            # Just remove the HTML prefix and recur.
            tag = re.sub(r'{.*}', '', node.tag)
            ret = "<"+tag
            for key in node.attrib:
                ret+=" " + key + "='" + escape(node.attrib[key]) +"'"
            ret += ">"
            ret += self.handle_contents(node, True)
            ret += "</"+tag+">"
            return ret
        else:
            warnings.warn("Just dropped something")

    def handle_contents(self, node, show_text):
        ret=""
        if show_text:
            if node.text:
                ret = escape(node.text)
            for child in node:
                ret+=self.handle_node(child, show_text)
                if child.tail:
                    ret+=child.tail
        else:
            for child in node:
                ret+=self.handle_node(child, show_text)
        return ret

    def makeSelectionMap(self):
        """
        Makes a dictionary that maps the master requirement ID
        to an array of slave component IDs
        Results are stored in self.selMap
        @returns nothing
        """
        for element in self.root.findall( 'cc:selection-depends', ns):
            # req=element.attrib["req"]
            selIds=element.attrib["ids"]
            slaveId=self.up(element).attrib["id"]
            for selId in selIds.split(','):
                reqs=[]
                if selId in self.selMap:
                    reqs =self.selMap[selId]
                reqs.append(slaveId)
                self.selMap[selId]=reqs


###############################################
#           Test
###############################################
if __name__ == "__main__":
    obj = PP(ET.parse(sys.argv[1]).getroot())
    print( obj.handle_contents(obj.root, False ))

