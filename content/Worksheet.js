const PREAMBLE = "<html xmlns='http://www.w3.org/1999/xhtml'><head><title></title><style type='text/css>\n"
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
const AMPERSAND=String.fromCharCode(38);
const LT=String.fromCharCode(60);

/// Holds the prefix for the settings we care about
var prefix="";

/// Dictionary to hold all the cookies
var cookieJar=[];


//////////////////////////////////////////////////
// Aliases
//////////////////////////////////////////////////

/**
 * Aliases getElementsByClassName
 */
function elsByCls(classname){
    return document.getElementsByClassName(classname);
}

/**
 * Aliases getElementById
 */
function elById(id){
    return document.getElementById(id);
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
function isPrevCheckbox(elem){
    var ret = prevCheckbox;
    prevCheckbox = false;
    return ret;
}

function isCheckbox(elem){
    return elem.getAttribute("type") == "checkbox";
}

function getId(index){
    return "v_" + index;
} 


// function retrieveBase(name){
//     var xhttp = new XMLHttpRequest();
//     xhttp.onreadystatechange = function() {
//         if (this.readyState == 4 && this.status == 200) {
// 	    pp_xml = xhttp.responseXML.documentElement
//         }
//     };
//     xhttp.open("GET", name, true);
//     xhttp.send();
// }


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
    var elems = elsByCls("val");
    //    performActionOnElements(elems, retrieveFromCookieJar);
    validateRequirements();
    handleEnter(null);
    baseChange(null)
}


// ##################################################
// #               Cookie functions
// ##################################################

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

function fullReport(){
    var pp_xml = new DOMParser().parseFromString(atob(ORIG64), "text/xml");
    //- Fix up selections
    var xsels = pp_xml.evaluate("//cc:selectable", pp_xml, resolver, XPathResult.ANY_TYPE, null);
    var hsels = elsByCls('selbox');
    var hsindex = 0;
    var choosens = new Set();
    while(true){
        var xmlsel = xsels.iterateNext();
        if( xmlsel == null ) break;
        if( hsindex == hsels.length) break;
        if( hsels[hsindex].checked ){
            // Can't mutate it while iterating
            // Keep a set
            //xmlsel.setAttribute("selected", "yes");
            choosens.add(xmlsel);
        }
        hsindex++;
    }
    for(let choosen of choosens){
        choosen.setAttribute("selected", "yes");
    }
    var ctr=0;

    //- Fix up assignments
    var xassigns = pp_xml.evaluate("//cc:assignable", pp_xml, resolver, XPathResult.ANY_TYPE, null)
    var assignments = [];
    while(true){
        var xassign = xassigns.iterateNext();
        if(xassign == null) break;
        assignments[ctr] = xassign;
        ctr++;
    }
    var hassigns = elsByCls('assignment');
    for(ctr = 0; hassigns.length>ctr; ctr++){
        if(hassigns[ctr].value){
            assignments[ctr].setAttribute("val", hassigns[ctr].value);
        }
    }

    //- Fix up components
    var xcomps = pp_xml.evaluate("//cc:f-component|//cc:a-component", pp_xml, resolver, XPathResult.ANY_TYPE, null);
    var hcomps = elsByCls('component');
    var disableds = new Set();
    for(ctr=0; hcomps.length>ctr; ctr++){
        var xcomp = xcomps.iterateNext();
        if(xcomp==null) break;
        if( hcomps[ctr].classList.contains('disabled') ){
            disableds.add(xcomp);
        }
    }
    for(let disabled of disableds){
        disabled.setAttribute("disabled", "yes");
    }
    logit(pp_xml);

    
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
    var htmlReport = transform(xsl, pp_xml, document);
    var rNode = elById('report-node');
    // Clear its children
    while(rNode.firstChild){
	rNode.removeChild( rNode.firstChild );
    }
    rNode.appendChild( htmlReport );
    var myBlobBuilder = new MyBlobBuilder();
    myBlobBuilder.append(PREAMBLE);
    myBlobBuilder.append(rNode.innerHTML);
    myBlobBuilder.append(EPILOGUE);
    initiateDownload('FullReport.html', myBlobBuilder.getBlob("text/html"));
}

function gatherAllAppliedRequirements(){
}


function generateReport(){
    var report = LT+"?xml version='1.0' encoding='utf-8'?>\n"
    var aa;
    report += LT+"report xmlns='https://niap-ccevs.org/cc/pp/report/v1'>"

    var kids = elsByCls('requirement');
    var isInvalid = false;
    for(aa=0; kids.length>aa; aa++){
        if( kids[aa].classList.contains("invalid") ){
            isInvalid = true;
        }
        report += "\n"+LT+"req id='"+kids[aa].id+"'>";
        report +=getRequirement(kids[aa]);
        report += LT+"/req>\n";
    }
    report += LT+"/report>";
    if( isInvalid ){
        alert("Warning: You are downloading an incomplete report.");
    }
    var blobTheBuilder = new MyBlobBuilder();
    blobTheBuilder.append(report);

    initiateDownload('Report.xml', blobTheBuilder.getBlob("text/xml"));
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
            // Skip first row
            for(var row=1; rows.length>row; row++){
                ret += LT+"management-function>";
                var cols=rows[row].getElementsByTagName("td");
                for( var col=1; cols.length>col; col++){
                    ret += LT+"val>"; 
                    if( cols[col].children.length == 0 ){
                        ret += cols[col].textContent;
                    }
                    else{
                        var si = cols[col].children[0].selectedIndex;
                        if(si!=-1){
                            ret += cols[col].children[0].children[si].textContent;
                        }
                    }
                    ret += LT+"/val>";
                }
                ret += LT+"/management-function>\n";
            }
            ret += LT+"/management-function-table>";
        }
        else{
            ret+=getRequirements(node.children);
        }
    }
    // If it's text
    else if(node.nodeType==3){
        return node.textContent;
    }
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
	var hideOrDisable = elements[aa].classList.contains('hidable')?"hidden":"disabled";
	modifyClass(elements[aa], hideOrDisable, !visibility);
    }
}

