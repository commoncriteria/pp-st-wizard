const PREAMBLE = //"<html><head><title></title></head><body>";
 "<html xmlns='http://www.w3.org/1999/xhtml'><head><title>Security Target</title><style type='text/css'>\n"
    + ".selection,.assignment{ font-weight:bold;}\n"
    + ".reqid{  float:left;\n"
    + "   font-size:90%;\n"
    + "   font-family:verdana, arial, helvetica, sans-serif;\n"
    + "   margin-right:1em;\n"
    + "}\n"
    + ".req{\n"
    + "    margin-left:0%;\n"
    + "    margin-top:1em;\n"
    + "    margin-bottom:1em;\n"
    + "}\n"
    + "*.reqdesc{\n"
    + "    margin-left:20%;\n"
    + "}\n"
    + "</style></head><body>\n";
    
const EPILOGUE="</body></html>";
const HIDE="none";
const SHOW="block";
const DISABLED="disabled";
const MODBYMODULE='modifiedbymodule';
const DEP="dep:"
const AMPERSAND=String.fromCharCode(38);
const LT=String.fromCharCode(60);

/// Holds the prefix for the settings we care about
var prefix="";

/// Effective Selection Map (This should be a class probably)
var effSelMap={};
var effSelOwnerMap={};

//////////////////////////////////////////////////
// Aliases
//////////////////////////////////////////////////

/**
 * Aliases getElementsByClassName
 */
function elsByCls(classname){
    return document.getElementsByClassName(classname);
}

function subElsByCls(el, classname){
     return el.getElementsByClassName(classname);
}

/**
 * Aliases getElementById
 */
function elById(id){
    return document.getElementById(id);
}

function forEach(array, func){
    Array.prototype.forEach.call(array, func);
}

//////////////////////////////////////////////////
// Stolen from the regular PP project
//////////////////////////////////////////////////

// Expands targets if they are hidden
function showTarget(id){
    var element = elById(id);
    while (element != document.body.rootNode ){
	element.classList.remove("hide");
	element = element.parentElement;
    }
}
//////////////////////////////////////////////////
// End stolen section
//////////////////////////////////////////////////

//////////////////////////////////////////////////
// Primatives
//////////////////////////////////////////////////

/**
 * Records a major error.
 */
function error(msg){
    Console.log("Error: "+msg);
}

function isCheckbox(elem){
    return elem.getAttribute("type") == "checkbox";
}

function isSelector(elem){
    return elem.tagName == 'SELECT';
}
/**
 * This runs some sort of function on
 * all elements of a class.
 * @param classname Value of the class 
 * @param fun Function that is run on all elements. 
 *    For its 1st parameter, it takes the element. For the 2nd
 *    it's the number of the element.
 */
function performActionOnElements(elements, fun){
    // Run through all the elements with possible
    // values
    var aa;
    for(aa=0; elements.length> aa; aa++){
        fun(elements[aa], aa);
    }
}

var prevCheckbox = false;
/**
 *
 */
function isPrevCheckbox(elem){
    var ret = prevCheckbox;
    prevCheckbox = false;
    return ret;
}



// elem is a component element
function handleEnter(elem){
    if (elem != null){
        elem.classList.remove('hide');
    }

    var compsIter, comps;
    comps = elsByCls('component');
    for (compsIter=comps.length-1; compsIter>=0; compsIter--){
        if (comps[compsIter]==elem) continue;
        comps[compsIter].classList.add('hide');
    }
}

function killFade(){
    var fp = elById("fade-pane");
    fp.parentNode.removeChild(fp);
}

function fixToolTips(){
  var tooltipelements = document.getElementsByClassName("tooltiptext");
  var aa;
  for(aa=tooltipelements.length-1; aa>=0; aa--){
      tooltipelements[aa].parentNode.classList.add("tooltipped");
  }
}

/**
 * The initialization function.
 */
