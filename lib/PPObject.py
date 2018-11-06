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
NS={"cc":PPNS, "htm":HTMNS}

# Might need to fix this up. Lots of 
# our IDs have parenthesis which are not technically legal.
# Also one has a caret.
def to_id(name):
    ret = name.replace("_", "__")
    ret = ret.replace("(", "_l")
    ret = ret.replace(")", "_r")
    ret = ret.replace("^", "_c")
    return ret.replace(" ", "_")
    
# Removing this as it's not up-to-date
# def to_name(id):
#     return id.replace("_", " ")


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
        self.man_fun_map['O']="<select onchange='update(this);' class='val'><option value='O'>O</option><option value='X'>X</option></select>"
        # Holds the root
        self.root=theroot
        # Maps IDs to elements
        self.parent_map = {c:p for p in self.root.iter() for c in p}
        # Use
        self.create_classmapping()
        # Grab out name and make it an id
        self.id = to_id(theroot.attrib["name"])
        # Make mappings to selections
        self.make_selmap()
        # :Basename (Used when diving into the tree)
        self.basename=""


    def get_js_selmap(self):
        ret="'"+self.id+"':{\n"
        for selid in self.selMap:
            ret+= "'"+selid+"':"
            delim="{"
            for sel in self.selMap[selid]:
                ret+=delim+"\""+to_id(sel)+"\""
                delim=":1,"
            ret+=":1},\n"
        return ret+"},"

    def getVersion(self):
        " Gets a version of a Module or PP "
        ver=self.root.find("./cc:PPReference/cc:ReferenceTable/cc:PPVersion",NS).text
        return float(ver)

    # TD is an XML representation of a technical decision
    def applyBunchOfTDs(self, bunch):
        for td in bunch.findall("./cc:decision",NS):
            self.applyTD(td)

    def dump(el):
        for att in el.attrib:
            print(att+"='"+el.attrib[att]+"'")

    def applyTD(self, td):
        # We have a decision
        for req in td.findall(".//cc:f-element", NS):
            deadswitch=0
            id=req.attrib['id']
            oldel=self.root.find(".//cc:f-element[@id='"+id+"']", NS)
            if oldel==None:
                sys.stderr.write("Failed to find '"+ id + "' in "+self.root.attrib["name"]);
                continue
            parent=self.up(oldel)
            # Figure out what child is this
            index=0
            for child in parent:
                if child==oldel:
                    break;
                index+=1
            # Remove the old
            parent.remove(oldel)
            del self.parent_map[oldel]
            # Add the new
            parent.insert(index, req)
            # Register my parent
            self.parent_map[req]=parent
            # And all in my subtree
            self.register_parents(req)
            # Keep going until we find the f-component to make a note
            while parent.tag != cc("f-component"):
                parent = self.up(parent)
                if deadswitch==10:
                    break;
                deadswitch=deadswitch+1
            if deadswitch==10:
                break;
            note = ET.SubElement(parent, u'{%s}note'%PPNS)
            note.text="Requirement '"+id.upper()+"' updated by TD "
            anchor = ET.SubElement(note, u'{%s}a'%HTMNS)
            anchor.text = "#"+td.attrib['id']+ " issued on " + td.attrib['date']
            anchor.attrib['href']=td.attrib['url']
            anchor.attrib['target']="_blank"             # Open in a new window
            anchor.tail='.'
    
    def register_parents(self, root):
        "Registers the nodes to their parents for root and below"
        for child in root:
            self.parent_map[child]=root
            self.register_parents(child)


    def to_global_id(self, localId):
        return self.id+":"+localId

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
        for col in elem.findall( 'cc:manager', NS):
            ret += "<th>"
            ret += self.handle_contents(col, True)
            ret += "</th>"
        ret+= "</tr>\n"

        # Step through the rows
        for row in elem.findall( 'cc:management-function', NS):
            val={}
            # Build a dictionary where the key is 'ref' and
            # it maps to 'M', 'O', or '-'.
            for man in row.findall( 'cc:M', NS):
                val[man.attrib['ref']]='M'
            for opt in row.findall( 'cc:O', NS):
                val[man.attrib['ref']]='O'
            for das in row.findall( 'cc:_', NS):
                val[man.attrib['ref']]='-'
            # Now we convert this to the expected columns
            ret += "<tr>\n"
            # First column is the management function text
            ret += "<td>"+self.handle_contents( row.find( 'cc:text', NS), True) + "</td>"
            # And step through every other column
            for col in elem.findall( 'cc:manager', NS):
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
        for child in node.findall("cc:selectable", NS):
            contents = self.handle_contents(child,True)
            contentCtr+=len(contents)
            chk = "<input type='checkbox'"
            onChange=""
            classes=""
            if attr(child,"exclusive") == "yes":
                classes=" exclusive"
            id=""
            if "id" in child.attrib:
                chk += " id='"+self.to_global_id(child.attrib["id"])+"'"
                classes+=" "+child.attrib["id"];
            chk+= " onchange='update(this); "+onChange+"'"
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
        elif node.tag == cc("modified-sfrs"):
            return self.handle_mod(node)
        elif node.tag == cc("opt-sfrs"):
            return self.handle_opt_obj(node, "optional")
        elif node.tag == cc("obj-sfrs"):
            return self.handle_opt_obj(node, "objective")
        elif node.tag == cc("sel-sfrs"):
            return self.handle_opt_obj(node, "sel-based")
        elif node.tag == cc("selectables"):
            return self.handle_selectables(node)
        elif node.tag == cc("refinement"):
            ret = "<span class='refinement'>"
            ret += self.handle_contents(node, True)
            ret += "</span>"
            return ret

        elif node.tag == cc("assignable"):
            ret = "<textarea onchange='update(this);' class='assignment val' rows='1' placeholder='"
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
                ret+="<h3>"+node.attrib["title"]+"</h3>\n"
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
            idAttr=self.to_global_id(node.attrib["id"])
            ret="<span class='ctr' data-myid='"+idAttr+"+data-counter-type='ct-"
            ret+=ctrtype+"' id='cc-"+idAttr+"'>\n"
            ret+=prefix
            ret+="<span class='counter'>"+idAttr+"</span>"
            ret+=self.handle_contents(node, True)
            ret+="</span>"
            return ret
        
        # elif node.tag == cc("f-element") or node.tag == cc("a-element"):
        #     # Requirements are handled in the title section
        #     return self.handle_contents( node.find( 'cc:title', NS), True)
        elif node.tag == cc("f-component") or node.tag == cc("a-component"):
            return self.handle_component(node)
        elif node.tag == cc("aactivity"):
            return self.handle_aactivity(node)
        elif node.tag == cc("title"):
            return self.handle_title(node)
        else:
            return self.handle_contents(node, show_text)
        return ""

    def handle_aactivity(self, node):
        ret="<div class='aactivity'>\n"
        ret+=self.handle_contents(node, True)
        ret+="</div>"
        return ret

    # This is where the requirements are handled
    def handle_title(self, node):
        self.selectables_index=0
        ccid = self.up(node).attrib['id']
        safe_ccid=to_id(ccid)
        id=self.to_global_id(safe_ccid)
        ret=""
        ret+="<div id='"+ id +"' class='requirement "+safe_ccid+"'>"
        ret+="<div class='f-el-title'>"+ccid.upper()+"</div>"
        ret+="<div class='words'>"
        ret+=self.handle_contents(node, True)
        ret+="</div>\n"
        ret+="</div><!-- End: "+id+" -->\n"
        return ret

    def handle_base(self, node):
        self.basename=node.attrib["name"]
        baseId= to_id(self.basename)
        safeId= self.to_global_id(baseId)
        ret = "<div id='"+safeId+"' class='dep:"+baseId+"'>\n"
        ret += self.handle_contents(node, False)
        ret += "</div><!--Endbase dep:"+baseId+" -->\n"
        self.basename=""
        return ret

    def handle_mod(self, node):
          return \
              "<div class='mod_sfrs'>\n"\
              + self.handle_contents(node, False)\
              + "</div><!--ENd mod_sfrs-->\n"


    def handle_opt_obj(self, node, status):
        ret=""
        for comp in node.findall('.//cc:f-component', NS):
            ret+=self.handle_component(comp, status)
        return ret


    def handle_component(self, node, status=None):
        if status==None: status= attr(node,"status")
        ccid=node.attrib["id"]
        based=""
        if self.basename!="": based=to_id(self.basename)+":"
        safe_ccid=to_id(ccid)
        id=self.to_global_id(based+safe_ccid)
        ret=""
        tooltip=""
        if status == "optional" or status == "objective":
            ret+="<span class='tooltipped'>"
            ret+="<input type='checkbox' onchange='handleOCheck(this); return false;'></input>"
            tooltip="<span class='tooltiptext'>"+status+"</span>"
            ret+="</span>\n"

        ret+= "<span id='"+id+"'"
        # ret = "<div onfocusin='handleEnter(this)' id='"+id+"'"
        # The only direct descendants are possible should be the children
        # What is this for
        # node.findall( 'cc:selection-depends', NS)
        ret+=" class='component "+safe_ccid
        if status== "sel-based":
            ret+=" sel-based"
        if status!="":
            ret+=" disabled"
        ret+="'>"
        #<a href='#"+id+"'>

        # Add the toggler

        ret+="""<span class='f-comp-status'></span>
                <a onclick='toggle(this); return false;' href='#"+id+"' class='f-comp-title'>"""
        ret+=ccid.upper()+" &#8212; "+ node.attrib["name"]+"</a>"
        ret+=tooltip
        ret+="\n<div class='reqgroup'>\n"
        ret+=self.handle_contents(node, False)
        ret+="\n</div>"
        ret+="</span><!-- End: "+id+" -->\n"
        ret+="<span class='comp-notes'>"
        for note in node.findall("cc:note", NS):
            ret += "<div class='note'>"
            ret += self.handle_node(note, True)
            ret += "</div><!--End Note -->"
        ret+="</span><br/>"
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
            if node.text: ret = escape(node.text)
            for child in node:
                ret+=self.handle_node(child, show_text)
                if child.tail: ret+= escape(child.tail)
        else:
            for child in node:
                ret+=self.handle_node(child, show_text)
        return ret

    def make_selmap(self):
        """
        Makes a dictionary that maps the master requirement ID
        to an array of slave component IDs
        Results are stored in self.selMap
        @returns nothing
        """
        for element in self.root.findall( './/cc:selection-depends', NS):
            # req=element.attrib["req"]
            selIds=element.attrib["ids"]
            slaveId=self.up(element).attrib["id"]
            for selId in selIds.split(','):
                if selId in self.selMap:
                    reqs =self.selMap[selId]
                else: reqs=[]
                reqs.append(slaveId)
                self.selMap[selId]=reqs


###############################################
#           Test
###############################################
if __name__ == "__main__":
    obj = PP(ET.parse(sys.argv[1]).getroot())
    print( obj.handle_contents(obj.root, False ))