function hideAllDependents(classname){
    var aa;
    var masters = elsByCls(classname);
    for(aa=masters.length-1; aa>=0; aa--){
	var id = masters[aa].id.split(":")[1];
	setVisibility(elsByCls("dep:"+id), false);
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
	setVisibility(elsByCls("dep:"+baseId),true);
    }

    // Trigger module change
    moduleChange();
}


function isVisible(el){
// A trick documented here:
// https://stackoverflow.com/questions/19669786/check-if-element-is-visible-in-dom
    return el.offsetParent != null
}

function moduleChange(){
    // Hide everything
    var modchecks = hideAllDependents("modcheck");
    var aa;
    // Figure out what to show
    for(aa=modchecks.length-1; aa>=0; aa--){
	// 
	if(isVisible(modchecks[aa]) &&  
	   modchecks[aa].checked){
	    var modId = modchecks[aa].id.split(":")[1];
	    setVisibility(elsByCls("dep:"+modId), true);
	}
    }

    // Remove all modified-by-module classes.
    var modified_sfrs = elsByCls("modifiedbymodule");
    for(aa=modified_sfrs.length-1; aa>=0; aa--){
	modified_sfrs[aa].classList.remove("modifiedbymodule");
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
	if(modified.classList.contains("modifiedbymodule")){
	    alert("Found collision with: " +origId);
	}
	else{
	    modified.classList.add("modifiedbymodule");
	    var note = document.createElement("div");
	    note.classList.add("modifiedbymodulenote");
	    note.innerHTML=
		""+
		"This requirement was redefined by the <a href='#"+modsfrs[aa].id+"'><i>" + modname+ "</i> module</a>";
	    modified.getElementsByClassName("comp-notes")[0].appendChild(note);
	}
    }
}

function addNote(parent, classname, notemsg){
    var noteparent = parent.getElementsByClassName("comp-notes");
    noteparent[0].appendChild(note);
}

function areAnyMastersSelected(id){
    var masters = elsByCls(id+"_m");
    var bb;
    for(bb=0; masters.length>bb; bb++){
        if (masters[bb].checked){
            return true;
        }
    }
    return false;
}

function modifyMany( arrayOrElement, clazz, isAdd){
    if( Array.isArray(arrayOrElement)){
	var aa;
	for(aa=arrayOrElement.length-1; aa>=0; aa--){
	    modifyClassHelper(arrayOrElement[aa], clazz, isAdd);
	}
    }
    else{
	modifyClassHelper(arrayOrElement, clazz, isAdd);
    }
}

/**
 * Handles when the checkbox infront of an objective or optional
 * requirements is checked.
 */
function handleOCheck(el){
    modifyClass(el.parentElement.nextElementSibling, "disabled", !el.checked);
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



/* 
 * This design does not account for cascading dependent components .
 * There are none currently, so this limitation is acceptable.
 */
function updateDependency(ids){
    var aa, bb;

    // Run through all 
    for(aa=0; ids.length>aa; aa++){     
        var enabled = areAnyMastersSelected(ids[aa]);
        // We might need to recur on these if the selection-based
        // requirement had a dependent selection-based requirement.
        modifyClass( elById(ids[aa]), "disabled", !enabled);
        var sn_s = elsByCls(ids[aa]);
        for(bb=0; sn_s.length>bb; bb++){
            modifyClass(sn_s[bb], "disabled", !enabled)
        }
    }
}

var sched;
function update(el){
    if(isCheckbox(el)){
	handleSelectionGroupUpdate(el);
    }
    validateRequirements();
    // if (sched != undefined){
    //     clearTimeout(sched);
    // }
    // sched = setTimeout(delayedUpdate, 1000);
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
            if(comps[aa].classList.contains('disabled')) continue;
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
            if(comps[aa].classList.contains('disabled')) continue;
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

function validateRequirements(){
    var aa;
    var reqs = elsByCls('requirement');
    for(aa=0; reqs.length > aa; aa++){
        if(reqValidator(reqs[aa])){
            addRemoveClasses(reqs[aa],'valid','invalid');
        }
        else{
            addRemoveClasses(reqs[aa],'invalid','valid');
        }
    }
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
	cbox.classList.remove('disabled');
	cbox.nextSibling.classList.remove('disabled');
    }
    else{
	cbox.disabled=true;
	cbox.classList.add('disabled');
	cbox.nextSibling.classList.add('disabled');
    }
}

function isExclusive(chk){
    return chk.classList.contains("exclusive");
}
/**
 *
 * @param chk Is the checkbox that the action happened on
 */
function handleSelectionGroupUpdate(chk){
    var aa; 
    var group=[];
    var isSomethingChecked = populateSelectableGroup(chk,group);

    for(aa=0; group.length>aa ; aa++){
	if(isSomethingChecked){                                    // If something's checked
	    if(chk==group[aa]) continue;                           // We're not doing anything to chk
	    qq("Here");
	    if(chk.checked){                                       // If we just checked
		if( isExclusive(chk) || isExclusive(group[aa])){ // And on or the oth
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

function transform(xsl, xml, owner){
    // code for IE
    if (window.ActiveXObject ){
        return xml.transformNode(xsl);
    }
    // code for Chrome, Firefox, Opera, etc.
    else if (document.implementation && document.implementation.createDocument){
        var xsltProcessor = new XSLTProcessor();
	xsltProcessor.importStylesheet(xsl);
        return xsltProcessor.transformToFragment(xml, owner);
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




