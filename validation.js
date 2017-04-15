/**
 * Specify the working enviroment
 */
var Envirement = {
                    Dovelopment : "Dovelopment",
                    Staging : "Staging",
                    Production : "Production"
                }
var workingEnviroment = Envirement.Dovelopment;

(function autoStart(){
    var formsToValidate = document.querySelectorAll("form[data-validateForm]");
    var formsToValidateCount = formsToValidate.length;
    if(formsToValidateCount > 0){
        for(var i = 0;i < formsToValidateCount; i++){
            validationSetup(formsToValidate[i]);
        }
    }
}());


/**
*Setup events of form for validation
*@param {object} [form] html form object
*@return {object}  
*/
function validationSetup(form){
    if(form == null || form == undefined){
        showInternalError("Expected a form element");
        return;
    }
    

    form.addEventListener("submit", function(event){
        if(!validateForm(form)){
            event.preventDefault();
        }
    });

    var fieldsToValidate = form.querySelectorAll("[data-validate]");;
    if (fieldsToValidate.length > 0) {
        var fieldLength = fieldsToValidate.length;
        for(var i = 0; i < fieldLength; i++){
            fieldsToValidate[i].addEventListener("input",function(){
                validateField(this);
            });
        }
    }

}


/**
*Validate a html form
*@param {object} [form] html form object
*@return {bool}
*/
function validateForm(form) {
    
    var fieldsToValidate = form.querySelectorAll("[data-validate]");
    var fieldCount = fieldsToValidate.length;
    if (fieldCount > 0) {
        for (var index = 0; index < fieldCount; index++){
            validateField(fieldsToValidate[index]);
        }
    }
    var invalidFileds = form.querySelectorAll(".invalid");
    return (invalidFileds.length == 0);
}