function init(){
    if( document.URL.startsWith("file:///") ){
        var warn = elById("url-warning");
        warn.style.display=SHOW;
    }
    var url = new URL(document.URL);
    var fp = elById("fade-pane");
    if(url.searchParams.get("hidefade")=="1"){
	fp.parentNode.removeChild(fp);
    }
    else{
	fp.style.opacity = '0';
	setTimeout(killFade, 2000);
    }
    fixToolTips();
    prefix=url.searchParams.get("prefix");
    if (prefix==null) prefix="";
    cookieJar = readAllCookies();
    // var elems = elsByCls("val");
    // performActionOnElements(elems, retrieveFromCookieJar);
    validateRequirements();
    handleEnter(null);
    baseChange(null)
}


// ##################################################
// #               Cookie functions
// ##################################################

/// Dictionary to hold all the cookies
var cookieJar=[];

function saveToCookieJar(elem, index){
    var id = prefix+":"+getId(index);
    if( isCheckbox(elem)){
        cookieJar[id]=elem.checked;
    }
    else if( elem.tagName == 'SELECT' ){
        cookieJar[id]=elem.selectedIndex;
    }
    else{
        if(elem.value != undefined){
            if( elem.value != "undefined" ) cookieJar[id]=elem.value;
        }
    }
}

function getId(index){
    return "v_" + index;
} 


function retrieveFromCookieJar(elem, index){
    var id = prefix+":"+getId(index);
    if( isCheckbox(elem)){
        elem.checked= (cookieJar[id] == "true");
    }
    else if( elem.tagName == 'SELECT' ){
        if( id in cookieJar ){
            elem.selectedIndex = cookieJar[id];
        }
    }
    else{
        if( id in cookieJar) {
            if(cookieJar[id] != "undefined"){
                elem.value= cookieJar[id];
            }
        }
    }
}

function readAllCookies() {
    ret=[];
    var ca = document.cookie.split(';');
    var aa,bb;
    for(aa=0;ca.length > aa ; aa++) {
        if (3>ca[aa].length){ continue;}
        var blah=ca[aa].split('=');
        if (2 != blah.length){
            console.log("Malformed Cookie.");
            continue;
        }
        key=blah[0].trim();
        val=decodeURIComponent(blah[1]);
        ret[key]=val;
    }
    return ret;
}

function saveAllCookies(cookies){
    var key;
    // run through the cookies
    for (key in cookies) {
        createCookie(key, cookies[key] );
    }
}

function createCookie(name,value) {
    var date = new Date();
    // 10 day timeout
    date.setTime(date.getTime()+(10*24*60*60*1000));
    var expires = "; expires="+date.toGMTString();
    document.cookie = name+"="+encodeURIComponent(value)+expires+"; path=/";

}

function eraseCookie(name) {
    createCookie(name,"",-1);
}

// ##################################################
// #          Report Generating Functions
// ##################################################
function resolver(pre){
    if(pre=='cc') return 'https://niap-ccevs.org/cc/v1';
    else return "http://www.w3.org/1999/xhtml";
}

function handleHtmlReport(){
    var xsl = new DOMParser().parseFromString(atob(XSL64), "text/xml");
    // This doesn't work on Chrome. THe max string size cuts us off.
    // var serializer = new XMLSerializer();
    // var xmlString = serializer.serializeToString(pp_xml);
    // var resultStr = (new XMLSerializer()).serializeToString(htmlReport);
    // console.log("Result size: " +resultStr.length);
    // This creates a separate window with the repot
    // Intent was to use this to transform this to docx format.
    // var win = window.open("", "Report");
    // win.document.open();
    // win.document.write(PREAMBLE);
    // win.document.write(EPILOGUE);
    // win.document.close();
    // var htmlReport1 = transform(xsl, pp_xml, win.document);
    // win.document.body.appendChild( htmlReport1 );

    // This way seems to work with Chrome and Mozilla.
    // A little more complicated than it should be b/c
    // Chrome has a max string size.
    var report = generateReport();
    var pp_xml = new DOMParser().parseFromString(report, "text/xml");
    var htmlReport = transform(xsl, pp_xml, document);
    qq(htmlReport);


    var rNode = elById('report-node');
    // Clear its children
    while(rNode.firstChild){
	rNode.removeChild( rNode.firstChild );
    }
    rNode.appendChild( htmlReport );
    var blobTheBuilder = new MyBlobBuilder();
    blobTheBuilder.append(PREAMBLE);
    blobTheBuilder.append(rNode.innerHTML);
    blobTheBuilder.append(EPILOGUE);
    initiateDownload('FullReport.html', blobTheBuilder.getBlob("text/html"));
}

