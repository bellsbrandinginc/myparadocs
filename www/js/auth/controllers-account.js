angular.module('starter.controllers-account', [])

.controller('AccountCtrl', function(
  $rootScope, $scope, $state, $stateParams, $timeout, 
  $ionicModal, $ionicHistory, $ionicPopup, $ionicActionSheet,
  Auth, Profile, Codes, Utils,$location,$window,$timeout,
  $ionicGesture,$ionicModal,$ionicSideMenuDelegate) {

  // communicates with the DOM
  $scope.status = {
    loading: true,
    loadingProfile: true,
    changePasswordMode: "lost",
    updateMessage: "Update account", //default
    updateButtonClass: 'button-positive', //default
    toggleLoginManual: false,
    mode: $stateParams.mode,
    loadPersonalOptionsMessage: "",
    hideUpdateProfileField: true,
    loginMode: "intro"
  };


  /**
  * ---------------------------------------------------------------------------------------
  * AuthState monitoring
  * ---------------------------------------------------------------------------------------
  */

  $scope.$on('$ionicView.enter', function(e) {
    // global variables
    $scope.AuthData = Auth.AuthData;
  
    checkAuth();
  });

  // monitor and redirect the user based on its authentication state
  function checkAuth() {
    $scope.AuthData = Auth.AuthData;
    if(!$scope.AuthData.hasOwnProperty('uid')){
      Auth.getAuthState().then(
        function(AuthData){
          $scope.AuthData = AuthData;
          handleLoggedIn();
        },
        function(notLoggedIn){
          handleLoggedOut();
        }
      )
    } else {
      handleLoggedIn();
    };
  }; // ./ checkAuth()

  
  // handles when the user is logged in
  function handleLoggedIn() {

    // @dependency
    loadProfileData();

    // proceed to next state if specified (for instance when user comes from foreign state)
    proceedNext();
  };
  
  // fn proceed next
  function proceedNext() {
    if($stateParams.nextState != undefined && $stateParams.nextState != null && $stateParams.nextState != "") {
      $ionicHistory.nextViewOptions({
        disableBack: true,
      });
      if($stateParams.nextState == 'app.checkout') {
        $state.go($stateParams.nextState, {modeIter: 0});
      } else {
        $state.go($stateParams.nextState);
      }
    };
  };
  
  // handles when the user is logged out
  function handleLoggedOut() {
    
    if($state.current.name == 'app.account') {
      openLogin();
      // if for some reason the modals are not automatically opened, show a button
      $timeout(function(){
        $scope.status['toggleLoginManual'] = true;
      }, 1500);
    };
    $scope.status['loadingProfile'] = false;
  };

  // update auth status in other controllers
  function broadcastAuthChange() {
    $rootScope.$broadcast('rootScope:authChange', {});
  };

  
  /**
  * ---------------------------------------------------------------------------------------
  * MODAL: Login
  * ---------------------------------------------------------------------------------------
  */

  // Form data for the login modal
  $scope.loginData = {};

  $ionicModal.fromTemplateUrl('templates/auth/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
    $ionicHistory.nextViewOptions({
      disableAnimate: true,
      disableBack: true
    });
    $state.go('discover');
  };

  // Open the login modal
  $scope.login = function() {
    openLogin();
  };
  function openLogin() {
    if($scope.modal != undefined) {
      $scope.modal.show();
    } else {
      $timeout(function(){
        openLogin();
      }, 1500)
    }
  };

  $scope.unAuth = function() {
    Auth.unAuth();
    
    $scope.AuthData = {};
    $scope.ProfileData = {};
    
    $scope.loginData = {};  
    $scope.signUpData = {};           $scope.closeSignUp();
    $scope.changeEmailData = {};      $scope.closeChangeEmail();
    $scope.changePasswordData = {};   $scope.closeChangePassword();
    $scope.setProfileData = {};       $scope.closeSetProfile();
    $scope.ProfileData = {};
    $scope.OtherData = {};
    
    broadcastAuthChange();
    handleLoggedOut();
  };

  // Perform the login action when the user submits the login form
  
  $scope.doLoginSocial = function(provider) {
    Auth.signInSocial(provider).then(
      function(AuthData){
        // -->
        proceedLogin(AuthData);
      },
      function(error){
        Codes.handleError(error);
      }
    )
  };
  
  $scope.doLogin = function() {
    if($scope.loginData.userEmail && $scope.loginData.userPassword) {
      Utils.showMessage("Signing in user... ");
      Auth.signInPassword($scope.loginData.userEmail, $scope.loginData.userPassword).then(
        function(AuthData){
          
          // -->
          proceedLogin(AuthData);
          
        },
        function(error){
          Codes.handleError(error);
        }
      )
    }
  };
  
  // wrapper for email and social login
  function proceedLogin(AuthData) {
    // hide modals
    $scope.modal.hide();
    $scope.modalSignUp.hide();
    $scope.modalChangePassword.hide();

    broadcastAuthChange();
    Utils.showMessage("Signed in!", 500);

    // handle logged in
    $scope.AuthData = AuthData;
    handleLoggedIn();
	$state.go('discover');
  };


  // ---------------------------------------------------------------------------
  //
  // MODAL: Sign Up
  //
  // ---------------------------------------------------------------------------

  // Form data for the signUp modal
  $scope.signUpData = {};

  // Create the signUp modal that we will use later
  $ionicModal.fromTemplateUrl('templates/auth/signup.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modalSignUp = modal;
  });
  $scope.closeSignUp = function() {
    $scope.modalSignUp.hide();
   $scope.modal.show();
  };
   $scope.closeSignUp2 = function() {
       $scope.modalSignUp.hide();
       $scope.login();
    $state.go('splash');
  };
  $scope.signUp = function() {
    console.log('test')
    $scope.modal.hide();
    $scope.modalSignUp.show();
  };
  $scope.doSignUp = function() {       console.log('Doing signUp', $scope.signUpData);
    if($scope.signUpData.userEmail && $scope.signUpData.userPassword) {
        Utils.showMessage("Creating user... ");
        Auth.signUpPassword($scope.signUpData.userEmail, $scope.signUpData.userPassword).then(
            function(AuthData){

                $scope.loginData = $scope.signUpData;
                $scope.doLogin();
				$state.go('discover');

            }, function(error){
                Codes.handleError(error)
            }
        )
    } else {
        Codes.handleError({code: "INVALID_INPUT"})
    }
  };



  // ---------------------------------------------------------------------------
  //
  // MODAL: Change Password
  //
  // ---------------------------------------------------------------------------

  // Form data for the signUp modal
  $scope.changePasswordData = {};

  // Create the signUp modal that we will use later
  $ionicModal.fromTemplateUrl('templates/auth/change-password.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modalChangePassword = modal;
  });
  $scope.closeChangePassword = function() {
    $scope.modalChangePassword.hide();
    if($scope.status.changePasswordMode == 'lost') {
      $scope.modal.show();
    }
  };
  $scope.changePassword = function(mode) {
    // when authenticated
    if($scope.AuthData.hasOwnProperty('password')){
      $scope.changePasswordData = {
          userEmail: $scope.AuthData.password.email
      }
    }
    $scope.status['changePasswordMode'] = mode;
    $scope.modal.hide();
    $scope.modalChangePassword.show();
  };

  //
  // step 1: reset password
  //
  $scope.resetPassword = function() {
      if($scope.changePasswordData.userEmail) {
        Utils.showMessage("Resetting password");
        Auth.resetPassword(
            $scope.changePasswordData.userEmail).then(
            function(success){
                Utils.showMessage("Password has been reset. Please check your email for the temporary password", 2000);
                $scope.status['changePasswordMode'] = 'change';
            }, function(error){
                Codes.handleError(error)
            }
        )
    } else {
        Codes.handleError({code: "INVALID_INPUT"})
    }
  };

  //
  // step 2: change password
  //
  $scope.doChangePassword = function() {
    if($scope.changePasswordData.userEmail && $scope.changePasswordData.oldPassword && $scope.changePasswordData.newPassword) {
        Utils.showMessage("Changing password... ");
        Auth.changePassword(
            $scope.changePasswordData.userEmail,
            $scope.changePasswordData.oldPassword,
            $scope.changePasswordData.newPassword).then(
            function(AuthData){

                //
                Utils.showMessage("Password Changed!");
                //
                $scope.loginData = {
                    userEmail:      $scope.changePasswordData.userEmail,
                    userPassword:   $scope.changePasswordData.newPassword,
                }
                $scope.doLogin();

            }, function(error){
                Codes.handleError(error)
            }
        )
    } else {
        Codes.handleError({code: "INVALID_INPUT"})
    }
  };


  // ---------------------------------------------------------------------------
  //
  // MODAL: Change E-mail
  //
  // ---------------------------------------------------------------------------

  // Form data for the login modal
  $scope.changeEmailData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/auth/change-email.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modalChangeEmail = modal;
  });
  $scope.closeChangeEmail = function() {
    $scope.modalChangeEmail.hide();
  };
  $scope.changeEmail = function() {
    // when authenticated
    if($scope.AuthData.hasOwnProperty('password')){
        $scope.changeEmailData = {
            oldEmail: $scope.AuthData.password.email
        }
    }
    $scope.modal.hide();
    $scope.modalChangeEmail.show();
  };
  $scope.doChangeEmail = function() {       console.log('changeEmail', $scope.changeEmailData);
    if($scope.changeEmailData.oldEmail && $scope.changeEmailData.newEmail && $scope.changeEmailData.userPassword) {

        Utils.showMessage("Changing e-mail...")

        Auth.changeEmail(
            $scope.changeEmailData.oldEmail,
            $scope.changeEmailData.newEmail,
            $scope.changeEmailData.userPassword).then(
            function(success){

                //
                $scope.closeChangeEmail();
                Utils.showMessage("E-mail changed!", 500)

            }, function(error){
                Codes.handleError(error)
            }
        )
    } else {
        Codes.handleError({code: "INVALID_INPUT"})
    }
  };
  
  
  
  
  // ---------------------------------------------------------------------------
  //
  // MODAL: Set username and displayname
  //
  // ---------------------------------------------------------------------------

  // Form data for the login modal
  $scope.setProfileData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/auth/change-profile.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modalSetProfile = modal;
  });
  
  $scope.closeSetProfile = function() {
    $scope.modalSetProfile.hide();
  };
  
  $scope.setProfile = function() {
    openSetProfile();
  };
  function openSetProfile() {
    if($scope.modalSetProfile != undefined) {
      $scope.modalSetProfile.show();
    } else {
      $timeout(function(){
        openSetProfile();
      }, 1500)
    }
  };
  
  $scope.finishSetProfile = function() {
    if($scope.ProfileData.hasOwnProperty('meta')){
      if($scope.ProfileData.meta.hasOwnProperty('username') && $scope.ProfileData.meta.hasOwnProperty('displayName')) {
        $scope.modalSetProfile.hide();
        $state.go('app.dash');
      } else {
        Codes.handleError({code: "PROFILE_NOT_SET"})
      }
    } else {
      Codes.handleError({code: "PROFILE_NOT_SET"})
    }
  };
  
  
  
  
  
  
  
  /**
  * ---------------------------------------------------------------------------------------
  * Update profile (delivery details in this exercise)
  * ---------------------------------------------------------------------------------------
  */

  $scope.ProfileData = {};
  function loadProfileData() {
    $scope.status['loadingProfile'] = true;
    if($scope.AuthData.hasOwnProperty('uid')){
      Profile.get($scope.AuthData.uid).then(
        function(ProfileData) {
          
          // bind to scope
          if(ProfileData != null) {
            $scope.ProfileData = ProfileData;
            
            if($scope.ProfileData.hasOwnProperty('other')) {
              $scope.OtherData = $scope.ProfileData.other;
            }
            
          };
          
          // set a temporary username and displayname
          tempMeta(ProfileData);
          
          //
          $scope.status['loadingProfile'] = false;
          $scope.status['loading'] = false;
        }
      ),
      function(error){
        $scope.status['loadingProfile'] = false;
        $scope.status['loading'] = false;
      }
    };
  };
  
  // temporary sets an username and displayname if user has not specified it
  function tempMeta(ProfileData) {
    // set manual display name or username
    if(ProfileData != null) {
      if(!ProfileData.hasOwnProperty('meta')){
        fnSet();
      };
    } else {
      fnSet();
    };
    
    function fnSet() {
      var tempName = Utils.genRandomName();
      if($scope.AuthData.provider == 'facebook') {
        importFacebook(ProfileData, tempName);
      } else {
        var objMeta = {
          'username': tempName,
          'displayName': tempName
        }
        Profile.setGlobal($scope.AuthData.uid, 'meta', objMeta);
        $scope.ProfileData['meta'] = objMeta;
      };
    };
  };
  
  
  function importFacebook(ProfileData, optUsername) {
    console.log('import facebook');
    console.log($scope.AuthData);
    
    // set facebook
    Profile.setGlobal($scope.AuthData.uid, 'facebook', $scope.AuthData.facebook);
    $scope.ProfileData['facebook'] = $scope.AuthData.facebook;
    
    // set meta
    var objMeta = {
      'username': optUsername,
      'displayName': $scope.AuthData.facebook.displayName
    }
    Profile.setGlobal($scope.AuthData.uid, 'meta', objMeta);
    $scope.ProfileData['facebook'] = $scope.AuthData.facebook;
    $scope.ProfileData['meta'] = objMeta;
    
    // set profile image
    Profile.setGlobal($scope.AuthData.uid, 'profilePicture', $scope.AuthData.facebook.profileImageURL);
    $scope.ProfileData['profilePicture'] = $scope.AuthData.facebook.profileImageURL;
    
  };
  
  $scope.importFacebookNew = function() {
    importFacebook(null, $scope.ProfileData.meta.username);
  };
  
  // popup generic
  var myPopup;
  $scope.popupData = {};
  function showPopup(title, inputStr) {
    $scope.popupData['inputStr'] = inputStr;
    myPopup = $ionicPopup.show({
    template: '<input type="text" ng-model="popupData.inputStr">',
    title: title,
    scope: $scope,
    buttons: [
      { text: 'Cancel' },
      {
        text: '<b>Save</b>',
        type: 'button-positive',
        onTap: function(e) {
          if (!$scope.popupData.inputStr) {
            //don't allow the user to close unless he enters wifi password
            e.preventDefault();
          } else {
            return $scope.popupData.inputStr;
          }
        }
      }
    ]
    });
  }
  
  // fn change 
  $scope.changeDisplayName = function() {
    showPopup('Change display name', preparePopupData('meta', 'displayName'));
    myPopup.then(function(newDisplayName) {
      if(newDisplayName != undefined && newDisplayName != null) {
        Profile.setSub($scope.AuthData.uid, "meta", "displayName", newDisplayName).then(
          function(success){
            loadProfileData();
          }
        );
      };
    });
  };

  // fn change username
  $scope.changeUsername = function() {
    showPopup('Change username', preparePopupData('meta', 'username'));
    myPopup.then(function(newUsername) {
      if(newUsername != undefined && newUsername != null) {
        Profile.changeUserName($scope.AuthData.uid, newUsername).then(
          function(returnObj){
            if(returnObj != "USERNAME_TAKEN") {
              loadProfileData();
            } else {
              $timeout(function(){
                $scope.changeUsername();  //reopen
              }, 1500)
            }
          }
        )
      }
    });
  };
  
  // fn helper
  function preparePopupData(globalProperty, subProperty){
    if($scope.ProfileData.hasOwnProperty(globalProperty)){
      if($scope.ProfileData[globalProperty].hasOwnProperty(subProperty)){
        return $scope.ProfileData[globalProperty][subProperty];
      } else { return "";};
    } else { return "";};
  };

  // fn update profile picture
  $scope.changeProfilePicture = function() {
    // Show the action sheet
    $ionicActionSheet.show({
        buttons: [
            { text: 'Take a new picture' },
            { text: 'Import from phone library' },
        ],
        titleText: 'Change your profile picture',
        cancelText: 'Cancel',
        cancel: function() {
            // add cancel code..
        },
        buttonClicked: function(sourceTypeIndex) {
            proceed(sourceTypeIndex)
            return true;
        }
    });
    function proceed(sourceTypeIndex) {
      Profile.changeProfilePicture(sourceTypeIndex, $scope.AuthData.uid).then(
        function(success){
          loadProfileData();
        }
      );
    };
  };
  
  
  
  /**
  * ---------------------------------------------------------------------------------------
  * Update delivery settings
  * ---------------------------------------------------------------------------------------
  */
  
  $ionicModal.fromTemplateUrl('templates/auth/change-account-delivery.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.deliveryModal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeDelivery = function() {
    $scope.deliveryModal.hide();
    $ionicHistory.nextViewOptions({
      disableAnimate: true,
      disableBack: true
    });
    $state.go('app.account');
  };

  // Open the login modal
  $scope.delivery = function() {
    openDelivery();
  };
  function openDelivery() {
    if($scope.deliveryModal != undefined) {
      $scope.deliveryModal.show();
      loadProfileData();
    } else {
      $timeout(function(){
        openDelivery();
      }, 1500)
    }
  };
  
  $scope.saveDelivery = function() {
    if($scope.OtherData) {
      Profile.setGlobal($scope.AuthData.uid, 'other', $scope.ProfileData.other).then(
        function(success){
          $scope.closeDelivery();
        })
    }
  };
  
  
  /**
  * ---------------------------------------------------------------------------------------
  * Update other settings
  * ---------------------------------------------------------------------------------------
  */
  
  $ionicModal.fromTemplateUrl('templates/auth/change-account-other.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.otherModal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeOther = function() {
    $scope.otherModal.hide();
    $ionicHistory.nextViewOptions({
      disableAnimate: true,
      disableBack: true
    });
    $state.go('app.account');
  };

  // Open the login modal
  $scope.other = function() {
    openOther();
  };
  function openOther() {
    if($scope.otherModal != undefined) {
      $scope.otherModal.show();
      loadOtherData();
    } else {
      $timeout(function(){
        openOther();
      }, 1500)
    }
  };

  $scope.OtherData = {};
  function loadOtherData() {
    $scope.status['loadingOtherData'] = true;
    if($scope.AuthData.hasOwnProperty('uid')){
      Profile.get($scope.AuthData.uid).then(
        function(ProfileData) {
          
          // bind to scope
          if(ProfileData != null) {
            $scope.ProfileData  = ProfileData;
            if(ProfileData.hasOwnProperty('other')) {
              $scope.OtherData    = ProfileData.other;
            }
          };
          
          $scope.status['loadingOtherData'] = false;
        }
      ),
      function(error){
        $scope.status['loadingOtherData'] = false;
      }
    };
  };
  
  $scope.saveOtherData = function() {
    if($scope.OtherData) {
      Profile.setGlobal($scope.AuthData.uid, 'other', $scope.OtherData);
    }
  };

  
  
  
  
  // ---------------------------------------------------------------------------
  // Intro
  $scope.skipIntro = function() {
    $state.go('discover');
  };

  $scope.goTo = function(nextState) {
    $state.go(nextState);
  };
  
  
  
  