/**
*validate a field
*@param {object} [field] html field object
*@return {void}  
*/
function validateField(field) {
    var dataSet = field.dataset;
    

    if (field == undefined || field == null) {
        console.error("field is null, can't be validated");
        return;
    }

    var errMsg;
    var fieldTag = field.tagName.toLowerCase();

    //if required
    if (dataSet.hasOwnProperty("required")) {
        var errMessage = dataSet.required; 
        errMsg = (errMessage.length > 0) ? errMessage : "This field is required";

        switch (fieldTag) {
            case "select":
                if (field.value == "" || field.value == "0" || field.value == "none") {
                    addError(field, errMsg);
                    return;
                }
                else {
                    removeError(field);
                }
                break;
            case "textarea":

                if (field.value.trim()) {
                    removeError(field);
                }
                else {

                    addError(field, errMsg);
                    return;
                }
                break;
            case "input":
                var inputType = field.type.toLowerCase();
                if (inputType == "radio") {
                    var parentForm = field.form;
                    var radioBtnGroup = parentForm.querySelectorAll("input[name=" + field.name + "]:checked");
                    if (radioBtnGroup.length == 0) {
                        addError(field, errMsg)
                    }
                    else {
                        removeError(field);
                    }

                }
                else if (inputType == "checkbox") {
                    var parentForm = field.form;
                    var checkedCheckBox = parentForm.querySelectorAll("input[name=" + field.name + "]:checked").length;
                    var minChecked = dataSet.hasOwnProperty("min") ? parseInt(dataSet.min , 10) : 1;
                    var maxChecked = dataSet.hasOwnProperty("max") ? parseInt(dataSet.max, 10) : parentForm.querySelectorAll("input[name=" + field.name + "]").length;

                    if (checkedCheckBox == 0) {
                        var checkbox_err_msg = dataSet.required;
                        errMsg = (checkbox_err_msg.length > 0) ? checkbox_err_msg : "This field is required";
                        addError(field, errMsg);
                        return;
                    }
                    else if (checkedCheckBox < minChecked) {

                        var minChecked_err_msg = dataSet.min;

                        if (minChecked_err_msg.indexOf(';') > 0) {
                            errMsg = minChecked_err_msg.split(';')[1];
                        }
                        else {
                            errMsg = "Please select atleast " + minChecked + " options";
                        }

                        addError(field, errMsg);
                        return;
                    }
                    else if (checkedCheckBox > maxChecked) {
                        var maxChecked_err_msg = dataSet.max;
                        if (maxChecked_err_msg.indexOf(';') > 0) {
                            errMsg = maxChecked_err_msg.split(';')[1];
                        }
                        else {
                            errMsg = "Please select atmost " + maxChecked + " options";
                        }

                        addError(field, errMsg);
                        return;
                    }
                    else {
                        removeError(field);
                    }

                }
                else if (inputType == "file") {
                    if (field.files.length > 0) {
                        var fileMin = parseInt(dataSet.min, 10);
                        var fileMax = parseInt(dataSet.max, 10);
                        var minSize = (fileMin > 0) ? fileMin : null;
                        var maxSize = (fileMax > 0) ? fileMax : null;
                        var uploadedFileSize = field.files[0].size / 1024;

                        if (minSize != null) {
                            if (fileMin.indexOf(';') >= 1) {
                                errMsg = fileMin.split(';')[1];
                            }
                            else {
                                errMsg = "File size should be greater then " + minSize.toString(10) + "kb";
                            }

                            if (uploadedFileSize < minSize) {
                                addError(field, errMsg);
                                return;
                            }
                            else {
                                removeError(field);
                            }
                        }

                        if (maxSize != null) {
                            if (fileMax.indexOf(';') >= 1) {
                                errMsg = fileMax.split(';')[1];
                            }
                            else {
                                errMsg = "File size should be less then " + minSize.toString(10) + "kb";
                            }

                            if (uploadedFileSize > maxSize) {
                                addError(field, errMsg);
                                return;
                            }
                            else {
                                removeError(field);
                            }
                        }

                        else {
                            removeError(field)
                        }
                    }
                    else {
                        addError(field, errMsg);
                        return;
                    }

                }
                else {
                    if (field.value.trim()) {
                        removeError(field);
                    }
                    else {

                        addError(field, errMsg);
                        return;
                    }
                }
                break;
            default:
                console.error("unrecognized form field");
                console.log(field);
                break;
        }
    }
    else{
        removeError(field);
    }

    //dataType checking
    if (dataSet.hasOwnProperty("type")) {
        var dataType = "";
        errMsg = "";
        var dataTypeTemp = dataSet.type;
        var hasErrMsg = (dataTypeTemp.indexOf(';') >= 0); //checking if attribute has err message

        if (hasErrMsg) {
            var dataTypeArr = dataTypeTemp.split(';');
            dataType = dataTypeArr[0];
            errMsg = dataTypeArr[1];
        }
        else {
            dataType = dataTypeTemp;
            errMsg = "";
        }

        if (field.value.trim()) {
            switch (dataType.toLowerCase()) {
                case "int":
                    errMsg = (errMsg == "") ? "Please enter integer number" : errMsg;
                    if (isInt(field.value)) {
                        
                        var intMax = dataSet.hasOwnProperty("max") ? (parseInt(dataSet.max, 10) !== NaN ? parseInt(dataSet.max, 10) : null) : null;
                        var intMin = dataSet.hasOwnProperty("min") ? (parseInt(dataSet.min, 10) !== NaN ? parseInt(dataSet.min, 10) : null) : null;
                        var intCurrent = parseInt(field.value, 10) != null ? parseInt(field.value, 10) : null;
                        if (intMin !== null) {
                            if (intCurrent < intMin) {
                                errMsg = "Value should be greater then " + intMin.toString();
                                if (dataSet.min.indexOf(';') > -1) {
                                    errMsg = dataSet.min.split(';')[1];
                                }
                                addError(field, errMsg);
                                return;
                            }
                        }

                        if (intMax !== null) {
                            if (intCurrent > intMax) {
                                errMsg = "Value should be less then " + intMax.toString();
                                if (dataSet.max.indexOf(';') > -1) {
                                    errMsg = dataSet.max.split(';')[1];
                                }
                                addError(field, errMsg);
                                return;
                            }
                        }

                        removeError(field);
                    }
                    else {
                        addError(field, errMsg);
                    }
                    break;

                case "uint":
                    errMsg = errMsg == "" ? "Please enter unsigned integer number" : errMsg;
                    if (isUint(field.value)) {

                        var uintMax = dataSet.hasOwnProperty("max") ? (parseInt(dataSet.max, 10) !== NaN ? parseInt(dataSet.max, 10) : null) : null;
                        var uintMin = dataSet.hasOwnProperty("min") ? (parseInt(dataSet.min, 10) !== NaN ? parseInt(dataSet.min, 10) : null) : null;
                        var uintCurrent = parseInt(field.value, 10) != null ? parseInt(field.value, 10) : null;
                        if (uintMin !== null) {
                            if (uintCurrent < uintMin) {
                                errMsg = "Value should be greater then " + uintMin.toString();
                                if (dataSet.min.indexOf(';') > -1) {
                                    errMsg = dataSet.min.split(';')[1];
                                }
                                addError(field, errMsg);
                                return;
                            }
                        }

                        if (uintMax !== null) {
                            if (uintCurrent > uintMax) {
                                errMsg = "Value should be less then " + uintMax.toString();
                                if (dataSet.max.indexOf(';') > -1) {
                                    errMsg = dataSet.max.split(';')[1];
                                }
                                addError(field, errMsg);
                                return;
                            }
                        }

                        removeError(field);
                    }
                    else {
                        addError(field, errMsg);
                    }

                    break;
                case "float":
                    errMsg = errMsg == "" ? "Please enter decimal number" : errMsg;
                    if (isFloat(field.value)) {
                        var floatMax = dataSet.hasOwnProperty("max") ? (parseFloat(dataSet.max, 10) !== NaN ? parseFloat(dataSet.max, 10) : null) : null;
                        var floatMin = dataSet.hasOwnProperty("min") ? (parseFloat(dataSet.min, 10) !== NaN ? parseFloat(dataSet.min, 10) : null) : null;
                        var floatCurrent = parseFloat(field.value, 10) != null ? parseFloat(field.value, 10) : null;
                        if (floatMin !== null) {
                            if (floatCurrent < floatMin) {
                                errMsg = "Value should be greater then " + floatMin.toString();
                                if (dataSet.min.indexOf(';') > -1) {
                                    errMsg = dataSet.min.split(';')[1];
                                }
                                addError(field, errMsg);
                                return;
                            }
                        }

                        if (floatMax !== null) {
                            if (floatCurrent > floatMax) {
                                errMsg = "Value should be less then " + floatMax.toString();
                                if (dataSet.max.indexOf(';') > -1) {
                                    errMsg = dataSet.max.split(';')[1];
                                }
                                addError(field, errMsg);
                                return;
                            }
                        }

                        removeError(field);
                    }
                    else {
                        addError(field, errMsg);
                    }
                    break;
                case "ufloat":
                    errMsg = errMsg == "" ? "Please enter decimal number" : errMsg;
                    if (isUfloat(field.value)) {
                        var ufloatMax = dataSet.hasOwnProperty("max") ? (parseFloat(dataSet.max, 10) !== NaN ? parseFloat(dataSet.max, 10) : null) : null;
                        var ufloatMin = dataSet.hasOwnProperty("min") ? (parseFloat(dataSet.min, 10) !== NaN ? parseFloat(dataSet.min, 10) : null) : null;
                        var ufloatCurrent = parseFloat(field.value, 10) != null ? parseFloat(field.value, 10) : null;

                        if (ufloatMin !== null) {
                            if (ufloatCurrent < ufloatMin) {
                                errMsg = "Value should be greater then " + ufloatMin.toString();
                                if (dataSet.min.indexOf(';') > -1) {
                                    errMsg = dataSet.min.split(';')[1];
                                }
                                addError(field, errMsg);
                                return;
                            }
                        }

                        if (ufloatMax !== null) {
                            if (ufloatCurrent > ufloatMax) {
                                errMsg = "Value should be less then " + ufloatMax.toString();
                                if (dataSet.max.indexOf(';') > -1) {
                                    errMsg = dataSet.max.split(';')[1];
                                }
                                addError(field, errMsg);
                                return;
                            }
                        }

                        removeError(field);
                    }
                    else {
                        addError(field, errMsg);
                    }
                    break;
                case "tel":
                    errMsg = errMsg == "" ? "Invalid telephone number" : errMsg;
                    if (isTel(field.value)) {
                        removeError(field);
                    }
                    else {
                        addError(field, errMsg);
                    }
                    break;

                case "email":
                    errMsg = errMsg == "" ? "Invalid email address" : errMsg;
                    if (isEmail(field.value)) {
                        removeError(field);
                    }
                    else {
                        addError(field, errMsg);
                    }
                    break;
                case "alphabets":
                    errMsg = errMsg == "" ? "Only alphabets without spaces are allowed" : errMsg;
                    if (isAlphabetsWithOutSpace(field.value)) {
                        var alphaMax = dataSet.hasOwnProperty("max") ? (parseFloat(dataSet.max, 10) !== NaN ? parseFloat(dataSet.max, 10) : null) : null;
                        var alphaMin = dataSet.hasOwnProperty("min") ? (parseFloat(dataSet.min, 10) !== NaN ? parseFloat(dataSet.min, 10) : null) : null;
                        var alphaCurrent = field.value.length;

                        if (alphaMin !== null) {
                            if (alphaCurrent < alphaMin) {
                                errMsg = "Minimum text length is " + alphaMin.toString();
                                if (dataSet.min.indexOf(';') > -1) {
                                    errMsg = dataSet.min.split(';')[1];
                                }
                                addError(field, errMsg);
                                return;
                            }
                        }

                        if (alphaMax !== null) {
                            if (alphaCurrent > alphaMax) {
                                errMsg = "Maximum text length is " + alphaMax.toString();
                                if (dataSet.max.indexOf(';') > -1) {
                                    errMsg = dataSet.max.split(';')[1];
                                }
                                addError(field, errMsg);
                                return;
                            }
                        }
                        removeError(field);
                    }
                    else {
                        addError(field, errMsg);
                    }
                    break;
                case "alphabets_s":
                    errMsg = errMsg == "" ? "Only alphabets are allowed" : errMsg;
                    if (isAlphabetsWithSpace(field.value)) {
                        var alpha_sMax = dataSet.hasOwnProperty("max") ? (parseFloat(dataSet.max, 10) !== NaN ? parseFloat(dataSet.max, 10) : null) : null;
                        var alpha_sMin = dataSet.hasOwnProperty("min") ? (parseFloat(dataSet.min, 10) !== NaN ? parseFloat(dataSet.min, 10) : null) : null;
                        var alpha_sCurrent = field.value.length;;

                        if (alpha_sMin !== null) {
                            if (alpha_sCurrent < alpha_sMin) {
                                errMsg = "Value should be greater then " + alpha_sMin.toString();
                                if (dataSet.min.indexOf(';') > -1) {
                                    errMsg = dataSet.min.split(';')[1];
                                }
                                addError(field, errMsg);
                                return;
                            }
                        }

                        if (alpha_sMax !== null) {
                            if (alpha_sCurrent > alpha_sMax) {
                                errMsg = "Value should be less then " + alpha_sMax.toString();
                                if (dataSet.max.indexOf(';') > -1) {
                                    errMsg = dataSet.max.split(';')[1];
                                }
                                addError(field, errMsg);
                                return;
                            }
                        }

                        removeError(field);
                    }
                    else {
                        addError(field, errMsg);
                    }
                    break;
                case "alphanumeric":
                    errMsg = errMsg == "" ? "Only alphanumeric without spaces are allowed" : errMsg;
                    if (isAlphaNumericWithOutSpace(field.value)) {
                        var alphaNMax = dataSet.hasOwnProperty("max") ? (parseFloat(dataSet.max, 10) !== NaN ? parseFloat(dataSet.max, 10) : null) : null;
                        var alphaNMin = dataSet.hasOwnProperty("min") ? (parseFloat(dataSet.min, 10) !== NaN ? parseFloat(dataSet.min, 10) : null) : null;
                        var alphaNCurrent = parseFloat(field.value, 10) != null ? parseFloat(field.value, 10) : null;

                        if (alphaNMin !== null) {
                            if (alphaNCurrent < alphaNMin) {
                                errMsg = "Value should be greater then " + alphaNmin.toString();
                                if (dataSet.min.indexOf(';') > -1) {
                                    errMsg = dataSet.min.split(';')[1];
                                }
                                addError(field, errMsg);
                                return;
                            }
                        }

                        if (alphaNMax !== null) {
                            if (alphaCurrent > alphaNMax) {
                                errMsg = "Value should be less then " + alphaNMax.toString();
                                if (dataSet.max.indexOf(';') > -1) {
                                    errMsg = dataSet.max.split(';')[1];
                                }
                                addError(field, errMsg);
                                return;
                            }
                        }

                        removeError(field);
                    }
                    else {
                        addError(field, errMsg);
                    }
                    break;
                case "alphanumeric_s":
                    errMsg = errMsg == "" ? "Only alphanumerics are allowed" : errMsg;
                    if (isAlphaNumericWithSpace(field.value)) {
                        var alphaN_sMax = dataSet.hasOwnProperty("max") ? (parseFloat(dataSet.max, 10) !== NaN ? parseFloat(dataSet.max, 10) : null) : null;
                        var alphaN_sMin = dataSet.hasOwnProperty("min") ? (parseFloat(dataSet.min, 10) !== NaN ? parseFloat(dataSet.min, 10) : null) : null;
                        var alphaN_sCurrent = field.value.length;

                        if (alphaN_sMin !== null) {
                            if (alphaN_sCurrent < alphaN_sMin) {
                                errMsg = "Value should be greater then " + alphaN_smin.toString();
                                if (dataSet.min.indexOf(';') > -1) {
                                    errMsg = dataSet.min.split(';')[1];
                                }
                                addError(field, errMsg);
                                return;
                            }
                        }

                        if (alphaN_sMax !== null) {
                            if (alphaN_surrent > alphaN_sMax) {
                                errMsg = "Value should be less then " + alphaN_sMax.toString();
                                if (dataSet.max.indexOf(';') > -1) {
                                    errMsg = dataSet.max.split(';')[1];
                                }
                                addError(field, errMsg);
                                return;
                            }
                        }
                        removeError(field);
                    }
                    else {
                        addError(field, errMsg);
                    }
                    break;
                case "regexp":

                    break;

                default:
                    console.error("invalid data type")
                    break;
            }
        }

    }

}

