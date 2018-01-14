
   /*************************************************************************************
          ** LIBRARY FOR WORKING WITH JAVASCRIPT OBJECTS AND ARRAYS **
          
          Library Info Section of Comments:
          =================================
          Project Location on Github:    https://github.com/OrvilleChomer/orvObjLib
          Project Info on my Blog:       TBD
          
          Shameless Self Promotion Section of Comments!:
          ==============================================
          Library Author:                Orville Chomer
          Bio Page:                      http://chomer.com/bio/
          Main Website:                  http://chomer.com/
          YouTube Channel:               https://www.youtube.com/c/OrvilleChomer
          Twitter Handle:                @orville
          Linked In Profile Page:        https://www.linkedin.com/in/OrvilleChomer/
          Copy of Resume/CV (PDF):       http://chomer.com/wp-content/2017/12/OrvilleChomerResume2017.pdf
          Copy of Resume/CV (docx):      http://chomer.com/wp-content/2017/12/OrvilleChomerResume2017.docx
          
          
          -----------------------------------------------------------------------------
          
          Change Log:        
          
          Change Date                                                           Version
          ============                                                          =======
          12/27/2017      Initial log entry. Filled in these comments better!    .002
          
          01/03/2018      Added support for "freeze", "seal",                    .003
                          "preventExtensions"
                          
          01/14/2018      Changed method name:  "setCopyMethods()"   to:         .004
                          "setCopyMethodsFlagTo()"
                          to make its use more clear.
          
          
        ************************************************************************** 
        function below is a Constructor... use with "new" key word.
        
          Example:    var orvObjLib = new OrvObjLib();
          
          Note that if you are doing any asynchronous operations with this library...
          think Ajax calls or indexedDb calls.... you should probably declare your
          object variable for this at the global level.
          
          This library has a set of process Queues that it uses to keep track of pending
          work for asynchronous operations.
          
          ---------------------------------------------          
        Version used for Production code should be minified (of course).
    *************************************************************************************/
	function OrvObjLib() {
	
		"use strict"
		
	    // instance variables:
	    var nCurrentDebugLevel = 0;  // 0 = no debug level
		var alteredObjsByIndex = [];
		var alteredObjsByKey = [];
		var objKeyLookup = new WeakMap;  // 12/31/2017
		var nodesByKey = [];   // used when deserializing object
		var self = this;
		var nNextKeyNum = 0;
		var serializedObj;
		var bCopyMethods = false;
		var bProduceMinifiedResults = false;		
		var sPiDbName = "defaultDb";

        var taskQueueByIndex = [];
        var taskQueueById = [];
        var completedTasksByIndex = [];
        var completedTasksById = [];
		
        /*
	    // ??? running total instance variables:
	    
	     ???
	    /* var nTotalStringProps = 0;
	    var nTotalNumProps = 0;
	    var nTotalDateProps = 0;
	    var nTotalBooleanProps = 0;
	    var nTotalObjProps = 0;
	    var nTotalArrProps = 0;
	    var nTotalFrozenObjs = 0;
	    var nTotalFrozenArrs = 0;
	    */
	    
	   /*******************************************************************************
	       Used to clone JavaScript objects or arrays.
	       
	       First, it tries to use native functionality...
	       If there aren't any circular references, it will work, and it will work faster!
	       
	       If it does Not work... it uses this library to do the work!
	    *******************************************************************************/	    
	    self.cloneObj = function(inputObj) {
	    	var outputObj;
	    	var serObj,deserObj;
	    	
	    	try {
	    		// try vanilla Js before using this library's serialize/deserialize code
	    		outputObj = JSON.parse(JSON.stringify(inputObj));
	    	} catch(err) {
	    		serObj = self.serializeObj(inputObj);
	    		deserObj = self.deserializeObj(serObj);
	    		outputObj = deserObj.output;
	    	} // end of try/catch block
	    	
	    	return outputObj;
	    } // end of method cloneObj()
	    
	    
		
	   /********************************************************
	      Takes instructions in serialized object, and from them
	      builds a new copy of the original object
	    ********************************************************/
		self.deserializeObj = function(inputSerializedObj) {
			var nMax,n;
			var resultObj = baseDeserializedObj();
			var commands,cmd;
			var bRootObjSet = false;
			var obj,arr;
			
			resultObj.deserializationDate = new Date();
			
			nodesByKey = [];  // clear out anything there Might have been from before
			
			commands = inputSerializedObj.creationInstructions;
			
			// process through the commands to re-constitute original object/array:
			nMax = commands.length;
			for (n=0;n<nMax;n++) {
				cmd = commands[n];
				switch(cmd.cmd) {
					case "create-obj":
						obj = aa_deser_createObj(cmd, resultObj.procLog);
						if (!bRootObjSet) {
							resultObj.output = obj;
							bRootObjSet = true;
						} // end if
						break;
					case "create-array":
						arr = aa_deser_createArray(cmd, resultObj.procLog);
						if (!bRootObjSet) {
							resultObj.output = arr;
							bRootObjSet = true;
						} // end if					
						break;
					case "create-array-property":
						aa_deser_createArrayProperty(cmd, resultObj.procLog);
						break;
					case "add-method":
						aa_deser_addMethod(cmd, resultObj.procLog);
						break;
					case "add-object-to-array":
						aa_deser_addObjectToArray(cmd, resultObj.procLog);
						break;
					case "add-array-to-array":
						aa_deser_addArrayToArray(cmd, resultObj.procLog);
						break;
					case "add-basic-value-to-array":
					    aa_deser_addBasicValueToArray(cmd, resultObj.procLog);
						break;
					case "add-date-value-to-array":
						aa_deser_addDateValueToArray(cmd, resultObj.procLog);
						break;
					case "create-object-property":
						aa_deser_createObjProperty(cmd, resultObj.procLog);
						break;
					case "create-basic-property":
						aa_deser_createBasicProperty(cmd, resultObj.procLog);
						break;
					case "create-date-property":
						aa_deser_createDateProperty(cmd, resultObj.procLog);
						break;
					case "freeze-obj":
						// used for both objects and arrays.
						aa_deser_freezeObj(cmd, resultObj.procLog);
						break;
					case "prevent_ext":
						// used for both objects and arrays.
						aa_deser_preventExt(cmd, resultObj.procLog);
						break;
					case "seal-obj":
						// used for both objects and arrays.
						aa_deser_sealObj(cmd, resultObj.procLog);
						break;
					default:
						break;
				} // end of switch(cmd.cmd)
			} // next n
			
			nodesByKey = []; // since we are done, clear out to free up memory

			resultObj.completionTimestamp = new Date();
			
			// how long did it take?
			resultObj.totalMs = getMsDif(resultObj.deserializationDate, resultObj.completionTimestamp);
			
			return resultObj;
		} // end of method deserializeObj()
		
		
	   /*******************************************************************************
	       Must be used on a JSON string that was created from a serialized
	       object.
	    *******************************************************************************/		
		self.deserializeJsonString = function(sJson) {
			var objWork = JSON.parse(sJson);
			
			return self.deserializeObj(objWork);
		} // end of method deserializeJsonString()	
				
				
				
		
	   /*******************************************************************************
	   
	   	   This method is used to load an object out of a local indexedDb
	   	   database based on the database its in... and the object's primary key.
	   	   
	       use: orvObjLib.loadObjFromDb(params).onsuccess = function(obj, [info]) {
	       } 
	    *******************************************************************************/
	    self.loadObjFromDb = function(params) {
	    	var obj = params.getObj;
	    	var sKey = params.withKey;
	    } // end of method loadObjFromDb()	
		
		
	   /*******************************************************************************
	       Merges data from one complex object into the data of another complex
	       object.
	       
	       Primary Key Defs param is an Array.
	       
	       Sample primary key defs:
	           {"objPropName": "customer", "pkPropName": "custId"}
	           {"objPropName": "dealSections", "pkPropName": "dealSectionId"}
	    *******************************************************************************/		
		self.merge = function(params) {
			var dataFromObj = params.dataFromObj;
			var objBeingModified = params.intoThisObj;
			var primaryKeyDefs = params.usingPrimaryKeyDefs;
			
		} // end of method merge()
		
		
		
		
	   /*******************************************************************************
	   
	   	   Takes JSON created from object that was serialized,
	   	   and returns a copy of the original object (or array)
	    *******************************************************************************/
	    self.parse = function(sJson) {
	    	var objWork = self.deserializeJsonString(sJson);
	    	
	    	return objWork.output;
	    } // end of method loadObjFromDb()			
		
		
	   /*******************************************************************************
	        Saves Js object to indexed Db database with what is basically a 
	        Primary Key!
	        
	    *******************************************************************************/			
		self.saveObjToDb = function(params) {
			var inputObj = params.inputObj;
			var sKey = params.key;
			var sDbName = params.dbName;  // sPiDbName - fix code later
			var objToSave = self.deserializeObj(inputObj);
			
		} // end of method saveObjToDb()
		
		
		
		
	   /*******************************************************************************
	        Takes a JavaScript object or array and creates a "serialized object."
	        This object will contain a list of commands which can be used by
	        the deserializeObj() method to rebuild a copy of the original object or
	        array.
	    *******************************************************************************/		
		self.serializeObj = function(inputObj) {
			var sRootKey;
			var sDataType = getPropValueType(inputObj);
			var bRootNodeAdded = false;
			var nDepth = -1;
			var sContainer = "~root";
			var sContainerDataType = "n/a";
			
			// at least for now:  -- cannot serialize a DOM object
			if (sDataType === "domItem") {
				initSerializedObj();
				addError("Cannot serialize a DOM object", "usage");
				serializedObj.status = "aborted";
				return serializedObj;
			} // end if
			
			cleanupWork(inputObj);

			initSerializedObj();
			
			sRootKey = setObjKey(inputObj, sDataType);  // set object/array key on top-level object/array
			
			// add command to create root node:
			switch(sDataType) {
				case "object":
					makeCreateObjectCommand(sRootKey);
					bRootNodeAdded = true;
					break;
				case "array":
					makeCreateArrayCommand(sRootKey);
					bRootNodeAdded = true;
					break;
				default:
					break;
			} // end of switch()
			
			// top level was not an object or array so we are aborting this operation
			if (!bRootNodeAdded) {
				addError("Input parameter is neither a JS Object or a Js Array", "usage");
				serializedObj.status = "aborted";
				return serializedObj;
			} // end if
			
			if (sDataType === "object") {
				processInputObj(inputObj, nDepth, sContainer, sContainerDataType); // recursively enumerate through object generating commands
			} else {
				processArray(inputObj, nDepth, sContainer, sContainerDataType);
			} // end if/else
			
			serializedObj.completionTimestamp = new Date();
			
			clearObjMarkers(inputObj);
			cleanupWork(inputObj); 
			
			// how long did it take?
			serializedObj.totalMs = getMsDif(serializedObj.serializationDate, serializedObj.completionTimestamp);

			
			return serializedObj;
		} // end of method serializeObj()
		
		
	   /*******************************************************************************
	      Use this if you do not want to specify the db name every time you call
	      saveObjToDb() method
	      or you do not want to use the default db name
	    *******************************************************************************/		
		self.setDbName = function(siDbName) {
		
			sPiDbName = siDbName;
		} // end of method setDbName()
		
		
		
	   /*******************************************************************************
	       Set boolean flag to either true or false for copying (serializing)
	       any methods that may be part of the input object.
	       ... the default value is (false).
	    *******************************************************************************/		
		self.setCopyMethodsFlagTo = function(bSetting) {
			bCopyMethods = bSetting;
		} // end of method self.setCopyMethods()
		
		
	   /*******************************************************************************
	   
	   	   By default the sorting is case insensitive!
	    *******************************************************************************/		
		self.sortArrayOfObjects = function(params) {
			var arr = self.cloneObj(params.thisArray);
			var sortFields1 = params.sortFields;
			var nMax = arr.length;
			var nMax2 = sortFields1.length,nMax3;
			var n,n2,obj,fld,sPropName,sOrder,nPos,sWork;
			var sortFields2 = [];
			var wrk,sDefault,prop,elementSortInfo,elementFieldInfo;
			var bCaseInsensitive = true;
			var aNumberFieldLst = [],nDecPlaces;
			
			// build our little sort order objects...
			for (n=0;n<nMax2;n++) {
				sWork = sortFields1[n];
				nPos = sWork.indexOf(" ");
				sOrder="asc";
				sDefault = "";
				
				if (nPos>0 && nPos < sWork.length-1) {
					wrk = sWork.split(" ");
					sPropName = wrk[0];
					sOrder = wrk[1];
				} else { 
					sPropName = sWork;
				} // end if
				
				fld = {};
				fld.propName = sPropName;
				fld.sortOrder = sOrder;
				fld.maxFieldLength = 0;
				fld.maxNumericValue = 0; // only used if data format becomes numeric!
				fld.maxDecPos = 0; // only used if data format becomes numeric!
				fld.dataFormat = "string";
				fld.defaultValue = sDefault; // value if property is missing
				
				sortFields2[sortFields2.length] = fld;
			} // next n
			
			nMax2= sortFields2.length;
			
			// okay, loop through our array & collect our property sort data
			for (n=0;n<nMax;n++) {
				obj = arr[n];
				elementSortInfo = {};
				elementSortInfo.arrayIndex = n;
				elementSortInfo.fieldInfoByIndex = [];
				
				obj["__orvSortInfo__"] = elementSortInfo;
				
				// loop through list of fields to sort:
				for (n2=0;n2<nMax2;n2++) {
					fld = sortFields2[n2];
					
					elementFieldInfo = {};
					elementFieldInfo.dataFormat = fld.dataFormat;
					nMax3 = elementSortInfo.fieldInfoByIndex.length;
					elementSortInfo.fieldInfoByIndex[nMax3] = elementFieldInfo;
					prop = obj[fld.propName];
					
					if (typeof prop !== "undefined") {
						sWork = prop; // prop contains a value so... get it
					} else {
						sWork = fld.defaultValue;
					} // end if/else
					
					if (typeof prop === "number" && fld.dataFormat === "string") {
						fld.dataFormat = "number";
						aNumberFieldLst[aNumberFieldLst.length] = fld;
					} // end if

					if (bCaseInsensitive) {
						elementFieldInfo.value = sWork.toLowercase();						
					} else {
						elementFieldInfo.value = sWork;
					} // end if/else
					
					if (sWork.length > fld.maxFieldLength) {
						fld.maxFieldLength = sWork.length;
					} // end if
				} // next n2
			} // next n
			
			// next phase do some post processing on number fields:
			// ----------------------------------------------------
			
			// first, figure out largest decimal position
			nMax2 = aNumberFieldLst.length;
			
			// re-loop through main array:
			for (n=0;n<nMax;n++) {
				obj = arr[n];
				
				// only process sort fields for numbers
				// find largest decimal place
				for (n2=0;n2<nMax2;n2++) {
					fld = aNumberFieldLst[n];
					prop = obj[fld.propName]-0;
					nDecPlaces = decimalPlacesOfNumber(prop);
					
					if (nDecPlaces > fld.maxDecPos) {
						fld.maxDecPos = nDecPlaces;
					} // end if
				} // next n2
			} // next n
			
			return arr;
		} // end of method self.sortArrayOfObjects()
		
		
	   /*******************************************************************************
	       Serializes and stringifies your object or array all in one shot!
	    *******************************************************************************/		
		self.stringify = function(inputObj) {
			return JSON.stringify(self.serializeObj(inputObj));
		} // end of method stringifyObj()
		
		
		
		
		
		// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
		//   PRIVATE FUNCTIONS - PRIVATE FUNCTIONS - PRIVATE FUNCTIONS
		// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
		
		
		
	   /*******************************************************************************
	    *******************************************************************************/			
		function aa_deser_addArrayToArray(cmd, procLog) {
		   var arr = nodesByKey[cmd.ownerKey];  // key to parent array
		   var arr2 = nodesByKey[cmd.arrayKey];
		   
		   arr[cmd.arrayIndex] = arr2;  // index# to place in parent array
		   aa_deser_log(cmd, procLog);
		} // end of function aa_deser_addArrayToArray()
		
				
	   /*******************************************************************************
	    *******************************************************************************/			
		function aa_deser_addBasicValueToArray(cmd, procLog) {
		   var arr = nodesByKey[cmd.ownerKey];
		   
		   arr[cmd.arrayIndex] = cmd.value;
		   aa_deser_log(cmd, procLog);
		} // end of function aa_deser_addBasicValueToArray()
		
						
	   /*******************************************************************************
	    *******************************************************************************/			
		function aa_deser_addDateValueToArray(cmd, procLog) {
		   var arr = nodesByKey[cmd.ownerKey];
		   
		   arr[cmd.arrayIndex] = new Date(cmd.value);
		   aa_deser_log(cmd, procLog);
		} // end of function aa_deser_addDateValueToArray()
		
		

		
		
							
	   /*******************************************************************************
	    *******************************************************************************/								
		function aa_deser_addMethod(cmd, procLog) {
			var obj = nodesByKey[cmd.ownerKey];  // object to add method to
			var sMethodName = cmd.methodName;
			var sArgs = cmd.args;
			var sCode = cmd.jsCode;
			var fn;
			
			if (sArgs.length === 0) {
				fn = new Function(sCode);
			} else {
				fn = new Function(sArgs, sCode);
			} // end if/else
			
			obj[sMethodName] = fn;
			
			aa_deser_log(cmd, procLog);
		} // end of function aa_deser_addMethod()
		
		
		
	   /*******************************************************************************
	    *******************************************************************************/			
		function aa_deser_addObjectToArray(cmd, procLog) {
		   var arr = nodesByKey[cmd.ownerKey];
		   var obj = nodesByKey[cmd.objectKey];
		   
		   arr[cmd.arrayIndex] = obj;
		   aa_deser_log(cmd, procLog);
		} // end of function aa_deser_addObjectToArray()
		
		
	   /*******************************************************************************
	    *******************************************************************************/		
		function aa_deser_createArray(cmd, procLog) {
			var arr = [];
			
			nodesByKey[cmd.key] = arr;   // add to lookup
			aa_deser_log(cmd, procLog);
			
			return arr;
		} // end of function aa_deser_createArray()				
		
		
	   /*******************************************************************************
	    *******************************************************************************/				
		function aa_deser_createArrayProperty(cmd, procLog) {
			var obj = nodesByKey[cmd.ownerKey];
			var arr = nodesByKey[cmd.arrayKey];
			
			obj[cmd.name] = arr;
			aa_deser_log(cmd, procLog);
		} // end of function aa_deser_createArrayProperty()
		
		
	   /*******************************************************************************
	    *******************************************************************************/			
		function aa_deser_createBasicProperty(cmd, procLog) {
		   var obj = nodesByKey[cmd.ownerKey];
		   
		   obj[cmd.name] = cmd.value;
		   aa_deser_log(cmd, procLog);
		} // end of function aa_deser_createBasicProperty()		
		
		
	   /*******************************************************************************
	    *******************************************************************************/			
		function aa_deser_createDateProperty(cmd, procLog) {
		   var obj = nodesByKey[cmd.ownerKey];
		   
		   obj[cmd.name] = new Date(cmd.value);
		   aa_deser_log(cmd, procLog);
		} // end of function aa_deser_createDateProperty()		
		
				
		
	   /*******************************************************************************
	    *******************************************************************************/		
		function aa_deser_createObj(cmd, procLog) {
			var obj = {};
			
			nodesByKey[cmd.key] = obj;  // add to lookup
			aa_deser_log(cmd, procLog);
			
			return obj;
		} // end of function aa_deser_createObj()
		

	   /*******************************************************************************
	    *******************************************************************************/
		function aa_deser_createObjProperty(cmd, procLog) {
			var obj = nodesByKey[cmd.ownerKey];
			var childObj = nodesByKey[cmd.objectKey];
			
			obj[cmd.name] = childObj;
			aa_deser_log(cmd, procLog);
		} // end of function aa_deser_createObjProperty()
		
		
		
		
	   /******************************************************************************* 
	      Method added: Jan 1, 2018
	      
	      Freezes either a JS Object or JS Array.
	      
	      Info about freeze() method:
	      https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
	      
	    *******************************************************************************/					
		function aa_deser_freezeObj(cmd, procLog) {
			var objOrArr = nodesByKey[cmd.key];
			
			Object.freeze(objOrArr);
			aa_deser_log(cmd, procLog);
		} // end of function aa_deser_freezeObj()
		
		
		
		
	   /*******************************************************************************
	      add entry to deserialization process log
	    *******************************************************************************/		
		function aa_deser_log(cmd, procLog) {
			var logEntry = {};
			
			logEntry.cmd = cmd;
			logEntry.opTimestamp = new Date();
			
			procLog[procLog.length] = logEntry;
		} // end of function aa_deser_log()
		
		
	   /******************************************************************************* 
	      Method added: Jan 1, 2018
	      
	      Prevents Extensions to either a JS Object or JS Array.
	      
	      Info about preventExtensions() method:
	      https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/preventExtensions
	      
	    *******************************************************************************/	
		function aa_deser_preventExt(cmd, procLog) {
			var objOrArr = nodesByKey[cmd.key];
			
			Object.preventExtensions(objOrArr);
			aa_deser_log(cmd, procLog);
		} // end of function aa_deser_preventExt()
		
		
	   /******************************************************************************* 
	      Method added: Jan 1, 2018
	      
	      Seals either a JS Object or JS Array.
	      
	      Info about seal() method:
	      https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/seal
	      
	    *******************************************************************************/
		function aa_deser_sealObj(cmd, procLog) {
			var objOrArr = nodesByKey[cmd.key];
			
			Object.seal(objOrArr);
			aa_deser_log(cmd, procLog);
		} // end of function aa_deser_sealObj()
		
		
		
		
		//&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
		
		
	   /*******************************************************************************
	    *******************************************************************************/		
		function addCreationInstruction(cmd) {
			var nMax = serializedObj.creationInstructions.length;
			
			cmd.cmdIndexNum = nMax;
			cmd.commandCreatedAt = new Date();
			serializedObj.creationInstructions[nMax] = cmd;
		} // end of function addCreationInstruction()
		
		
		
	   /*******************************************************************************
	       
	    *******************************************************************************/		
		function addError(sMsg, sClassification) {
			var errEntry = {};
			var nMax = serializedObj.errorList.length;
			
			errEntry.msg = sMsg;
			errEntry.errTimestamp = new Date();
			errEntry.errIndexNum = nMax;
			serializedObj.errorList[nMax] = errEntry;
			
		} // end of function addError()
		
		
		
	   /*******************************************************************************
	      Used to add a special temporary "marker" object to JavaScript objects/
	      arrays that are being deserialized.
	      
	      Has unique key we make up as well as any other status we need to keep 
	      track of regarding this object or array.
	      
	      This function is called from the: setObjKey() function.
	    *******************************************************************************/		
		function addObjMarker(obj, sDataType, nArrayIndexNum) {
			var objMarker = {};
			
			objMarker.key = getNextKey();
			objMarker.processed = false;
			objMarker.justCreated = true;
			objMarker.objDataType = sDataType;
			objMarker.originalObj = obj;
			
			
			// if object or array is inside another indexed array element
			// this keeps track of the original array index that it was in!
			if (typeof nArrayIndexNum === "number") {
				objMarker.arrayIndexNum = nArrayIndexNum;
			} // end if
			
		//	obj["__orvSerialRef___"] = objMarker;
			objKeyLookup.set(obj, objMarker); // add to weak map
			
			// still need?
			alteredObjsByIndex[alteredObjsByIndex.length] = obj;
			alteredObjsByKey[objMarker.key] = obj;
			
			return objMarker;
		} // end of function addObjMarker()
		
		
		
	   /*******************************************************************************
	       Makes our boilerplate deserialized object (which we will add other 
	       stuff to later).
	    *******************************************************************************/			
		function baseDeserializedObj() {
			var obj = {};
			
			initMetaData(obj, "deserializedObj", "Deserialized Object");

			obj.deserializedStartTime = new Date();
			obj.procLog = [];
			
			return obj;
		} // end of function baseDeserializedObj()
		
		
		
		
	   /*******************************************************************************
	       Called after processing a JS Object or Array during the serializing process,
	       to see if that entity has any restrictions on it...
	          - is it Frozen?
	          - is it Sealed?
	          - has it been set up to prevent Extensions?
	          
	       It checks, and if any of the above is the case, it generates commands
	       that it adds to the serialized object so that the deserializing process
	       can make the new copy have the same restricted state(s).
	    *******************************************************************************/
		function checkObjRestrictions(obj, sObjKey, sDataType) {
			var bFrozen = false;
			var bSealed = false;
			
			if (Object.isFrozen(obj) === true) {
				makeFreezeObjCommand(sObjKey);
				bFrozen = true;
			} // end if
			
			
			if (Object.isSealed(obj) === true && !bFrozen) {
				makeSealObjCommand(sObjKey);
				bSealed = true;
			} // end if
			
			
			// the odd-ball opposite check!!! (a Not operation)!
			if (!Object.isExtensible(obj) && !bFrozen === true && !bSealed === true) {
				makePreventExtCommand(sObjKey);
			} // end if
			
		} // end of function checkObjRestrictions()
		
		
		
		
		
	   /*******************************************************************************
             Used for indexedDb operations and Ajax operations
             ... or any other asynchronous operations that I might add to 
                 this library!!
                 
                 current task types:
                     "createGroup" - make a group to put other tasks in
                                     groups can contain groups and so on.
                     "openDb"      - open indexedDb
                     "createTrans" - create indexedDb transaction object
                     "getObjStore" - get indexDb object store
                     
                     "ajaxCall"    - do an Ajax call
                     
                current task classifications:
                     "indexedDb"
                     "ajax"
                     "group"
                     
                supported callbacks:
                     .onbeforestart - runs Just Before task is started
                     .onsuccess - runs if task was a success - passes in a result object
                     .onerror - run if task did not succeed for some reason - passes an object in about the error
                     
                all callbacks also pass in the task object that they belong to!
                
	    *******************************************************************************/		
		function createTask(params) {
			var task = {};
			var sTaskType = params.taskType;
			var sComments = params.comments;
			var sTaskClassification = params.classification;
			
			task.createdAt = new Date();
			task.startedAt = "n/a";
			task.completedAt = "n/a";
			task.msWaitTime = "n/a"; // will hold how much time in milliseconds the task sat on the queue
			task.msCompleteTime = "n/a"; // will hold how much time in milliseconds it took to complete
			task.started = false;
			task.completed = false;
			task.classification = sTaskClassification;
			task.taskType = sTaskType;
			task.comments = sComments;
			
		} // end of function createTask()
		
		

		
		
		
	   /**************************************************************
	       The function removes all markers added to input object(s).
	    **************************************************************/	
		function clearObjMarkers(inputObj) {
			var nMax = alteredObjsByIndex.length;
			var n,alteredObj;
			
			for (n=0;n<nMax;n++) {
				alteredObj = alteredObjsByIndex[n];
				if (typeof alteredObj["__orvSerialRef___"] !== "undefined") {
					delete alteredObj["__orvSerialRef___"];
				} // end if
			} // next n
		} // end of function clearObjMarkers()
		
		
		
	   /**************************************************************
	       The function cleans up top level values.
	       This is done BEFORE and AFTER work is done.
	       clearObjMarkers() is only done AFTER work is done!
	    **************************************************************/	
		function cleanupWork(inputObj) {
			alteredObjsByIndex = [];
			alteredObjsByKey = [];
			nNextKeyNum = 0;
		} // end of function cleanupWork()		
		
		
		
	   /*******************************************************************************
	      function's code inspired from:
	      https://stackoverflow.com/questions/27082377/get-number-of-decimal-places-with-javascript
	    *******************************************************************************/		
		function decimalPlacesOfNumber(inputValue) {
			var nValue = inputValue - 0; // casts to number if not already
    		var nDecPlaces = 0;
    		
    		if (Math.floor(nValue) !== nValue) {
        		nDecPlaces =  value.toString().split(".")[1].length || 0;
    		} // end if
    		
    		return nDecPlaces;
		} // end of function decimalPlacesOfNumber()
		
		
		
	   /*******************************************************************************
	      returns a data type for the value passed in in a format that I like.
	      I mean... why not?  <g>
	    *******************************************************************************/		
		function getPropValueType(propValue) {
			var bTypeFound = false;
			var sType = "null";
			var sWork = Object.prototype.toString.call(propValue);
			
			if (sWork === "[object Array]") {
				sType = "array";
				bTypeFound = true;
			} // end if
			
			if (sWork === "[object Date]" && !bTypeFound) {
				sType = "date";
				bTypeFound = true;
			} // end if
			
			if (sWork === "[object Object]" && !bTypeFound) {
				sType = "object";
				bTypeFound = true;
			} // end if
			
			if (sWork === "[object Function]" && !bTypeFound) {
				sType = "method";
				bTypeFound = true;
			} // end if			
				
			if (sWork.length>11 && !bTypeFound) {
				if (sWork.substr(0,12) === "[object HTML") {
					sType = "domItem";
					bTypeFound = true;
				} // end if
			} // end if		
									
			if (!bTypeFound) {
				sType = typeof propValue;  // would return "string" for a string, "number" for a number or "boolean" for a boolean!
			} // end if
			
			return sType;
		} // end of function getPropValueType()
		
		
		
		
		
	   /*******************************************************************************
	   	  Returns unique key to be used for this instance of this serialization
	   	  operation.
	   	  Multiple keys can be generated per serialization operation.
	   	  This is used to:
	   	    - map object/array relationships 
	   	    - and which operations have been done regarding those relationships
	   	    - when deserializing, these keys are used to create the same object
	   	      relationships in the new reconstituted object.
	   	      
	    *******************************************************************************/		
		function getNextKey() {
			nNextKeyNum = nNextKeyNum + 1;
			return "k"+nNextKeyNum;
		} // end of function getNextKey()
		
		
		
		
	   /*******************************************************************************
	       Returns how many milliseconds occurred between start date/time
	       and end date/time.
	    *******************************************************************************/		
		function getMsDif(dtStart, dtEnd) {
			var nDif = dtEnd.getMilliseconds() - dtStart.getMilliseconds();
			
			return nDif;
		} // end of function getMsDif()
				
		
	   /*******************************************************************************
	      Returns if we've finished processing an object (for serialization) or not.
	      Convenience function.
	    *******************************************************************************/		
		function hasBeenProcessed(obj) {
			var serRefObj = objKeyLookup.get(obj);
			
			return serRefObj.processed;
		} // end of function hasBeenProcessed()
		
		
		
	   /*******************************************************************************
	   	  Returns whether or not we've added an object marker to an object or array.
	   	  Convenience function.
	    *******************************************************************************/		
		function hasObjectMarker(obj) {
			var bFlag = false;
			
			if (objKeyLookup.has(obj)) {
				bFlag = true;
			} // end if
			
			return bFlag;
		} // end of function hasObjectMarker()
		
		
		
		
	   /*******************************************************************************
	      Convenience function to return whether or not we just created the key for
	      an object or not.
	    *******************************************************************************/		
		function keyJustCreated(obj) {
			var serRefObj = objKeyLookup.get(obj);
			
			return serRefObj.justCreated;
			
		} // end of function keyJustCreated()
		
		
		
		
		
	   /*******************************************************************************
	       Add some meta data to our object...
	       Used both for the serialized object and the deserialized object
	    *******************************************************************************/		
		function initMetaData(obj, sObjTypePropName, sObjType) {
			
			obj[sObjTypePropName] = sObjType;
			
			obj.jsLib = "orvObjLib.js";	
			obj.gitHubRepoUrl = "";

						
		} // end of function initMetaData()
		
		
		
		
	   /*******************************************************************************
	       Create our base serialized object.
	       More stuff will be added to it as we go along!
	    *******************************************************************************/		
		function initSerializedObj() {
			serializedObj = {};
			serializedObj.serializationDate = new Date();
			
			// meta data:
			initMetaData(serializedObj, "serializedObj", "Serialized Object");

			serializedObj.status = "starting";
			
			// will contain instructions for deserializer to
			// use to do its work...
			serializedObj.creationInstructions = []; 
			
			// list of any errors.
			serializedObj.errorList = [];
		} // end of function initSerializedObj()
		




	   /*******************************************************************************
	      is the object passed in a node in the DOM?
	      
	      for now, we will use this function to determine what properties/
	      array elements to exclude.
	    *******************************************************************************/			
	    function isDomNode(obj) {
	    	var bFlag = false;
	    	var sType = Object.prototype.toString.call(obj);
	    	
	    	if (sType.length > 11) {
	    		if (sType.substr(0,12) === "[object HTML") {
	    			bFlag = true;
	    		} // end if
	    	} // end if
	    	
	    	return bFlag;
	    } // end of function isDomNode()
	    
		
		
		
	   /*******************************************************************************
	      In cases where we Do serialize an object's methods, this function
	      teases out the information needed and creates a command object with
	      the information needed to re-create the method later when deserializing
	      the object!
	    *******************************************************************************/					
		function makeAddMethodCommand(sMethodName, vValue, sOwnerKey) {
			var cmd,nPos,sArgs,sCode,n;
			var sWork = vValue.toString();
			
			// extract any arguments the function may have:
			nPos = sWork.indexOf("(");
			sWork = sWork.substr(nPos+1, sWork.length-nPos);
			nPos = sWork.indexOf(")");
			sArgs = sWork.substr(0,nPos);
			
			// extract out the function's code body/block:
			sWork = sWork.substr(nPos+1, sWork.length-nPos);
			nPos = sWork.indexOf("{");
			sCode = sWork.substr(nPos+1, sWork.length-nPos);
			
			for (n=sCode.length;n>-1;n=n-1) {
				if (sCode.substr(n,1)==="}") {
					sCode = sCode.substr(0, n); 
					break;
				} // end if
			} // next n
			
			cmd = {"cmd":"add-method", 
			       "ownerKey": sOwnerKey, 
			       "methodName":sMethodName,
			       "args":sArgs,
			       "jsCode":sCode};
			
			addCreationInstruction(cmd);
		} // end of function makeAddMethodCommand()
				
			
			
	   /*******************************************************************************
	   
	   	  -ownerKey    this is the key to the JS object containing the property
	   	               which contains the array in question
	   	               
	   	  -arrayKey    would be the key to the new array
	   	  
	   	  Note: for deserialization, the command to create the array must be run
	   	        BEFORE, the command to add the array to the property!
	    *******************************************************************************/			
		function makeAddArrayPropertyCommand(sPropertyName, sOwnerKey, sArrayKey) {
			var cmd = {"cmd":"create-array-property",
			           "ownerKey": sOwnerKey, 
			           "name": sPropertyName,
			           "arrayKey": sArrayKey
			           };
						
			addCreationInstruction(cmd);
		} // end of function makeAddArrayPropertyCommand()
		
		
	   /*******************************************************************************
	      when there is an array object inside another array element
	       -ownerKey would be the key to the container array
	       -arrayKey would be the key to the new array
	    *******************************************************************************/							
		function makeAddArrayToArrayCommand(nArrayIndex, sOwnerKey, sArrayKey) {
			var cmd = {"cmd":"add-array-to-array",
			           "ownerKey": sOwnerKey, 
			           "arrayIndex": nArrayIndex,
			           "arrayKey": sArrayKey
			           };
						
			addCreationInstruction(cmd);
		} // end of function makeAddObjectToArrayCommand()
				
						
	   /*******************************************************************************
	         Note:
	           "ownerKey" is the key to the object to add the property to	   
	    *******************************************************************************/		
		function makeAddBasicPropertyCommand(sPropertyName, vValue, sOwnerKey) {
			var cmd = {"cmd":"create-basic-property",
			           "ownerKey": sOwnerKey, 
			           "name": sPropertyName,
			           "value": vValue
			           };
						
			addCreationInstruction(cmd);
		} // end of function makeAddBasicPropertyCommand()
		
		
		
	   /*******************************************************************************
	         Note:
	           "ownerKey" is the key to the array to add the basic value to
	    *******************************************************************************/		
		function makeAddBasicValueToArrayCommand(nArrayIndex, vValue, sOwnerKey) {
			var cmd = {"cmd":"add-basic-value-to-array",
			           "ownerKey": sOwnerKey, 
			           "arrayIndex": nArrayIndex,
			           "value": vValue
			           };
						
			addCreationInstruction(cmd);
		} // end of function makeAddBasicPropertyCommand()
				
						
						
	   /*******************************************************************************
	         Note:
	           "ownerKey" is the key to the object to add the date property to		   
	    *******************************************************************************/		
		function makeAddDatePropertyCommand(sPropertyName, dtValue, sOwnerKey) {
			var cmd = {"cmd":"create-date-property",
			           "ownerKey": sOwnerKey, 
			           "name": sPropertyName,
			           "value": dtValue.toString()
			           };
						
			addCreationInstruction(cmd);
		} // end of function makeAddDatePropertyCommand()
		
		
		
	   /*******************************************************************************
	         Note:
	           "ownerKey" is the key to the array to add the date value to		   
	    **************************************************ƒ*****************************/		
		function makeAddDateValueToArrayCommand(nArrayIndex, dtValue, sOwnerKey) {
			var cmd = {"cmd":"add-date-value-to-array",
			           "ownerKey": sOwnerKey, 
			           "arrayIndex": nArrayIndex,
			           "value": dtValue.toString(),			           
			           };
						
			// the "key" here identifies which array we are adding the date value to
			
			addCreationInstruction(cmd);
		} // end of function makeAddDateValueToArrayCommand()		
						
			
			
	   /*******************************************************************************
	         Note:
	           "ownerKey" is the key to the object to add the object property to		
	           "objectKey" is the key to the object the Property should be referencing   
	    *******************************************************************************/							
		function makeAddObjectPropertyCommand(sPropertyName, sOwnerKey, sObjKey) {
			var cmd = {"cmd":"create-object-property",
			           "ownerKey": sOwnerKey, 
			           "name": sPropertyName,
			           "objectKey": sObjKey
			           };
						
			addCreationInstruction(cmd);
		} // end of function makeAddObjectPropertyCommand()		
		
		
		
	   /*******************************************************************************
	         Note:
	           "ownerKey" is the key to the array to add the object property to		
	           "objectKey" is the key to the object the array index should be referencing  	   
	    *******************************************************************************/							
		function makeAddObjectToArrayCommand(nArrayIndex, sOwnerKey, sObjKey) {
			var cmd = {"cmd":"add-object-to-array",
			           "ownerKey": sOwnerKey, 
			           "arrayIndex": nArrayIndex,
			           "objectKey": sObjKey
			           };
						
			addCreationInstruction(cmd);
		} // end of function makeAddObjectToArrayCommand()			
		
								
						
	   /*******************************************************************************
	    *******************************************************************************/								
		function makeCreateArrayCommand(sKey) {
			var cmd = {"cmd":"create-array","key":sKey};
			
			addCreationInstruction(cmd);
		} // end of function makeCreateArrayCommand()
		
		
		
		// ?????   -- I'm thinking right now, to forget about messing with the DOM.
		//            too much trouble to start out with
		function makeCreateDomObjectCommand(sTagName, sKey) {
			var cmd = {"cmd":"addDomObject"};
			
			addCreationInstruction(cmd);
		} // end of function makeCreateDomObjectCommand()
						
						
	   /*******************************************************************************
	    *******************************************************************************/							
		function makeCreateObjectCommand(sKey) {
			var cmd = {"cmd":"create-obj","key":sKey};
			
			addCreationInstruction(cmd);
		} // end of function makeCreateObjectCommand()
		
		
		
		/*******************************************************************************
	    *******************************************************************************/	
		function makeFreezeObjCommand(sKey) {
			var cmd = {"cmd":"freeze-obj","key":sKey};
			
			addCreationInstruction(cmd);
		} // end of function makeFreezeObjCommand()
		
		
		
		/*******************************************************************************
	    *******************************************************************************/
		function makePreventExtCommand(sKey) {
			var cmd = {"cmd":"prevent_ext","key":sKey};
			
			addCreationInstruction(cmd);
		} // end of function makePreventExtCommand()
		
		
		
		
		/*******************************************************************************
	    *******************************************************************************/
		function makeSealObjCommand(sKey) {
			var cmd = {"cmd":"seal-obj","key":sKey};
			
			addCreationInstruction(cmd);
		} // end of function makePreventExtCommand()
		
		
				
		
	   /*******************************************************************************
	    *******************************************************************************/		
		function originalArrayIndexNum(obj) {
			return obj["__orvSerialRef___"].arrayIndexNum;
		} // end of function originalArrayIndexNum()
		
		
						
						
	   /*******************************************************************************
	       Process through the elements of a JavaScript array.
	    *******************************************************************************/			
		function processArray(arr, niDepth) {
			var nMax = arr.length;
			var n;
			var sCurrentObjKey = setObjKey(arr);  // in this case it should get existing key
			var sKey;
			var arrEl,sDataType;
			var aObjArrItems = [];
			var nDepth = niDepth + 1;
	
			if (hasBeenProcessed(arr)) {
				// we have processed this array already so we do not need to work further on it
				return; // leave!			
			} // end if
			
			if (nMax > 0) {
			
				// pass 1 of array:
				for (n=0;n<nMax;n++) {
					arrEl = arr[n];
					sDataType = getPropValueType(arrEl);
					switch(sDataType) {
						case "object":
							sKey = setObjKey(arrEl, sDataType, n);
							if (keyJustCreated(arrEl)) {
								makeCreateObjectCommand(sKey);
								aObjArrItems[aObjArrItems.length] = arrEl;
							} // end if
							makeAddObjectToArrayCommand(n, sCurrentObjKey, sKey);
							break;
						case "array":
						    // an array In an Array!!
//						    debugger;
							sKey = setObjKey(arrEl, sDataType, n);
							if (keyJustCreated(arrEl)) {
								makeCreateArrayCommand(sKey);
								aObjArrItems[aObjArrItems.length] = arrEl;
							} // end if
							makeAddArrayToArrayCommand(n, sCurrentObjKey, sKey);
							break;
						case "date":
						// "add-date-to_indexed_array"
							makeAddDateValueToArrayCommand(n, arrEl, sCurrentObjKey);
							break;
						default:
						// "add-simple-value-to_indexed_array"
							makeAddBasicValueToArrayCommand(n, arrEl, sCurrentObjKey);
							break;
					} // end switch()
				} // next n
				
				// pass 2 -drill in deeper
				nMax = aObjArrItems.length;
				for (n=0;n<nMax;n++) {
					arrEl = aObjArrItems[n];
					sDataType = getPropValueType(arrEl);
					switch(sDataType) {
						case "object":
							processInputObj(arrEl, nDepth); // a recursive call
						case "array":
							processArray(arrEl, nDepth); // a recursive call
					} // end switch()					
					
				} // next n
				
			} else {
			} // end if/else
			
			// below needs to be done AFTER all other processing on the array!
			checkObjRestrictions(arr, sCurrentObjKey, "array"); 
			
			setAsProcessed(arr); // all done with this array
			
		} // end of function processArray()
		
		
		
	   /*************************************************************
	       The function below is call recursively.
	    *************************************************************/	
		function processInputObj(inputObj, niDepth) {
			var sMemberName;
			var vMemberValue;
			var objsAndArraysToProcByIndex = []; //?
			var sDataType,sKey,n,nMax,sArgs,sCode,sWork,nPos;
			var sCurrentObjKey = setObjKey(inputObj);
			var nDepth = niDepth + 1;
			
			if (hasBeenProcessed(inputObj)) {
				// we have processed this object already so we do not need to work further on it
				return; // leave!
			} // end if
			
			// ** first pass: 
			for (sMemberName in inputObj) {
				if (sMemberName === "__orvSerialRef___") {
				    // this property is not an original property name... so we will ignore it!
				} else {
					// otherwise... process the property!
					vMemberValue = inputObj[sMemberName];
					sDataType = getPropValueType(vMemberValue);
					switch(sDataType) {
						case "object":
							sKey = setObjKey(vMemberValue, sDataType);
							if (keyJustCreated(vMemberValue)) {
								objsAndArraysToProcByIndex[objsAndArraysToProcByIndex.length] = vMemberValue;
								makeCreateObjectCommand(sKey);
							} // end if
						
							makeAddObjectPropertyCommand(sMemberName, sCurrentObjKey, sKey);
							break;
						case "array":
							sKey = setObjKey(vMemberValue, sDataType);
							if (keyJustCreated(vMemberValue)) {
								objsAndArraysToProcByIndex[objsAndArraysToProcByIndex.length] = vMemberValue;
								makeCreateArrayCommand(sKey);
							} // end if
							makeAddArrayPropertyCommand(sMemberName, sCurrentObjKey, sKey);
							break;
						case "method":
							if (bCopyMethods) {
								makeAddMethodCommand(sMemberName, vMemberValue, sCurrentObjKey);							
							} // end if (bCopyMethods) 
							break;
						case "date":
							makeAddDatePropertyCommand(sMemberName, vMemberValue, sCurrentObjKey);
							break;
						default:
							// handle remaining simple data types (number, string, boolean)
							makeAddBasicPropertyCommand(sMemberName, vMemberValue, sCurrentObjKey);
							break;
					} // end of switch()
				} // end if/else
			} // next
								
			// ** second pass (just objects and arrays):
			// ** this is to drill down deeper:
			nMax = objsAndArraysToProcByIndex.length
			for (n=0;n<nMax;n++) {
				vMemberValue = objsAndArraysToProcByIndex[n];
				sDataType = getPropValueType(vMemberValue);
				switch(sDataType) {
					case "object":
						processInputObj(vMemberValue, nDepth); // a recursive call
					case "array":
						processArray(vMemberValue, nDepth); // a recursive call
				} // end switch()
			} // next
						
			// below needs to be done AFTER all other processing on the array!
			checkObjRestrictions(inputObj, sCurrentObjKey); 
								
			setAsProcessed(inputObj); // all done with this object
		} // end of function processInputObj()
		
		
		// convenience function
		function setAsProcessed(obj) {
			var serRefObj = objKeyLookup.get(obj);
	//		obj["__orvSerialRef___"].processed = true;
			serRefObj.processed = true;
		} // end of function setAsProcessed()
		
			
		
	   /*************************************************************
	       if object passed in does not have a serial ref...
	       add it
	    *************************************************************/			
		function setObjKey(obj, sDataType, nArrayIndexNum) {
			var sKey="";
			var serRefObj; // 12/31/2017
			
	//		if (typeof obj["__orvSerialRef___"] === "undefined") {
			if (!objKeyLookup.has(obj)) {
				serRefObj = addObjMarker(obj, sDataType, nArrayIndexNum);	
			} else {
				serRefObj = objKeyLookup.get(obj);
				//obj["__orvSerialRef___"].justCreated = false;		
				serRefObj.justCreated = false;	
			} // end if
			
			sKey = serRefObj.key;
			
			return sKey;
		} // end of function setObjKey()
	
		// **** END OF PRIVATE FUNCTIONS
			
	} // end of function orvObjLibObj(n)  --- (outer function)
