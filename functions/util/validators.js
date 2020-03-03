const isEmail = (email) => {
  // ref: https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript/28804496
  
  // const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const emailRegEx = /^([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})$/i;
  if(email.match(emailRegEx)) return true;
  return false;
}

const isEmpty = (string) => {
  if(string.trim() === "") return true;
  return false;
}

exports.validateSignupData = (data) => {
  let errors = {};
  if(isEmpty(data.email)) {
    errors.email = 'Must not be empty';
  } else if(!isEmail(data.email)) {
    errors.email = 'Must be a valid email address';
  }

  if(isEmpty(data.password)) {
    errors.password = 'Must not be empty';
  }

  if(data.confirmPassword !== data.password) {
    errors.confirmPassword = 'Password must match';
  }
  
  if(isEmpty(data.handle)) {
    errors.handle = 'Must not be empty';
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  }
}

exports.validateLoginData = (data) => {
  let errors = {};

  if(isEmpty(data.email)) {
    errors.email = 'Must not be empty';
  } else if(!isEmail(data.email)) {
    errors.email = 'Must be a valid email address';
  }

  if(isEmpty(data.password)) {
    errors.password = 'Must not be empty';
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  }
}

exports.reduceUserDetails = (data) => {
  let userDetails = {};

  if(!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
  if(!isEmpty(data.website.trim())) {
    // https://website.com
    if(data.website.trim().substring(0, 4) !== 'http') {
      userDetails.website = `http://${data.website.trim()}`
    } else {
      userDetails.website = data.website;
    }
  }
  if(!isEmpty(data.location.trim())) userDetails.location = data.location;

  return userDetails;
}