$scope.sendEmail = function() {
        // 1
        var bodyText = "<h2>I have an inquiry</h2>";
        if (null != $scope.images) {
            var images = [];
            var savedImages = $scope.images;
            for (var i = 0; i < savedImages.length; i++) {
                // 2
                images.push("" + $scope.urlForImage(savedImages[i]));
                // 3
                images[i] = images[i].replace('file://', '');
            }
             
            // 4
            window.plugin.email.open({
                to:          ["damusicplug@gmail.com"], // email addresses for TO field
                cc:          ["erinbelldeveloper@gmail.com"], // email addresses for CC field
                bcc:         Array, // email addresses for BCC field
                attachments: images, // file paths or base64 data streams
                subject:    "DaMusicPlug", // subject of the email
                body:       bodyText, // email body (for HTML, set isHtml to true)
                isHtml:    true, // indicats if the body is HTML or plain text
            }, function () {
                console.log('email view dismissed');
            },
            this);    
        }
};



$scope.checkOut=function(){

$state.go('checkout');

};
  $scope.playAudio = function()
{
  try{
    $scope.audio = new Audio('media/opening.mp3');
    $scope.audio.play();
	    $scope.audio.volume=1;
		 $scope.audio.loop=true;

  }
  catch(e){
    alert(e);
  }
 
};

  $scope.playAudio1 = function()
{
  try{
    $scope.audio1 = new Audio('media/song2.mp3');
    $scope.audio1.play();
	    $scope.audio1.volume=0.4;

  }
  catch(e){
    alert(e);
  }
  $timeout(function() {
    $scope.audio1.pause();
     }, 2500);
//  $scope.playAudio();
};



  $scope.playAudio2 = function()
{
  try{
    $scope.audio2 = new Audio('media/song4.mp3');
    $scope.audio2.play();
	    $scope.audio2.volume=0.9;

  }
  catch(e){
    alert(e);
  }
  $timeout(function() {
    $scope.audio2.pause();
     }, 2500);
//  $scope.playAudio();
};




  $scope.playAudio3 = function()
{
  try{
    $scope.audio3 = new Audio('media/song7.mp3');
    $scope.audio3.play();
	    $scope.audio3.volume=0.9;

  }
  catch(e){
    alert(e);
  }
 
//  $scope.playAudio();
};
  $scope.playAudio4 = function()
{
   $scope.audio = new Audio('media/opening.mp3');
    
	    $scope.audio.volume=.05;
    $scope.audio4 = new Audio('media/song4.wav');
	$scope.audio.pause();
    $scope.audio4.play();
	$scope.audio4.loop = true;
	    $scope.audio4.volume=0.90;
		 $timeout(function() {
    $scope.audio4.pause();
	$scope.audio.play();
     }, 3000);
//  $scope.playAudio();
};
 $scope.playaudio5 = function()
{
  try{
    $scope.audio5 = new Audio('media/chamber.mp3');
    $scope.audio5.play();
	    $scope.audio5.volume=0.4;
		 $scope.audio5.loop=true;

  }
  catch(e){
    alert(e);
  }
  $timeout(function() {
    $scope.audio5.pause();
     }, 2500);
//  $scope.playAudio();
};


 $scope.playaudio6 = function()
{
  try{
    $scope.audio6 = new Audio('media/song6.mp3');
    $scope.audio6.play();
	    $scope.audio6.volume=0.4;

  }
  catch(e){
    alert(e);
  }
  $timeout(function() {
    $scope.audio6.pause();
     }, 2500);
//  $scope.playAudio();
};
 $scope.playaudio7 = function()
{
  try{
    $scope.audio7 = new Audio('media/raygun.mp3');
    $scope.audio7.play();
	    $scope.audio7.volume=0.4;

  }
  catch(e){
    alert(e);
  }
  $timeout(function() {
    $scope.audio7.pause();
     }, 5500);
//  $scope.playAudio();
};







 $scope.playVideo = function()
{
 
  $timeout(function() {
    $state.go('app.browse');
	    document.getElementsByTagName('video')[0].webkitExitFullscreen();

     }, 13800);
};

  $scope.showlabel = false;
