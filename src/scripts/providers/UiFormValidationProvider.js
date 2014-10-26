'use strict';

angular.module('uiFormValidation.providers').provider('uiFormValidation', function ($injector, $compileProvider) {
  var $this = this;
  
  this.formValidations = {};
  
  this.validationErrorsTemplate = function() {
    return '<div class="alert alert-danger"><div ng-repeat="controlErrors in errors"><div class="row" ng-repeat="controlError in controlErrors.errors"><span ng-bind-html="controlError"</span></div></div></div>';
  };
  
  this.defaultErrorMessage = function(errorName, scope, control, validationController) {
    return 'Validation "' + errorName + '" has failed.';
  };
   
  var validationErrorsModes = $injector.get('uiFormValidation.validationErrorsModes');
  this.validationErrorsMode = [validationErrorsModes.onSubmitAndInvalid, validationErrorsModes.onDirtyAndInvalid];
  
  var validationNoticeModes = $injector.get('uiFormValidation.validationNoticeModes');
  this.validationNoticeMode = [validationNoticeModes.onSubmitAndInvalid, validationNoticeModes.onDirtyAndInvalid];
  
  this.validationErrorsLocation = "after{this}";
  
  this.addFormValidation = function(validation) {
    this.formValidations[validation.validationName] = validation;
    
    $compileProvider.directive.apply(null, [validation.validationName, function() {
      return {
        restrict: 'A',
        require: ['^uiValidation', 'ngModel'],
        link: function(scope, element, attrs, controllers) {
          var uiValidationController = controllers[0];
          var ngModelController = controllers[1];
          
          if (validation.performableValidation && typeof validation.performableValidation === "function") {
            //TODO: performableValidation(element)
          }

          /* For AngularJS 1.2.x - uses parsers pipeline */
          if (!ngModelController.$validators) {
            var value = ngModelController.$modelValue || ngModelController.$viewValue;
            var validationResult = $this.validate(value, uiValidationController, ngModelController, validation, scope, element, attrs);
            
            if (validationResult) {
              ngModelController.$setValidity(validation.validationName, true);
            } else {
              ngModelController.$setValidity(validation.validationName, false);
            }
            
            ngModelController.$parsers.unshift(function(value) {
              var validationResult = $this.validate(value, uiValidationController, ngModelController, validation, scope, element, attrs);
              ngModelController.$setValidity(validation.validationName, validationResult);
              return value;
            });
            
            ngModelController.$formatters.unshift(function(value) {
              var validationResult = $this.validate(value, uiValidationController, ngModelController, validation, scope, element, attrs);
              ngModelController.$setValidity(validation.validationName, validationResult);
              return value;
            });
          } else {           /* For AngularJS 1.3.x - uses validators pipeline */
            ngModelController.$validators[validation.validationName] = function(modelValue, viewValue) {
              var value = modelValue || viewValue;
              return $this.validate(value, uiValidationController, ngModelController, validation, scope, element, attrs);
            };
            
            ngModelController.$validate();
          }
        }
      };
    }]);
  };
  
  this.validate = function (value, uiValidationController, ngModelController, validation, scope, element, attrs) {
    var validationContext = {
      uiValidationController: uiValidationController,
      ngModelController: ngModelController,
      validation: validation,
      scope: scope,
      attrs: attrs,
      element: element
    };
    
    return validation.validate(value, validationContext);
  };
  
  this.supportedValidations = $injector.get('uiFormValidation.supportedValidations');
  
  function UIFormValidationProvider() {
    this.customValidations = [];
  
    this.validationNoticeMode = $this.validationNoticeMode;
  
    this.validationErrorsMode = $this.validationErrorsMode;
    this.validationErrorsLocation = $this.validationErrorsLocation;
    this.validationErrorsTemplate = $this.validationErrorsTemplate;
    
    this.formValidations = $this.formValidations;
    this.defaultErrorMessage = $this.defaultErrorMessage;

    angular.forEach($this.supportedValidations, function (validation, index) {
      $this.addFormValidation(validation);
    });
  }
  
  this.$get = [function () {
    return new UIFormValidationProvider();
  }];
});




