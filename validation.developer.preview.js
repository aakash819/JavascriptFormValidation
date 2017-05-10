/**
 * Specify the working enviroment
 */
var vpEnvirement = {
    Development: 0,
    Staging: 1,
    Production: 2
}
var vpWorkingEnviroment = vpEnvirement.Development;

(function autoStart() {
    var formsToValidate = document.querySelectorAll("form[data-validateForm]");

    var formsToValidateCount = formsToValidate.length;
    if (formsToValidateCount > 0) {
        for (var i = 0; i < formsToValidateCount; i++) {
            formsToValidate[i].setAttribute("novalidate", "novalidate");
            validationSetup(formsToValidate[i]);
        }
    }

}());


/**
*Setup events of form for validation
*@param {object} [form] html form object
*@return {object}  
*/
function validationSetup(form) {
    if (form == null || form == undefined) {
        showInternalError("Expected a form element");
        return;
    }
    form.setAttribute("novalidate", "novalidate");
    var fieldsToValidate = form.querySelectorAll("[data-validate]");;
    var formValidationFailed = new Event('onValidationFaild');
    var formValidationSuccess = new Event("onValidationSuccess");

    form.addEventListener("submit", function (event) {
        if (!validateForm(form, fieldsToValidate)) {
            event.preventDefault();
            form.dispatchEvent(formValidationFailed);
        }
        else {
            event.preventDefault();
            form.dispatchEvent(formValidationSuccess);
        }
    });

    if (fieldsToValidate.length > 0) {
        var fieldLength = fieldsToValidate.length;
        for (var i = 0; i < fieldLength; i++) {
            fieldsToValidate[i].addEventListener("change", function () {
                validateField(this);
            });

            if (fieldsToValidate[i].dataset.hasOwnProperty("type")) {
                if (fieldsToValidate[i].dataset.type == "tel") {
                    fieldsToValidate[i].addEventListener("keydown", function (eve) {
                        var keyCode = eve.keyCode;
                        var validKeyCode = [8, 9, 13, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105]
                        if (validKeyCode.indexOf(keyCode) < 0) {
                            eve.preventDefault();
                        }
                    });
                }
            }


        }
    }

    form.clearValidation = function () {
        if (fieldsToValidate.length > 0) {
            var fieldLength = fieldsToValidate.length;
            for (var i = 0; i < fieldLength; i++) {
                removeError(fieldsToValidate[i]);
            }
        }
    };

    return form;
}
/**
*Validate a html form
*@param {object} [form] html form object
*@return {bool}
*/
function validateForm(form, fieldsToValidate) {
    var fieldCount = fieldsToValidate.length;
    if (fieldCount > 0) {
        for (var index = 0; index < fieldCount; index++) {
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
    if (!isFormControl(field)) {
        return;
    }

    var dataSet = field.dataset;
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
                    var minChecked = dataSet.hasOwnProperty("min") ? parseInt(dataSet.min, 10) : 1;
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

                        var upFileName = field.files[0].name;
                        var upFileExtension = upFileName.substring(upFileName.lastIndexOf('.') + 1).toLowerCase();
                        if (dataSet.hasOwnProperty("filetype")) {
                            var fileType = dataSet.filetype;
                            var fileObj = getCustomErrMsg(fileType);
                            fileTypeArr = fileObj['key'].split("|");
                            if (fileObj['value']) {
                                errMsg = fileObj['value'];
                            }
                            else {
                                errMsg = "Please upload a file with " + fileTypeArr.toString() + " extension";
                            }
                            if (fileTypeArr.indexOf(upFileExtension) < 0) {
                                addError(field, errMsg);
                                return;
                            }
                        }

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
                showInternalError("unrecognized form field");
                console.log(field);
                break;
        }
    }
    else {
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
                case "url":
                    errMsg = errMsg == "" ? "Invalid url" : errMsg;
                    if (isUrl(field.value)) {
                        removeError(field);
                    }
                    else {
                        addError(field, errMsg);
                    }
                    break;
                default:
                    console.error("invalid data type");
                    break;
            }
        }

    }

    if (dataSet.hasOwnProperty("compare")) {
        var compareObj = getCustomErrMsg(dataSet.compare);
        var dataVal1 = field.value;
        var dataVal2 = document.getElementById(compareObj.key).value;
        if (compareData(dataVal1, dataVal2)) {
            removeError(field);
            return;
        }
        else {
            if (compareObj.value) {
                errMsg = compareObj.value;
            }
            else {
                errMsg = "Value does not match";
            }
            addError(field, errMsg);
            return;
        }
    }

}

function compareData(Data1, Data2) {
    return (Data1 === Data2);
}

/**
 * return a object with custom err msg and data attribute 
 * @param {string} attrKey 
 * @return {object}
 */
function getCustomErrMsg(attrKey) {
    var msgObj = {
        key: "",
        value: ""
    };
    if (attrKey.indexOf(";") > -1) {
        var tempArr = attrKey.split(';');
        msgObj["key"] = tempArr[0];
        msgObj["value"] = tempArr[1];
    }
    else {
        msgObj["key"] = attrKey;
        msgObj["value"] = "";
    }
    return msgObj;
}

/**
 * returns true if argument is a form control
 * @param {formControl} field 
 * @return {bool}
 */
function isFormControl(field) {
    if (field == undefined || field == null) {
        showInternalError("field is null or undefined can't be validated");
        return false;

    }
    var validTagNames = ['input', 'select', 'textarea'];

    if (validTagNames.indexOf(field.tagName.toLowerCase()) < 0) {
        showInternalError("Only input controls is expected");
        return false;
    }

    return true;
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
 *Returns true if input string is valid url otherwise false
 * @param {string} inputValue 
 * @return {bool}
 */
function isUrl(inputValue) {

    if (isEmail(inputValue)) {
        return false;
    }

    var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
    var regex = new RegExp(expression);
    if (inputValue.match(regex)) {
        return true;
    } else {
        return false;
    }
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
function showInternalError(errMessage) {

    switch (vpWorkingEnviroment) {
        case vpEnvirement.Development:
            alert("Runtime Developmet Error : " + errMessage);
            break;
        case vpEnvirement.Staging:
            console.error("Runtime Staging Error : " + errMessage);
            break;
        case vpEnvirement.Production:
            console.warn("Errorin application, switching to development mode may show you more detail about this error");
            break;
        default:
            break;
    }

}