function handleXmlReport(){
    var report = generateReport();// qq(report);
    var blobTheBuilder = new MyBlobBuilder();
    blobTheBuilder.append(report);
    initiateDownload('Report.xml', blobTheBuilder.getBlob("text/xml"));
}

function generateReport(){
    var report = LT+"?xml version='1.0' encoding='utf-8'?>\n"
    var aa;
    report += LT+"report xmlns='https://niap-ccevs.org/cc/pp/report/v1'>"
    var baseId=getAppliedBaseId();
    if(baseId==null) return;
    report += harvestSection(elById("base:"+baseId));
    var modIds = getAppliedModuleIds();
    for(aa=0; aa<modIds.length; aa++){
	report += harvestSection(elById("module:"+modIds[aa]));
    }
    report += LT+"/report>"							 
    return report;
}

function harvestSection(section){
    var ret=LT+"section>\n";
    ret += LT+"name>"+section.firstElementChild.innerHTML+LT+"/name>\n";
    var aa;
    var comps=subElsByCls(section,"component");
    for(aa=0; aa<comps.length; aa++){
        if(!isApplied(comps[aa])) continue;
        ret+="<component>\n   <name>"
        ret+=subElsByCls(comps[aa], "f-comp-title")[0].innerHTML;
        ret+="</name>\n";
        var reqs = subElsByCls(comps[aa], "requirement");
	ret+=harvestReqs(reqs)
        ret+="</component>";
    }
    ret += LT+"/section>\n"
    return ret;
}
function harvestReqs(reqs){
    var ret="";
    var aa;
    for(aa=0; aa<reqs.length; aa++){
	ret+="<requirement>\n   <name>";
	var title = subElsByCls(reqs[aa], "f-el-title");
	ret+=title[0].innerHTML;
	ret+="</name>\n"
	// Get the requirement and replace all extra spaces 
	var wordsEl=subElsByCls(reqs[aa], "words")[0];
	var words=getRequirement(wordsEl);
	words = words.replace(/(\r\n\t|\n|\r\t)/gm," ");
	words = words.replace(/\s+(?= )/g,'');
	ret+=words;
	ret+="</requirement>\n"
    }
    return ret;
}

function getRequirements(nodes){
    ret="";
    var bb=0;
    for(bb=0; bb!=nodes.length; bb++){
        ret+=getRequirement(nodes[bb]);
    }
    return ret;
}

function convertToXmlContent(val){
    var ret = val;
    ret = ret.replace(/\x26/g, AMPERSAND+'amp;');
    ret = ret.replace(/\x3c/g, AMPERSAND+'lt;');
    ret = ret.replace(/\]\]\>/g, ']]'+AMPERSAND+'gt;');
    return ret;
}

