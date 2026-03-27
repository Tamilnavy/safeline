package com.safeline.safeline.model;

public enum CommitteePermission {
    COMPLAINT_HANDLER,
    COMMITTEE_LEAD,
    ESCALATION_HEAD,
    
    // Legacy permissions from older schema version
    SUPER_ADMIN,
    ORG_ADMIN,
    OWNER,
    ADMIN,
    USER,
    HR,
    EMPLOYEE,
    INVESTIGATOR,
    ADMINISTRATION
}
