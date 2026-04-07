function isEmpty(value) {
    return !value || value.trim() === "";
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    // 8-12 chars, at least 1 lowercase, 1 uppercase, 1 digit, 1 symbol
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,12}$/;
    return passwordRegex.test(password);
}

function validateRegistration(formData) {
    const errors = {};

    if (isEmpty(formData.firstName)) {
        errors.firstName = "First name is required.";
    }

    if (isEmpty(formData.lastName)) {
        errors.lastName = "Last name is required.";
    }

    if (isEmpty(formData.email)) {
        errors.email = "Email is required.";
    } else if (!validateEmail(formData.email)) {
        errors.email = "Please enter a valid email address.";
    }

    if (isEmpty(formData.password)) {
        errors.password = "Password is required.";
    } else if (!validatePassword(formData.password)) {
        errors.password = "Password must be 8-12 characters and include uppercase, lowercase, number, and symbol.";
    }

    return errors;
}

function validateLogin(formData) {
    const errors = {};

    if (isEmpty(formData.email)) {
        errors.email = "Email is required.";
    }

    if (isEmpty(formData.password)) {
        errors.password = "Password is required.";
    }

    if (!formData.role || (formData.role !== "customer" && formData.role !== "clerk")) {
        errors.role = "Please select a valid role.";
    }

    return errors;
}

module.exports = {
    validateRegistration,
    validateLogin
};