function getRequirement(node){
    var ret = ""
    // If it's an element
    if(node.nodeType==1){
	// If the previous was a checkbox
        if(isPrevCheckbox(node)){
            return "";
        }
        if(isCheckbox(node)){
            if(node.checked){
                ret+=LT+"selectable index='"+node.getAttribute('data-rindex')+"'>"; 
		// Checkbox precedes the 
                // Like a fake recurrence call here
                ret+=getRequirement(node.nextSibling);
                ret+=LT+"/selectable>";
            }
            // Skip the next check.
            prevCheckbox=true;
        }
        else if(node.classList.contains("selectables")){
            ret+=LT+"selectables>"
            ret+=getRequirements(node.children);
            ret+=LT+"/selectables>"
        }
        else if(node.classList.contains("assignment")){
            var val = "";
            if(node.value){
                val=node.value;
            }
            ret+=LT+"assignment>";
            ret+=convertToXmlContent(val);
            ret+=LT+"/assignment>\n";
        }
        else if(node.classList.contains('mfun-table')){
            ret += LT+"management-function-table>"
            var rows = node.getElementsByTagName("tr");
            for(var row=0; rows.length>row; row++){
                ret += LT+"row>";
                var cols=rows[row].children;
                for( var col=0; cols.length>col; col++){
                    ret += LT+"val>"; 
		    ret += getRequirements(cols[col].childNodes);
                    ret += LT+"/val>";
                }
                ret += LT+"/row>\n";
            }
            ret += LT+"/management-function-table>";
        }
	else if(isSelector(node)){
	    ret+=getRequirement(node.children[node.selectedIndex]);
	}
        else{
            ret+=getRequirements(node.childNodes);
        }
    }
    // If it's text
    else if(node.nodeType==3){
     	ret = node.textContent;
        return ret;
    }
    else{}							   
    return ret;
}

function initiateDownload(filename, blob) {
//    var blob = new Blob([data], {type: mimetype});
    if(window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    }
    else{
        var elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;        
        document.body.appendChild(elem);
        elem.click();        
        document.body.removeChild(elem);
    }
}

// A selection group is either bulleted form: 
//    <span><ul><li><input/><span/></li><li><input/><span/></li>...</ul></span> 
//   OR inline form:
//    <span><input/><span/><input/><span/>..</span>
//
function populateSelectableGroup(sel,group){
    // Find the common parent
    var common = sel.parentNode;
    var isSomethingChecked = false;
    // Keep going up until yu hit SPAN
    while( common.tagName != "SPAN" ){
        common = common.parentNode;
    }
    var aa;
    if( isCheckbox(common.children[0])){ // If it's the inline form
	for(aa=0; common.children.length>aa; aa+=2){
	    group.push(common.children[aa])
	    isSomethingChecked = common.children[aa].checked || isSomethingChecked;
		
	}
    }
    else{
	common=common.children[0]; // Dip to ul
	for(aa=0; common.children.length>aa; aa++){
	    group.push(common.children[aa].children[0]);
	    isSomethingChecked = common.children[aa].children[0].checked || isSomethingChecked;
	}
    }
    return isSomethingChecked;
}





// ##################################################
// #         
// ################################################## 
function setVisibility(elements, visibility){
    var aa;
    for(aa=0; elements.length>aa; aa++){
	var hideOrDisable = elements[aa].classList.contains('hidable')?"hidden":DISABLED;
	modifyClass(elements[aa], hideOrDisable, !visibility);
    }
}

function hideAllDependents(classname){
    var aa;
    var masters = elsByCls(classname);
    for(aa=masters.length-1; aa>=0; aa--){
	var id = masters[aa].id.split(":")[1];
	setVisibility(elsByCls(DEP+id), false);
    }
    return masters;
}

/**
 * baseChange handler
 * @changed is the element that changed or null for init.
 */
function baseChange(changed){
    // Hide everything that's dependent on bases
    var basechecks = hideAllDependents('basecheck')
    // If it's checked
    if( changed!=null && changed.checked ){
	var aa;
	//-- Uncheck the other bases
	for(aa=basechecks.length-1;  aa>=0; aa--){
	    // If it's not check
	    if(changed!=basechecks[aa]){
	    	basechecks[aa].checked=false;
	    }
	}
	var baseId = changed.id.split(":")[1];
	setVisibility(elsByCls(DEP+baseId),true);
    }

    // Trigger module change
    moduleChange();
}