/**
*Returns true if input string is interger number otherwise false
*@param {string} [inputValue] Input field value
*@return {boolean}  
*/
function isInt(inputValue) {
    var rgx = /^-?\d*$/g.test(inputValue);
    return rgx;
}

/**
*Returns true if input string is a positive integer otherwise false
*@param {string} [inputValue] Input field value
*@return {boolean}  
*/
function isUint(inputValue) {
    var rgx = /^[0-9]\d*$/g.test(inputValue);
    return rgx;
}

/**
*Returns true if input string is an signed float number otherwise false
*@param {string} [inputValue] Input field value
*@return {boolean}  
*/
function isFloat(inputValue) {
    var rgx = /^-?\d+(\.\d+)?$/g.test(inputValue);
    return rgx;
}
/**
*Returns true if input string is an ubsigned float number otherwise false
*@param {string} [inputValue] Input field value
*@return {boolean}  
*/
function isUfloat(inputValue) {
    var rgx = /^\d+(\.\d+)?$/g.test(inputValue);
    return rgx;
}
/**
*Returns true if input string is a telephone number otherwise false
*@param {string} [inputValue] Input field value
*@return {boolean}  
*/
function isTel(inputValue) {
    var rgx = /^[+]?\d+(\-\d+)*$/g.test(inputValue);
    return rgx;
}
/**
*Returns true if input string is a valid email otherwise false
*@param {string} [inputValue] Input field value
*@return {boolean}  
*/
function isEmail(inputValue) {
    var valid = /^[_a-zA-Z0-9-]+(\.[_a-zA-Z0-9-]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*(\.[a-zA-Z][a-zA-Z]+)$/g.test(inputValue);
    return valid;
}



/**
*Returns true if input string is alphabets without spaces otherwise false
*@param {string} [inputValue] Input field value
*@return {boolean}  
*/
function isAlphabetsWithOutSpace(inputValue) {
    var rgx = /[^a-zA-Z]/g.test(inputValue);
    return !rgx;
}

/**
*Returns true if input string is alphabets including spaces otherwise false
*@param {string} [inputValue] Input field value
*@return {boolean}  
*/
function isAlphabetsWithSpace(inputValue) {
    var rgx = /[^a-zA-Z\s]/g.test(inputValue);
    return !rgx;
}

/**
*Returns true if input string is alphanumeric with spaces otherwise false
*@param {string} [inputValue] Input field value
*@return {boolean}  
*/
function isAlphaNumericWithSpace(inputValue) {
    var rgx = /^[a-zA-Z0-9\s]+$/;
    return (rgx.test(inputValue));
}
/**
*Returns true if input string is alphanumeric without spaces otherwise false
*@param {string} [inputValue] Input field value
*@return {boolean}  
*/
function isAlphaNumericWithOutSpace(inputValue) {
    var rgx = /^[a-zA-Z0-9]+$/;
    return (rgx.test(inputValue));
}



/**
*Make a field invalid by adding an error
*@param {object} [field] Html field object
*@param {string} [errMessage] Validation message to be shown on field
*@return {void}  Returns void
*/
function addError(field, errMessage) {
    field.classList.add("invalid");
    var targetErrElement = document.querySelector("#" + field.getAttribute("data-err-id"));
    targetErrElement.innerHTML = errMessage;
    targetErrElement.style.display = "block";
}

/**
*Make a field valid by removing error
*@param {object} [field] Html field object
*@return {void}  Returns void
*/
function removeError(field) {
    field.classList.remove("invalid");
    var targetErrElement = document.querySelector("#" + field.getAttribute("data-err-id"));
    targetErrElement.innerHTML = "";
    targetErrElement.style.display = "none";
}

/**
 * Show runtime error depands upon working enviroment
 * @param {string} errMessage 
 */
function showInternalError(errMessage){
    
    switch (workingEnviroment) {
        case Envirement.Dovelopment:
            alert(errMessage);
            break;
        case Envirement.Staging:
            alert(errMessage);
            break;
        case Envirement.Production:
            console.warn(errMessage);
            break;
    
        default:
            break;
    }

}