$scope.showActionsheet = function() {
$scope.showlabel=true;
  

  $timeout(function() {
  $scope.showlabel=false;
  }, 2500);
 };
  $scope.showlabel2 = false;
$scope.showActionsheet2 = function() {
$scope.showlabel2=true;
  

  $timeout(function() {
  $scope.showlabel2=false;
  }, 2500);
 };
  $scope.showlabel3 = false;
$scope.showActionsheet3 = function() {
$scope.showlabel3=true;
  

  $timeout(function() {
  $scope.showlabel3=false;
  }, 2500);
 };
  $scope.showlabel4 = false;
$scope.showActionsheet4 = function() {
$scope.showlabel4=true;
  

  $timeout(function() {
  $scope.showlabel4=false;
  }, 2500);
 };
  $scope.showlabel5 = false;
$scope.showActionsheet5 = function() {
$scope.showlabel5=true;
  

  $timeout(function() {
  $scope.showlabel5=false;
  }, 2500);
 };
  $scope.showlabel6 = false;
$scope.showActionsheet6 = function() {
$scope.showlabel6=true;
  

  $timeout(function() {
  $scope.showlabel6=false;
  },2000);
 };
  $scope.showlabel7 = false;
$scope.showActionsheet7 = function() {
$scope.showlabel7=true;
  

  $timeout(function() {
  $scope.showlabel7=false;
  }, 2500);
 };
  $scope.showlabel8 = false;