function isVisible(el){
// A trick documented here:
// https://stackoverflow.com/questions/19669786/check-if-element-is-visible-in-dom
    return el.offsetParent != null
}

/**
 * moduleChange handler
 */
function moduleChange(){
    // Hide everything
    var modchecks = hideAllDependents("modcheck");
    var aa;

    // Figure out what to show
    for(aa=modchecks.length-1; aa>=0; aa--){// function addNote(parent, classname, notemsg){
//     var noteparent = parent.getElementsByClassName("comp-notes");
//     noteparent[0].appendChild(note);
// }

// function areAnyMastersSelected(id){
//     var masters = elsByCls(id+"_m");
//     var bb;
//     for(bb=0; masters.length>bb; bb++){
//         if (masters[bb].checked){
//             return true;
//         }
//     }
//     return false;
// }
// function modifyMany( arrayOrElement, clazz, isAdd){
//     if( Array.isArray(arrayOrElement)){
// 	var aa;
// 	for(aa=arrayOrElement.length-1; aa>=0; aa--){
// 	    modifyClassHelper(arrayOrElement[aa], clazz, isAdd);
// 	}
//     }
//     else{
// 	modifyClassHelper(arrayOrElement, clazz, isAdd);
//     }
// }

	if(isVisible(modchecks[aa]) &&  
	   modchecks[aa].checked){
	    var modId = modchecks[aa].id.split(":")[1];
	    setVisibility(elsByCls(DEP+modId), true);
	}
    }

    // Remove all modified-by-module classes.
    var modified_sfrs = elsByCls(MODBYMODULE);
    for(aa=modified_sfrs.length-1; aa>=0; aa--){
	modified_sfrs[aa].classList.remove(MODBYMODULE);
    }
    var modifiednotes = elsByCls("modifiedbymodulenote");
    for(aa=modifiednotes.length-1; aa>=0; aa--){
	modifiednotes[aa].parentNode.removeChild(modifiednotes[aa]);
    }

    // Find all mod sfrs that are applied.
    var modifying = elsByCls("mod_sfrs");
    for(aa=modifying.length-1; aa>=0; aa--){
	if(isVisible(modifying[aa])){
	    var modname = modifying[aa].parentNode.previousSibling.innerHTML;
	    applyModifyingGroup(modifying[aa], modname);
	}
    }
    // Clear "Effective Selections Map"
    effSelMap={};
    effSelMapOwner={};
    // Build a new one
    var baseId=getAppliedBaseId();
    if(baseId==null) return;
    // selMap is generated dynamically
    var baseMap=selMap[baseId]
    addEffectiveSelectionIds(selMap[baseId], baseId, true);
    var modIds = getAppliedModuleIds();
    for (aa=modIds.length-1; aa>=0; aa--){
	modId=modIds[aa];
	addEffectiveSelectionIds(selMap[modId], modId, false);
    }
}

function addEffectiveSelectionIds(map, parentId, isbase){
    for(selId in map){
	var triggered;
	if( selId in effSelMap){	// If one exists
	    triggered=effSelMap[selId];	// Take it
	}				// 
	else{				// 
	    triggered={};		// Make a new one
	}				// 
	for( newone in map[selId] ){	// Go through all the new ones
	    triggered[newone]="1";	// And Them
	}
	effSelMap[selId]=triggered;
	// Map the id to the parent
	effSelMapOwner[selId]=parentId;
    }
}

/**
 *
 */
