
   /*
        function below is a constructor... use with "new" key word.
        BLAH!
    */
	function OrvObjLib() {
		var alteredObjsByIndex = [];
		var alteredObjsByKey = [];
		var nodesByKey = [];   // used when deserializing object
		var self = this;
		var nNextKeyNum = 0;
		var serializedObj;
		var bDontCopyMethods = true;
		var bProduceMinifiedResults = false;		
		var sPiDbName = "defaultDb";

		
	   "use strict"
	    
	    
	   /*******************************************************************************
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
	      Takes instructions in serialized object and from them
	      builds a new copy of the original object
	    ********************************************************/
		self.deserializeObj = function(inputSerializedObj) {
			var nMax,n;
			var resultObj = baseDeserializedObj();
			var commands,cmd;
			var bRootObjSet = false;
			var obj,arr;
			
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
						aa_deser_addDateValueToArray(cmd, resultObj.procLog) ;
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
					default:
						break;
				} // end of switch()
			} // next n
			
			nodesByKey = []; // since we are done, clear out to free up memory

			resultObj.completionTimestamp = new Date();
			
			return resultObj;
		} // end of method deserializeObj()
		
		
	   /*******************************************************************************
	    *******************************************************************************/		
		self.deserializeJsonString = function(sJson) {
			var objWork = JSON.parse(sJson);
			
			return self.deserializeObj(objWork);
		} // end of method deserializeJsonString()	
				
				
		
		
		
	   /*******************************************************************************
	        Saves Js object to indexed Db database with what is basically a 
	        Primary Key!
	        
	    *******************************************************************************/			
		self.saveObjToDb = function(params) {
			var inputObj = params.inputObj;
			var sKey = params.key;
			var sDbName = params.dbName;
			var objToSave = self.deserializeObj(inputObj);
			
		} // end of method saveObjToDb()
		
		
	   /*******************************************************************************
	    *******************************************************************************/		
		self.serializeObj = function(inputObj) {
			var sRootKey;
			var sDataType = getPropValueType(inputObj);
			var bRootNodeAdded = false;
			
			
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
				serializedObj.status = "aborted";
				return serializedObj;
			} // end if
			
			if (sDataType === "object") {
				processInputObj(inputObj); // recursively enumerate through object generating commands
			} else {
				processArray(inputObj);
			} // end if/else
			
			serializedObj.completionTimestamp = new Date();
			
			clearObjMarkers(inputObj);
			cleanupWork(inputObj); 
			
			serializedObj.status = "completed";
			
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
	    *******************************************************************************/		
		self.setDontCopyMethods = function(bSetting) {
			bDontCopyMethods = bSetting;
		} // end of method
		
		
	   /*******************************************************************************
	    *******************************************************************************/		
		self.sortArrayOfObjects = function(params) {
		} // end of method
		
		
	   /*******************************************************************************
	    *******************************************************************************/		
		self.stringifyObj = function(inputObj) {
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
			var obj = nodesByKey[cmd.ownerKey];
			
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
	      add entry to deserialization process log
	    *******************************************************************************/		
		function aa_deser_log(cmd, procLog) {
			var logEntry = {};
			
			logEntry.cmd = cmd;
			logEntry.opTimestamp = new Date();
			
			procLog[procLog.length] = logEntry;
		} // end of function aa_deser_log()
		
		
		
		
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
	    *******************************************************************************/		
		function addObjMarker(obj, sDataType, nArrayIndexNum) {
			var objMarker = {};
			
			objMarker.key = getNextKey();
			objMarker.processed = false;
			objMarker.justCreated = true;
			objMarker.objDataType = sDataType;
			
			// if object or array is inside another indexed array element
			// this keeps track of the original array index that it was in!
			if (typeof nArrayIndexNum === "number") {
				objMarker.arrayIndexNum = nArrayIndexNum;
			} // end if
			
			obj["__orvSerialRef___"] = objMarker;
			
			alteredObjsByIndex[alteredObjsByIndex.length] = obj;
			alteredObjsByKey[objMarker.key] = obj;
		} // end of function addObjMarker()
		
		
		
	   /*******************************************************************************
	    *******************************************************************************/			
		function baseDeserializedObj() {
			var obj = {};
			
			obj.deserializedObj = "deserializedObj";
			obj.deserializedStartTime = new Date();
			obj.procLog = [];
			
			return obj;
		} // end of function baseDeserializedObj()
		
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
		} // end of function processInputObj()
		
		
		
	   /**************************************************************
	       The function cleans up top level values.
	       This is done BEFORE and AFTER work is done.
	       clearObjMarkers() is only done AFTER work is done!
	    **************************************************************/	
		function cleanupWork(inputObj) {
			alteredObjsByIndex = [];
			alteredObjsByKey = [];
			nNextKeyNum = 0;
		} // end of function processInputObj()		
		
		
		
		
	   /*******************************************************************************
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
	    *******************************************************************************/		
		function hasBeenProcessed(obj) {
			return obj["__orvSerialRef___"].processed;
		} // end of function hasBeenProcessed()
		
		
		
	   /*******************************************************************************
	    *******************************************************************************/		
		function hasObjectMarker(obj) {
			var bFlag = false;
			
			if (typeof obj["__orvSerialRef___"] !== "undefined") {
				bFlag = true;
			} // end if
			
			return bFlag;
		} // end of function hasObjectMarker()
		
		
		
	   /*******************************************************************************
	    *******************************************************************************/		
		function keyJustCreated(obj) {
			return obj["__orvSerialRef___"].justCreated;
			
		} // end of function keyJustCreated()
		
		
	   /*******************************************************************************
	    *******************************************************************************/		
		function initSerializedObj() {
			serializedObj = {};
			serializedObj.serializationDate = new Date();
			
			// meta data:
			serializedObj.serializedObj = "Serialized Object";
			serializedObj.jsLib = "orvObjLib.js";	
			serializedObj.author = "Orville Paul Chomer";
			serializedObj.status = "starting";
			serializedObj.linkedInProfileUrl = "https://www.linkedin.com/in/orvillechomer/";
			
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
	    *******************************************************************************/					
		function makeAddMethodCommand(sMethodName,sArgs,sCode,sOwnerKey) {
			var cmd = {"cmd":"add-method", "methodName":sMethodName,
			           "args":sArgs,"jsCode":sCode};
			
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
		function originalArrayIndexNum(obj) {
			return obj["__orvSerialRef___"].arrayIndexNum;
		} // end of function originalArrayIndexNum()
		
		
						
	   /*******************************************************************************
	       Process through the elements of a JavaScript array.
	    *******************************************************************************/			
		function processArray(arr) {
			var nMax = arr.length;
			var n;
			var sCurrentObjKey = setObjKey(arr);  // in this case it should get existing key
			var sKey;
			var arrEl,sDataType;
			var aObjArrItems = [];
	
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
							processInputObj(arrEl); // a recursive call
						case "array":
							processArray(arrEl); // a recursive call
					} // end switch()					
					
				} // next n
				
			} else {
			} // end if/else
			
			setAsProcessed(arr); // all done with this array
			
		} // end of function processArray()
		
		
		
	   /*************************************************************
	       The function below is call recursively.
	    *************************************************************/	
		function processInputObj(inputObj) {
			var sMemberName;
			var vMemberValue;
			var objsAndArraysToProcByIndex = []; //?
			var sDataType,sKey,n,nMax;
			var sCurrentObjKey = setObjKey(inputObj);
			
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
							//right now, we will skip methods completely!
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
						processInputObj(vMemberValue); // a recursive call
					case "array":
						processArray(vMemberValue); // a recursive call
				} // end switch()
			} // next
						
			setAsProcessed(inputObj); // all done with this object
		} // end of function processInputObj()
		
		
		function setAsProcessed(obj) {
			obj["__orvSerialRef___"].processed = true
		} // end of function setAsProcessed()
		
			
		
	   /*************************************************************
	       if object passed in does not have a serial ref...
	       add it
	    *************************************************************/			
		function setObjKey(obj, sDataType, nArrayIndexNum) {
			var sKey="";
			
			if (typeof obj["__orvSerialRef___"] === "undefined") {
				addObjMarker(obj, sDataType, nArrayIndexNum);	
			} else {
				obj["__orvSerialRef___"].justCreated = false;			
			} // end if
			
			sKey = obj["__orvSerialRef___"].key;
			
			return sKey;
		} // end of function setObjKey()
	
		
			
	} // end of function orvObjLibObj(n)  --- outer function
	
	