$scope.showActionsheet8 = function() {
$scope.showlabel8=true;
  

  $timeout(function() {
  $scope.showlabel8=false;
  }, 2500);
 };
  $scope.showlabel9 = false;
$scope.showActionsheet9 = function() {
$scope.showlabel9=true;
  

  $timeout(function() {
  $scope.showlabel9=false;
  }, 2500);
 };
  $scope.showlabel10 = false;
$scope.showActionsheet10 = function() {
$scope.showlabel10=true;
  

  $timeout(function() {
  $scope.showlabel10=false;
  }, 2500);
 };
  $scope.showlabel11 = false;
$scope.showActionsheet11 = function() {
$scope.showlabel11=true;
  

  $timeout(function() {
  $scope.showlabel11=false;
  }, 2500);
 };
  $scope.showlabel12 = false;
$scope.showActionsheet12 = function() {
$scope.showlabel12=true;
  

  $timeout(function() {
  $scope.showlabel12=false;
  }, 2500);
 };








    

 
  
     $ionicModal.fromTemplateUrl('templates/discover/discover1.html', {
    scope: $scope,
    
  }).then(function(modal) {
    $scope.modal1 = modal;
  });
     $scope.openModal1 = function() {
      $scope.modal1.show();
      // Important: This line is needed to update the current ion-slide's width
      // Try commenting this line, click the button and see what happens
    };

    $scope.closeModal1 = function() {
      $scope.modal1.hide();
    };

    // Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
      $scope.modal1.remove();
    });
    // Execute action on hide modal
    $scope.$on('modal1.hide', function() {
      // Execute action
    });
    // Execute action on remove modal
    $scope.$on('modal1.removed', function() {
      // Execute action
    });
    $scope.$on('modal1.shown', function() {
      console.log('Modal is shown!');
    });
 
 
 	   $ionicModal.fromTemplateUrl('templates/discover/discover2.html', {
    scope: $scope,
    
  }).then(function(modal2) {
    $scope.modal2 = modal2;
  });
     $scope.openModal2 = function() {
      $scope.modal2.show();
      // Important: This line is needed to update the current ion-slide's width
      // Try commenting this line, click the button and see what happens
    };

    $scope.closeModal2 = function() {
      $scope.modal2.hide();
    };

    // Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
      $scope.modal2.remove();
    });
    // Execute action on hide modal
    $scope.$on('modal2.hide', function() {
      // Execute action
    });
    // Execute action on remove modal
    $scope.$on('modal2.removed', function() {
      // Execute action
    });
    $scope.$on('modal2.shown', function() {
      console.log('Modal is shown!');
    });
	
	
	
 	  
  	   $ionicModal.fromTemplateUrl('templates/discover/discover3.html', {
    scope: $scope,
    
  }).then(function(modal3) {
    $scope.modal3 = modal3;
  });
     $scope.openModal3 = function() {
      $scope.modal3.show();
      // Important: This line is needed to update the current ion-slide's width
      // Try commenting this line, click the button and see what happens
    };

    $scope.closeModal3 = function() {
      $scope.modal3.hide();
    };

    // Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
      $scope.modal3.remove();
    });
    // Execute action on hide modal
    $scope.$on('modal3.hide', function() {
      // Execute action
    });
    // Execute action on remove modal
    $scope.$on('modal3.removed', function() {
      // Execute action
    });
    $scope.$on('modal3.shown', function() {
      console.log('Modal is shown!');
    });
 
 
  $ionicModal.fromTemplateUrl('templates/app.browse/app.browse5.html', {
    scope: $scope,
    
  }).then(function(modal5) {
    $scope.modal5 = modal5;
  });
     $scope.openModal5 = function() {
	 
      $scope.modal5.show();
      // Important: This line is needed to update the current ion-slide's width
      // Try commenting this line, click the button and see what happens
    };

    $scope.closeModal5 = function() {
      $scope.modal5.hide();
    };

    // Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
      $scope.modal5.remove();
    });
    // Execute action on hide modal
    $scope.$on('modal5.hide', function() {
      // Execute action
    });
    // Execute action on remove modal
    $scope.$on('modal5.removed', function() {
      // Execute action
    });
    $scope.$on('modal5.shown', function() {
      console.log('Modal is shown!');
    });
 
 
 
 
  $scope.gesture = {
    used: ''

  }; 
 
  $scope.onGesture = function(gesture) {
    $scope.gesture.used = gesture;
    console.log(gesture);
 $scope.audio.pause();
	$scope.playAudio1();
	$scope.openModal5();
	
$timeout(function() {
$scope.closeModal5();
    $scope.audio.play();

    }, 2000);
  var element = angular.element(document.querySelector('#content')); 
  };
  
  
  
  
   $scope.gesture1= {
    used: ''

  };  

  $scope.onGesture1 = function(gesture1) {
    $scope.gesture1.used = gesture1;
    console.log(gesture1);
		//$scope.showActionsheet2();
 $scope.audio.pause();
	$scope.playAudio1();
	$scope.openModal1();	
$timeout(function() {
$scope.closeModal1();
    $scope.audio.play();

    }, 2000);

  var element = angular.element(document.querySelector('#content')); 
  };
  
  
  
  
  
  
   $scope.gesture3 = {
    used: ''

  };  

  $scope.onGesture3 = function(gesture3) {
    $scope.gesture3.used = gesture3;
    console.log(gesture3);
    $scope.audio.pause();
	$scope.playAudio1();

	$scope.openModal2();
	
$timeout(function() {
$scope.closeModal2();
    $scope.audio.play();

    }, 4000);
			//$scope.showActionsheet3();
//$scope.closeModal1();
//$scope.openModal1();

		//alert('Swiped right');
	//$state.go('app.browse2');
	//	$state.go('app.browse3');


  var element = angular.element(document.querySelector('#content')); 
  };
  $scope.gesture4 = {
    used: ''

  };  

  
  
  
  
  $scope.onGesture4 = function(gesture4) {
    $scope.gesture4.used = gesture4;
    console.log(gesture4);
			//$scope.showActionsheet4();
	 $scope.audio.pause();
	$scope.playAudio1();

	$scope.openModal3();
	
$timeout(function() {
$scope.closeModal3();
    $scope.audio.play();

    }, 4000);
	//	$state.go('app.browse4');
				//$scope.$root.tabsHidden2 = "tabs-hide";


  var element = angular.element(document.querySelector('#content')); 
  };
  
