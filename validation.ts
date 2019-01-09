export namespace JSVALIDATION {
    interface CustomErrMsgObject {
        Key: string,
        Value: string
    }

    enum vpEnvirement {
        Development,
        Staging,
        Production
    }
    let vpWorkingEnviroment = vpEnvirement.Development;

    export class FormValidation {

        public Form: HTMLFormElement;
        private FieldsToValidate: NodeListOf<HTMLInputElement & HTMLSelectElement & HTMLTextAreaElement> | null = null;

        constructor(form: HTMLFormElement) {
            this.Form = form;
            this.validationSetup();
        }

        private validationSetup = () => {

            this.Form.setAttribute("novalidate", "novalidate");
            this.FieldsToValidate = <NodeListOf<HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement>>this.Form.querySelectorAll("[data-validate]");
            let formValidationFailed = new Event('onValidationFaild');
            let formValidationSuccess = new Event("onValidationSuccess");

            this.Form.addEventListener("submit", event => {
                let isFormValid = this.ValidateForm();
                if (!isFormValid) {
                    event.preventDefault();
                    this.Form.dispatchEvent(formValidationFailed);
                }
                else {
                    event.preventDefault();
                    this.Form.dispatchEvent(formValidationSuccess);
                }
            });

            if (this.FieldsToValidate.length > 0) {
                let fieldLength: number = this.FieldsToValidate.length;
                for (let i = 0; i < fieldLength; i++) {
                    this.FieldsToValidate[i].addEventListener("change", event => {
                        this.ValidateField(this.FieldsToValidate[i]);
                    });

                    if (this.FieldsToValidate[i].dataset.hasOwnProperty("type")) {
//                         if (this.FieldsToValidate[i].dataset.type == "tel") {
//                             this.FieldsToValidate[i].addEventListener("keydown", function (eve: KeyboardEvent) {
//                                 let keyCode: number = eve.keyCode;
//                                 let validKeyCode = [8, 9, 13, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105]
//                                 if (validKeyCode.indexOf(keyCode) < 0) {
//                                     eve.preventDefault();
//                                 }
//                             });
//                         }
                    }
                }
            }
        }

        private ValidateForm = () => {
            let fieldCount = this.FieldsToValidate.length;
            if (fieldCount > 0) {
                for (let index = 0; index < fieldCount; index++) {
                    this.ValidateField(this.FieldsToValidate[index]);
                }
            }
            let invalidFileds = this.Form.querySelectorAll(".invalid");
            return (invalidFileds.length == 0);
        }


        private ValidateField = (field: HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement) => {

            let dataSet = field.dataset;
            let errMsg;
            let fieldTag = field.tagName.toLowerCase();
            if (!dataSet.hasOwnProperty('validate')) {
                return;
            }
            //if required
            if (dataSet.hasOwnProperty("required")) {
                let errMessage = dataSet.required;
                errMsg = (errMessage.length > 0) ? errMessage : "This field is required";

                switch (fieldTag) {
                    case "select":
                        if (field.value == "" || field.value == "none") {
                            this.addError(field, errMsg);
                            return;
                        }
                        else {
                            this.removeError(field);
                        }
                        break;
                    case "textarea":

                        if (field.value.trim()) {
                            this.removeError(field);
                        }
                        else {

                            this.addError(field, errMsg);
                            return;
                        }
                        break;
                    case "input":
                        let inputType = field.type.toLowerCase();
                        if (inputType == "radio") {
                            let parentForm = field.form;
                            let radioBtnGroup = parentForm.querySelectorAll("input[name=" + field.name + "]:checked");
                            if (radioBtnGroup.length == 0) {
                                this.addError(field, errMsg)
                            }
                            else {
                                this.removeError(field);
                            }

                        }
                        else if (inputType == "checkbox") {
                            let parentForm = field.form;
                            let checkedCheckBox = parentForm.querySelectorAll("input[name=" + field.name + "]:checked").length;
                            let minChecked = dataSet.hasOwnProperty("min") ? parseInt(dataSet.min, 10) : 1;
                            let maxChecked = dataSet.hasOwnProperty("max") ? parseInt(dataSet.max, 10) : parentForm.querySelectorAll("input[name=" + field.name + "]").length;

                            if (checkedCheckBox == 0) {
                                let checkbox_err_msg = dataSet.required;
                                errMsg = (checkbox_err_msg.length > 0) ? checkbox_err_msg : "This field is required";
                                this.addError(field, errMsg);
                                return;
                            }
                            else if (checkedCheckBox < minChecked) {

                                let minChecked_err_msg = dataSet.min;

                                if (minChecked_err_msg.indexOf(';') > 0) {
                                    errMsg = minChecked_err_msg.split(';')[1];
                                }
                                else {
                                    errMsg = "Please select atleast " + minChecked + " options";
                                }

                                this.addError(field, errMsg);
                                return;
                            }
                            else if (checkedCheckBox > maxChecked) {
                                let maxChecked_err_msg = dataSet.max;
                                if (maxChecked_err_msg.indexOf(';') > 0) {
                                    errMsg = maxChecked_err_msg.split(';')[1];
                                }
                                else {
                                    errMsg = "Please select atmost " + maxChecked + " options";
                                }

                                this.addError(field, errMsg);
                                return;
                            }
                            else {
                                this.removeError(field);
                            }

                        }
                        else {
                            if (field.value.trim()) {
                                this.removeError(field);
                            }
                            else {

                                this.addError(field, errMsg);
                                return;
                            }
                        }
                        break;
                    default:
                        this.showInternalError("unrecognized form field");
                        console.log(field);
                        break;
                }
            }
            else {
                this.removeError(field);
            }

            //dataType checking
            if (dataSet.hasOwnProperty("type")) {
                let dataType = "";
                errMsg = "";
                let dataTypeTemp = dataSet.type;
                let hasErrMsg = (dataTypeTemp.indexOf(';') >= 0); //checking if attribute has err message

                if (hasErrMsg) {
                    let dataTypeArr = dataTypeTemp.split(';');
                    dataType = dataTypeArr[0];
                    errMsg = dataTypeArr[1];
                }
                else {
                    dataType = dataTypeTemp;
                    errMsg = "";
                }

                if (field.value.trim()) {

                    if (dataSet.hasOwnProperty("minlength") || dataSet.hasOwnProperty("maxlength")) {
                        if (!this.checkLength(field)) {
                            return;
                        }
                    }

                    switch (dataType.toLowerCase()) {
                        case "int":
                            errMsg = (errMsg == "") ? "Please enter integer number" : errMsg;
                            if (this.isInt(field.value)) {

                                let intMax = dataSet.hasOwnProperty("max") ? (parseInt(dataSet.max, 10) !== NaN ? parseInt(dataSet.max, 10) : null) : null;
                                let intMin = dataSet.hasOwnProperty("min") ? (parseInt(dataSet.min, 10) !== NaN ? parseInt(dataSet.min, 10) : null) : null;
                                let intCurrent = parseInt(field.value, 10) != null ? parseInt(field.value, 10) : null;
                                if (intMin !== null) {
                                    if (intCurrent < intMin) {
                                        errMsg = "Value should be greater then " + intMin.toString();
                                        if (dataSet.min.indexOf(';') > -1) {
                                            errMsg = dataSet.min.split(';')[1];
                                        }
                                        this.addError(field, errMsg);
                                        return;
                                    }
                                }

                                if (intMax !== null) {
                                    if (intCurrent > intMax) {
                                        errMsg = "Value should be less then " + intMax.toString();
                                        if (dataSet.max.indexOf(';') > -1) {
                                            errMsg = dataSet.max.split(';')[1];
                                        }
                                        this.addError(field, errMsg);
                                        return;
                                    }
                                }

                                this.removeError(field);
                            }
                            else {
                                this.addError(field, errMsg);
                            }
                            break;

                        case "uint":
                            errMsg = errMsg == "" ? "Please enter unsigned integer number" : errMsg;
                            if (this.isUint(field.value)) {

                                let uintMax = dataSet.hasOwnProperty("max") ? (parseInt(dataSet.max, 10) !== NaN ? parseInt(dataSet.max, 10) : null) : null;
                                let uintMin = dataSet.hasOwnProperty("min") ? (parseInt(dataSet.min, 10) !== NaN ? parseInt(dataSet.min, 10) : null) : null;
                                let uintCurrent = parseInt(field.value, 10) != null ? parseInt(field.value, 10) : null;
                                if (uintMin !== null) {
                                    if (uintCurrent < uintMin) {
                                        errMsg = "Value should be greater then " + uintMin.toString();
                                        if (dataSet.min.indexOf(';') > -1) {
                                            errMsg = dataSet.min.split(';')[1];
                                        }
                                        this.addError(field, errMsg);
                                        return;
                                    }
                                }

                                if (uintMax !== null) {
                                    if (uintCurrent > uintMax) {
                                        errMsg = "Value should be less then " + uintMax.toString();
                                        if (dataSet.max.indexOf(';') > -1) {
                                            errMsg = dataSet.max.split(';')[1];
                                        }
                                        this.addError(field, errMsg);
                                        return;
                                    }
                                }

                                this.removeError(field);
                            }
                            else {
                                this.addError(field, errMsg);
                            }

                            break;
                        case "float":
                            errMsg = errMsg == "" ? "Please enter decimal number" : errMsg;
                            if (this.isFloat(field.value)) {
                                let floatMax = dataSet.hasOwnProperty("max") ? parseFloat(dataSet.max) : NaN;
                                let floatMin = dataSet.hasOwnProperty("min") ? parseFloat(dataSet.min) : NaN;
                                let floatCurrent = parseFloat(field.value);
                                if (floatMin !== NaN && floatCurrent !== NaN) {
                                    if (floatCurrent < floatMin) {
                                        errMsg = "Value should be greater then " + floatMin.toString();
                                        if (dataSet.min.indexOf(';') > -1) {
                                            errMsg = dataSet.min.split(';')[1];
                                        }
                                        this.addError(field, errMsg);
                                        return;
                                    }
                                }

                                if (floatMax !== NaN && floatCurrent !== NaN) {
                                    if (floatCurrent > floatMax) {
                                        errMsg = "Value should be less then " + floatMax.toString();
                                        if (dataSet.max.indexOf(';') > -1) {
                                            errMsg = dataSet.max.split(';')[1];
                                        }
                                        this.addError(field, errMsg);
                                        return;
                                    }
                                }
                                this.removeError(field);
                            }
                            else {
                                this.addError(field, errMsg);
                            }
                            break;
                        case "ufloat":
                            errMsg = errMsg == "" ? "Please enter decimal number" : errMsg;
                            if (this.isUfloat(field.value)) {
                                let ufloatMax = dataSet.hasOwnProperty("max") ? parseFloat(dataSet.max) : NaN;
                                let ufloatMin = dataSet.hasOwnProperty("min") ? parseFloat(dataSet.min) : NaN;
                                let ufloatCurrent = parseFloat(field.value);

                                if (ufloatMin !== NaN && ufloatCurrent !== NaN) {
                                    if (ufloatCurrent < ufloatMin) {
                                        errMsg = "Value should be greater then " + ufloatMin.toString();
                                        if (dataSet.min.indexOf(';') > -1) {
                                            errMsg = dataSet.min.split(';')[1];
                                        }
                                        this.addError(field, errMsg);
                                        return;
                                    }
                                }

                                if (ufloatMax !== NaN && ufloatCurrent !== NaN) {
                                    if (ufloatCurrent > ufloatMax) {
                                        errMsg = "Value should be less then " + ufloatMax.toString();
                                        if (dataSet.max.indexOf(';') > -1) {
                                            errMsg = dataSet.max.split(';')[1];
                                        }
                                        this.addError(field, errMsg);
                                        return;
                                    }
                                }

                                this.removeError(field);
                            }
                            else {
                                this.addError(field, errMsg);
                            }
                            break;
                        case "tel":
                            errMsg = errMsg == "" ? "Invalid telephone number" : errMsg;
                            if (this.isTel(field.value)) {
                                this.removeError(field);
                            }
                            else {
                                this.addError(field, errMsg);
                            }
                            break;

                        case "email":
                            errMsg = errMsg == "" ? "Invalid email address" : errMsg;
                            if (this.isEmail(field.value)) {
                                this.removeError(field);
                            }
                            else {
                                this.addError(field, errMsg);
                            }
                            break;
                        case "alphabets":
                            errMsg = errMsg == "" ? "Only alphabets without spaces are allowed" : errMsg;
                            if (this.isAlphabetsWithOutSpace(field.value)) {
                                this.removeError(field);
                            }
                            else {
                                this.addError(field, errMsg);
                            }
                            break;
                        case "alphabets_s":
                            errMsg = errMsg == "" ? "Only alphabets are allowed" : errMsg;
                            if (this.isAlphabetsWithSpace(field.value)) {

                                this.removeError(field);
                            }
                            else {
                                this.addError(field, errMsg);
                            }
                            break;
                        case "alphanumeric":
                            errMsg = errMsg == "" ? "Only alphanumeric without spaces are allowed" : errMsg;
                            if (this.isAlphaNumericWithOutSpace(field.value)) {
                                this.removeError(field);
                            }
                            else {
                                this.addError(field, errMsg);
                            }
                            break;
                        case "alphanumeric_s":
                            errMsg = errMsg == "" ? "Only alphanumerics are allowed" : errMsg;
                            if (this.isAlphaNumericWithSpace(field.value)) {
                                this.removeError(field);
                            }
                            else {
                                this.addError(field, errMsg);
                            }
                            break;
                        case "regexp":

                            break;
                        case "url":
                            errMsg = errMsg == "" ? "Invalid url" : errMsg;
                            if (this.isUrl(field.value)) {
                                this.removeError(field);
                            }
                            else {
                                this.addError(field, errMsg);
                            }
                            break;
                        default:
                            console.error("invalid data type");
                            break;
                    }
                }

            }

            if (dataSet.hasOwnProperty("compare")) {
                let compareObj = this.getCustomErrMsg(dataSet.compare);
                let dataVal1 = field.value;
                let dataVal2 = (<HTMLInputElement>document.getElementById(compareObj.Key)).value;
                if (this.compareData(dataVal1, dataVal2)) {
                    this.removeError(field);
                    return;
                }
                else {
                    if (compareObj.Value) {
                        errMsg = compareObj.Value;
                    }
                    else {
                        errMsg = "Value does not match";
                    }
                    this.addError(field, errMsg);
                    return;
                }
            }

        }

        private checkLength = (field: HTMLInputElement) => {
            let errMessage = '';
            let data = field.dataset;
            if (data.hasOwnProperty("minlength")) {
                let minData = this.getCustomErrMsg(data.minlength);
                let minLength = parseInt(minData.Key, 10);
                if (field.value.length < minLength) {
                    errMessage = minData.Value.length ? minData.Value : "value length should be greater then " + minData.Key;
                    this.addError(field, errMessage);
                    return false;
                }
                else {
                    this.removeError(field);
                }
            }

            if (data.hasOwnProperty("maxlength")) {
                let maxData = this.getCustomErrMsg(data.maxlength);
                let maxLength = parseInt(maxData.Key, 10);
                if (field.value.length > maxLength) {
                    errMessage = maxData.Value.length ? maxData.Value : "value length should be less then " + maxData.Key;
                    this.addError(field, errMessage);
                    return false;
                }
                else {
                    this.removeError(field);
                }

            }
            return true;
        }

        private compareData = (Data1: any, Data2: any) => {
            return (Data1 === Data2);
        }



        private getCustomErrMsg = (attrKey: string): CustomErrMsgObject => {
            let msgObj: CustomErrMsgObject = {
                Key: "",
                Value: ""
            };
            if (attrKey.indexOf(";") > -1) {
                let tempArr = attrKey.split(';');
                msgObj["Key"] = tempArr[0];
                msgObj["Value"] = tempArr[1];
            }
            else {
                msgObj["Key"] = attrKey;
                msgObj["Value"] = "";
            }
            return msgObj;
        }

        private CheckLength = (field: HTMLInputElement & HTMLTextAreaElement) => {
            let MinLength = field.dataset.hasOwnProperty('minlength') ? parseFloat(field.dataset["minlength"]) : NaN;
            let MaxLength = field.dataset.hasOwnProperty('maxlength') ? parseFloat(field.dataset["maxlength"]) : NaN;
            let CurrentLength = field.value.length;
            if (MinLength !== NaN && CurrentLength !== NaN) {
                if (MinLength < CurrentLength) {
                    let errMessage = `Value length should be minimun ${MinLength} in length`;
                    let CustomErrMsg = this.getCustomErrMsg("minlength");
                    if (CustomErrMsg.Value) {
                        errMessage = CustomErrMsg.Value;
                    }
                    this.addError(field, errMessage);
                    return;
                }
            }
            if (MaxLength !== NaN && CurrentLength !== NaN) {
                if (MaxLength > CurrentLength) {
                    let errMessage = `Value length should be maximum ${MaxLength} in length`;
                    let CustomErrMsg = this.getCustomErrMsg("maxlength");
                    if (CustomErrMsg.Value) {
                        errMessage = CustomErrMsg.Value;
                    }
                    this.addError(field, errMessage);
                    return;
                }
            }
            this.removeError(field);
        }

        isInt(inputValue: string) {
            let rgx = /^-?\d*$/g.test(inputValue);
            return rgx;
        }

        /**
        *Returns true if input string is a positive integer otherwise false
        *@param {string} [inputValue] Input field value
        *@return {boolean}  
        */
        isUint(inputValue: string) {
            let rgx = /^[0-9]\d*$/g.test(inputValue);
            return rgx;
        }

        /**
        *Returns true if input string is an signed float number otherwise false
        *@param {string} [inputValue] Input field value
        *@return {boolean}  
        */
        isFloat(inputValue: string) {
            let rgx = /^-?\d+(\.\d+)?$/g.test(inputValue);
            return rgx;
        }
        /**
        *Returns true if input string is an ubsigned float number otherwise false
        *@param {string} [inputValue] Input field value
        *@return {boolean}  
        */
        isUfloat(inputValue: string) {
            let rgx = /^\d+(\.\d+)?$/g.test(inputValue);
            return rgx;
        }
        /**
        *Returns true if input string is a telephone number otherwise false
        *@param {string} [inputValue] Input field value
        *@return {boolean}  
        */
        isTel(inputValue: string) {
            let rgx = /^[+]?\d+(\-\d+)*$/g.test(inputValue);
            return rgx;
        }
        /**
        *Returns true if input string is a valid email otherwise false
        *@param {string} [inputValue] Input field value
        *@return {boolean}  
        */
        isEmail(inputValue: string) {
            let valid = /^[_a-zA-Z0-9-]+(\.[_a-zA-Z0-9-]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*(\.[a-zA-Z][a-zA-Z]+)$/g.test(inputValue);
            return valid;
        }



        /**
        *Returns true if input string is alphabets without spaces otherwise false
        *@param {string} [inputValue] Input field value
        *@return {boolean}  
        */
        isAlphabetsWithOutSpace(inputValue: string) {
            let rgx = /[^a-zA-Z]/g.test(inputValue);
            return !rgx;
        }

        /**
        *Returns true if input string is alphabets including spaces otherwise false
        *@param {string} [inputValue] Input field value
        *@return {boolean}  
        */
        isAlphabetsWithSpace(inputValue: string) {
            let rgx = /[^a-zA-Z\s]/g.test(inputValue);
            return !rgx;
        }

        /**
        *Returns true if input string is alphanumeric with spaces otherwise false
        *@param {string} [inputValue] Input field value
        *@return {boolean}  
        */
        isAlphaNumericWithSpace(inputValue: string) {
            let rgx = /^[a-zA-Z0-9\s]+$/;
            return (rgx.test(inputValue));
        };
        /**
        *Returns true if input string is alphanumeric without spaces otherwise false
        *@param {string} [inputValue] Input field value
        *@return {boolean}
        */
        isAlphaNumericWithOutSpace(inputValue: string) {
            let rgx = /^[a-zA-Z0-9]+$/;
            return (rgx.test(inputValue));
        };
        /**
         *Returns true if input string is valid url otherwise false
         * @param {string} inputValue 
         * @return {bool}
         */
        isUrl(inputValue: string) {

            if (this.isEmail(inputValue)) {
                return false;
            }

            let expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
            let regex = new RegExp(expression);
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
        addError(field: HTMLInputElement, errMessage: string) {
            field.classList.add("invalid");
            let targetErrElement = <HTMLElement>document.querySelector("#" + field.getAttribute("data-err-id"));
            targetErrElement.innerHTML = errMessage;
            targetErrElement.style.display = "block";
        }

        /**
        *Make a field valid by removing error
        *@param {object} [field] Html field object
        *@return {void}  Returns void
        */
        removeError(field: HTMLInputElement) {
            field.classList.remove("invalid");
            let targetErrElement = <HTMLElement>document.getElementById(field.getAttribute("data-err-id"));
            targetErrElement.innerHTML = "";
            targetErrElement.style.display = "none";
        }


        /**
         * Show runtime error depands upon working enviroment
         * @param {string} errMessage 
         */
        showInternalError(errMessage: string) {

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
    }
    
}