function applyModifyingGroup(parent, modname){
    var aa=0;
    var modsfrs = parent.getElementsByClassName("component");
    for(aa=modsfrs.length-1; aa>=0; aa--){
	var origId = modsfrs[aa].id.split(/\:(.+)/)[1];
	var modified = elById(origId);
	if(modified.classList.contains(MODBYMODULE)){
	    alert("Found collision with: " +origId);
	}
	else{
	    modified.classList.add(MODBYMODULE);
	    var note = document.createElement("div");
	    note.classList.add("modifiedbymodulenote");
	    note.innerHTML=
		""+
		"This component was redefined by the <a href='#"+ 
		modsfrs[aa].id+"'><i>" + modname+ "</i> module</a>";

	    modified.nextElementSibling.appendChild(note);
	}
    }
}


/**
 * Handles when the checkbox infront of an objective or optional
 * requirements is checked.
 */
function handleOCheck(el){
    modifyClass(el.parentElement.nextElementSibling, DISABLED, !el.checked);
}

/**
 * Adds/Removes a specific class from an element.
 */
function modifyClass( el, clazz, isAdd ){
    if(el == null){ return false;   }
    if(isAdd) el.classList.add(clazz);
    else      el.classList.remove(clazz);
    return true;
}




var sched;
function update(el){
    if(isCheckbox(el)){
	handleSelectionGroupUpdate(el);
        // Checkboxes are the only thing that can
	// change what is pulled in (more requirements or packages)
	handleSelections();
    }
    validateRequirements();
    // if (sched != undefined){
    //     clearTimeout(sched);
    // }
    // sched = setTimeout(delayedUpdate, 1000);
}

/**
 * This function figures out
 * what components to pull in
 * based on selections.
 */
function handleSelections(){
    var aa, bb;
    
    // Disable all sel-based requirements.
    forEach(elsByCls("sel-based"), function(el){
	el.classList.add(DISABLED);
    })

    // 
    var baseId=getAppliedBaseId();
    if (baseId == null) return;

    var selIds = [];
    for (sel in effSelMap){
	selIds.push([effSelMapOwner[sel],sel]);
    }
    while(selIds.length>0){
	var tuple  = selIds.pop();
	var ppowner=tuple[0];
	var selId=tuple[1];
	var chkbx = elById(ppowner+":"+selId);
	// If it's not checked, nothing to do
	// (no more to pull in)
	if (!chkbx.checked) continue;
	// If it's not active, nothing to do
	if (!isApplied(chkbx)) continue;
	var localMap =selMap[ppowner] ;
	var compIds = localMap[selId];
	for(compId in compIds){
	    var newSels = enableDominantComponent(compId);
	    // for(sel in newSels){
	    for(aa=newSels.length-1; aa>=0; aa--){
		var sel = newSels[aa];
		qq("Adding " + sel[0] + ":" + sel[1]);
		selIds.push(sel);
	    }
	}
    }
}

/**
 * 
 */
function enableDominantComponent(reqId){
    var comps = elsByCls(reqId);
    var aa=0;
    for(aa=comps.length-1; 
	aa>=0;
	aa--)
    {
	var comp=comps[aa];
	// If it's not visible, it's not the one
	if (!isVisible(comp)) continue;
	// If it's modified, it's not the one
	if (comp.classList.contains('modifiedbymodule')) continue;
	// We can assume we found it
	// If it's already enabled, just leave
	if (!comp.classList.contains(DISABLED)) 
	    return [];
	// Else
	// Enable it
	comp.classList.remove(DISABLED);
	// var splittedID = comp.id.split(":")[0];
	var selboxes=comp.getElementsByClassName('selbox');
	var bb, ret=[];
	for(bb=selboxes.length-1; bb>=0; bb--){
	    if(selboxes[bb].hasAttribute("id")){
		ret.push(selboxes[bb].id.split(":"));
	    }
	}
	//
	return ret;
    }
    error("Could not find an active requirement with ID: " +reqId);
    return [];
}

/**
 * Figures out if this element is part of an applied component
 */
