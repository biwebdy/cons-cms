// @ts-nocheck
"use strict";

const DEBUG = false;

const debugLog = (...args) => {
    if (DEBUG) {
        args.forEach(arg => {
            if (typeof arg === 'object' && arg !== null) {
                console.log(JSON.stringify(arg, null, 2));
            } else {
                console.log(arg);
            }
        });
    }
};

const components = [
    {
        collection: 'consultant.banking-info',
        field: 'bankingInfo',
        mandatoryFields: []
    },
    {
        collection: 'consultant.languages',
        field: 'languages',
        mandatoryFields: []
    },
    {
        collection: 'consultant.educations',
        field: 'education',
        mandatoryFields: []
    },
    {
        collection: 'consultant.preferences',
        field: 'preferences',
        mandatoryFields: ['industries', 'preferredLocationOfWork', 'skills', 'rate', 'availableDate']
    }
];

const additionalFields = [
    'firstName',
    'lastName',
    'email',
    'dob',
    'resume'
];

const validateField = (value, fieldName) => {
    if (value === undefined) {
        debugLog(`Field ${fieldName} is undefined`);
        return false;
    }
    if (value === null) {
        debugLog(`Field ${fieldName} is null`);
        return false;
    }

    // Special case for rate field - must be strictly above 0
    if (fieldName.includes('rate') && (typeof value === 'number' && value <= 0)) {
        debugLog(`Field ${fieldName} is 0 or negative, considering as empty`);
        return false;
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            debugLog(`Field ${fieldName} is an empty array`);
            return false;
        }
        return true;
    }
    if (typeof value === 'string' && value.trim() === '') {
        debugLog(`Field ${fieldName} is an empty string`);
        return false;
    }
    if (typeof value === 'object' && Object.keys(value).length === 0) {
        debugLog(`Field ${fieldName} is an empty object`);
        return false;
    }
    return true;
};

const isComponentComplete = (component, componentName, mandatoryFields = []) => {
    debugLog('\nChecking component:', componentName);
    debugLog('Component data:', component);
    debugLog('Mandatory fields:', mandatoryFields);

    // If there are no mandatory fields, consider it complete regardless of content
    if (mandatoryFields.length === 0) {
        debugLog(`${componentName}: No mandatory fields, considering complete`);
        return true;
    }

    // If component doesn't exist but no mandatory fields, it's complete
    if (!component) {
        debugLog(`${componentName}: Component is null/undefined but no mandatory fields`);
        return mandatoryFields.length === 0;
    }

    // Handle array components
    if (Array.isArray(component)) {
        if (component.length === 0) {
            debugLog(`${componentName}: Empty array component`);
            return mandatoryFields.length === 0;
        }

        // Check each mandatory field in the first item
        const missingFields = mandatoryFields.filter(field =>
            !validateField(component[0][field], `${componentName}[0].${field}`));

        if (missingFields.length > 0) {
            debugLog(`${componentName}: Missing/invalid fields in array:`, missingFields);
            return false;
        }
        return true;
    }

    // Handle object components
    const missingFields = mandatoryFields.filter(field =>
        !validateField(component[field], `${componentName}.${field}`));

    if (missingFields.length > 0) {
        debugLog(`${componentName}: Missing/invalid fields in object:`, missingFields);
        return false;
    }
    return true;
};

const calculatePercentageCompletion = (consultant) => {
    if (!consultant) {
        throw new Error('Consultant object is required');
    }

    debugLog('\n=== Starting Profile Completion Calculation ===\n');
    debugLog('Consultant data:', consultant);

    let completedComponents = 0;
    let completedAdditionalFields = 0;
    let missingFields = {
        components: [],
        additionalFields: [],
        details: {}
    };

    // Check components
    components.forEach(component => {
        const componentName = component.collection;
        const fieldName = component.field;
        const componentData = consultant[fieldName];
        const mandatoryFields = component.mandatoryFields;

        debugLog(`\nAnalyzing component: ${componentName}`);

        if (isComponentComplete(componentData, componentName, mandatoryFields)) {
            debugLog(`✓ Component ${componentName} is complete`);
            completedComponents++;
        } else {
            debugLog(`✗ Component ${componentName} is incomplete`);
            missingFields.components.push(fieldName);

            // Track missing fields details
            const missingComponentFields = [];

            if (!componentData) {
                if (mandatoryFields.length > 0) {
                    debugLog(`${componentName}: Component is missing entirely`);
                    missingComponentFields.push(...mandatoryFields);
                }
            } else if (Array.isArray(componentData) && componentData.length === 0) {
                if (mandatoryFields.length > 0) {
                    debugLog(`${componentName}: Component is an empty array`);
                    missingComponentFields.push(...mandatoryFields);
                }
            } else {
                const dataToCheck = Array.isArray(componentData) ? componentData[0] : componentData;
                mandatoryFields.forEach(field => {
                    if (!validateField(dataToCheck[field], `${componentName}.${field}`)) {
                        missingComponentFields.push(field);
                    }
                });
            }

            if (missingComponentFields.length > 0) {
                missingFields.details[fieldName] = missingComponentFields;
                debugLog(`Missing fields in ${componentName}:`, missingComponentFields);
            }
        }
    });

    // Check additional fields
    debugLog('\nChecking additional fields:');
    additionalFields.forEach(field => {
        if (validateField(consultant[field], field)) {
            debugLog(`✓ Additional field ${field} is complete`);
            completedAdditionalFields++;
        } else {
            debugLog(`✗ Additional field ${field} is incomplete`);
            missingFields.additionalFields.push(field);
        }
    });

    // Calculate total percentage
    const basePercentage = 20;
    const componentWeight = 19;
    const additionalFieldsBonus = 4;

    let totalPercentage = basePercentage;
    totalPercentage += completedComponents * componentWeight;

    if (completedAdditionalFields === additionalFields.length) {
        totalPercentage += additionalFieldsBonus;
    }

    const result = {
        percentageCompletion: Math.round(totalPercentage),
        profileCompleted: totalPercentage === 100,
        missingFields: missingFields
    };

    debugLog('\n=== Completion Calculation Results ===');
    debugLog(`Completion Percentage: ${result.percentageCompletion}%`);
    debugLog('Missing Fields:', result.missingFields);
    debugLog('Profile Completed:', result.profileCompleted);

    return result;
};

module.exports = {
    calculatePercentageCompletion,
};