$scope.contact=function(){
$state.go('contact');
$scope.playAudio4();
};
$scope.checkOut1=function(){
$state.go('checkin1');
$scope.playAudio4();

$scope.modal2.hide();
};

$scope.checkOut2=function(){
$state.go('checkin2');
$scope.playAudio4();

$scope.modal2.hide();

};
$scope.checkOut3=function(){
$state.go('checkin3');
$scope.playAudio4();

$scope.modal2.hide();

};

$scope.checkOut4=function(){
$state.go('checkin4');
$scope.playAudio4();

$scope.modal2.hide();

};
$scope.checkOut5=function(){
$state.go('checkin5');
$scope.playAudio4();

$scope.modal2.hide();

};

$scope.checkOut6=function(){
$state.go('checkin6');
$scope.playAudio4();

$scope.modal2.hide();

};
$scope.checkOut7=function(){
$state.go('checkin7');
$scope.playAudio4();

$scope.modal3.hide();

};
$scope.checkOut8=function(){
$state.go('checkin8');
$scope.playAudio4();

$scope.modal3.hide();

};
$scope.checkOut9=function(){
$state.go('checkin9');
$scope.playAudio4();

$scope.modal3.hide();

};
$scope.checkOut10=function(){
$state.go('checkin10');
$scope.playAudio4();

$scope.modal3.hide();

};
$scope.checkOut11=function(){
$state.go('checkin11');
$scope.playAudio4();

$scope.modal3.hide();

};
$scope.checkOut12=function(){
$state.go('checkin12');
$scope.playAudio4();

$scope.modal3.hide();

};

});