function isApplied(el){
    // ---
    // Need to clean up this function
    // --
    while(true){
        if(el.classList.contains("component")){
           break;
        }
	if('HTML'==el.tagName) return false;
	el = el.parentElement;
    }
    // If the component isn't visible
    if(!isVisible(el)) return false;

    // If the component
    if(el.classList.contains(DISABLED))         return false;
    if(el.classList.contains('modifiedbymodule')) return false;

    return true;
}

/**
 * Gets a list of the active module ids.
 * @returns a list of modules that are checked
 */
function getAppliedModuleIds(){
    var appmods=[];
    var aa=0;
    var modchecks=elsByCls('modcheck');
    for(aa=modchecks.length-1;
	aa>=0;
	aa--){
	if( isVisible(modchecks[aa]) && modchecks[aa].checked){
	    appmods.push(modchecks[aa].id.split(':')[1])
	}
    }
    return appmods;
}

/**
 * Gets the id of the base that is checked.
 * @return the id of the checked base (or null if there's none).
 */
function getAppliedBaseId(){
    var basechecks=elsByCls('basecheck');
    var aa=0;
    for(aa=basechecks.length-1; aa>=0; aa--){
	if(basechecks[aa].checked) 
	    return basechecks[aa].id.split(':')[1];
    }
    return null;
}


function validateSelectables(sel){
    var child  = sel.firstElementChild;
    if( child.tagName == 'UL' ){
        child=child.firstElementChild;
    }
    var numChecked=0;
    // Now we either have a checkbox or an li
    while(child!=null){
        if(child.tagName == "LI"){
            if(child.firstElementChild.checked){
                numChecked++;
                if( !reqValidator(child) ){
                    return false;
                }
            }
        }
        else if(child.checked){
            numChecked++;
            if( !reqValidator(child) ){
                return false;
            }
        }
        child = child.nextElementSibling;
    }
    if(numChecked==0) return false;
    if(numChecked==1) return true;
    return !sel.classList.contains("onlyone");
}

function setFocusOnComponent(comp){
    comp.getElementsByClassName('f-comp-title')[0].focus();
    return true;
}

function handleKey(event){
    if(! event.ctrlKey ) return;
    if (event.key=='?'){
        handleHelpRequest();
	return "";
    }
    var key = event.which || event.keyCode;


    var curr = document.activeElement;
    var comps = elsByCls('component');
    if (comps.length == 0) return;
    if (curr==document.body){
        curr=null;
    }
    var aa;
    if( key == 28){
        if (curr == null) curr =  comps[comps.length-1];
        for(aa=comps.length-1; aa >= 0; aa--){
            if(comps[aa] == curr) break;
            if(comps[aa].contains(curr)) break;
        }
        for(aa--; aa>=0; aa--){
            if(comps[aa].classList.contains(DISABLED)) continue;
            if(comps[aa].classList.contains('invalid')){
                return setFocusOnComponent(comps[aa]);
            }
        }
        return "";
    }
    else if( key == 30){
        if (curr == null) curr =  comps[0];
        for(aa=0; comps.length > aa; aa++){
            if(comps[aa] == curr) break;
            if(comps[aa].contains(curr)) break;
        }
        for(aa++; comps.length > aa; aa++){
            if(comps[aa].classList.contains(DISABLED)) continue;
            if(comps[aa].classList.contains('invalid')){
                return setFocusOnComponent(comps[aa]);
            }
        }
        return "";
    }
}
function handleHelpRequest(){
    var helppane = elById('help-pane');
    if(helppane.style.display!='block'){
	helppane.style.display='block';
    }
    else{
	helppane.style.display='none';
    }
}

function reqValidator(elem){
    var child = elem.firstElementChild;
    var ret;
    while(child != null){
        if( child.classList.contains("selectables")){
            ret = validateSelectables(child);
            if(!ret) return false;
        }
        else if( child.classList.contains("assignment")){
            if(! child.value) return false;
        }
        else{
            ret = reqValidator(child);
            if(!ret) return false;
        }
        child = child.nextElementSibling;
    }
    return true;
}

/**
 * This validates all requirements regardless
 * if they are visible, disabled,...
 */
function validateRequirements(){
    var aa;
    // Check all requirements
    var reqs = elsByCls('requirement');
    for(aa=0; reqs.length > aa; aa++){
        if(reqValidator(reqs[aa])){
            addRemoveClasses(reqs[aa],'valid','invalid');
        }
        else{
            addRemoveClasses(reqs[aa],'invalid','valid');
        }
    }
    // Check all components
    var components = elsByCls('component');
    for(aa=0; components.length > aa; aa++){
        if(components[aa].getElementsByClassName('invalid').length == 0 ){
            addRemoveClasses(components[aa],'valid','invalid');
        }
        else{
            addRemoveClasses(components[aa],'invalid','valid');
        }
    }
}

function setCheckboxState(cbox, isEnabled){
    if(isEnabled){
	cbox.disabled=false;
	cbox.classList.remove(DISABLED);
	cbox.nextSibling.classList.remove(DISABLED);
    }
    else{
	cbox.disabled=true;
	cbox.classList.add(DISABLED);
	cbox.nextSibling.classList.add(DISABLED);
    }
}

function isExclusive(chk){
    return chk.classList.contains("exclusive");
}

/**
 * Handles the UI for a group of selections
 * @param chk Is the checkbox that the action happened on
 */
function handleSelectionGroupUpdate(chk){
    var aa; 
    var group=[];
    var isSomethingChecked = populateSelectableGroup(chk,group);

    for(aa=0; group.length>aa ; aa++){
	if(isSomethingChecked){                                    // If something's checked
	    if(chk==group[aa]) continue;                           // We're not doing anything to chk
	    if(chk.checked){                                       // If we just checked
		if( isExclusive(chk) || isExclusive(group[aa])){   // And on or the oth
		    setCheckboxState(group[aa], false);		    
		}
	    }
	    else{   		// It's an uncheck event
		if( isExclusive(group[aa]) && !group[aa].checked){// And current is exclusive and not checked.
		    setCheckboxState(group[aa], false);		    
		}
	    }
	}
	else{
	    setCheckboxState(group[aa], true);
	}
    }
}


// Function to expand and contract a given div
function toggle(descendent) {
    var isAddHide = !descendent.parentNode.classList.contains('hide');
    modifyClass( descendent.parentNode, 'hide', isAddHide);
}


function addRemoveClasses(elem, addClass, remClass){
    elem.classList.remove(remClass);
    elem.classList.add(addClass);
}

function delayedUpdate(){
    var elems = elsByCls("val");
    performActionOnElements(elems, saveToCookieJar);
    saveAllCookies(cookieJar);
    sched = undefined;
}

function transform(xsl, xml){
    // code for IE
    if (window.ActiveXObject ){
        return xml.transformNode(xsl);
    }
    // code for Chrome, Firefox, Opera, etc.
    else if (document.implementation && document.implementation.createDocument){
        var xsltProcessor = new XSLTProcessor();
	xsltProcessor.importStylesheet(xsl);
        return xsltProcessor.transformToFragment(xml, document);
    }
}

// ##################################################
// #          Logging things
// ##################################################
function qq(msg){
    console.log(msg);
}
    
function logit(val){
    if( prefix=='debug'){
	console.log(val);
    }
}

// ##################################################
// #         Blob the Builder
// ##################################################
// Took this from stack overflow
var MyBlobBuilder = function() {
  this.parts = [];
}

MyBlobBuilder.prototype.append = function(part) {
  this.parts.push(part);
  this.blob = undefined; // Invalidate the blob
};

MyBlobBuilder.prototype.getBlob = function(mimetype) {
  if (!this.blob) {
    this.blob = new Blob(this.parts, { type: mimetype });
  }
  return this.blob;
};
