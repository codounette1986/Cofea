# CommCare Mining HSE

## Product And Functional Specification

Version: MVP / Demo specification  
Date: 2026-08-21

## 1. Product Purpose

CommCare Mining HSE is a frontline Health, Safety and Environment platform for mining operations. It helps workers, contractors, supervisors and HSE teams identify risks, report incidents, conduct inspections, manage corrective actions and monitor safety performance, including in remote and offline environments.

The product complements corporate HSE, ERP, HR, GIS and BI systems. It is not intended to replace them. CommCare provides the operational layer between frontline work and enterprise systems.

## 2. Product Positioning

Positioning: Frontline HSE + AI + Integration

Operational flow:

1. Workers, contractors and supervisors capture HSE events in the field.
2. CommCare Mining HSE structures the data and manages operational workflows.
3. AI and automation support classification, triage, summaries and recommendations.
4. Integration APIs synchronize relevant data with corporate HSE, ERP, HR, GIS and BI systems.

## 3. Product Principles

### Offline-first

Core reporting, inspection and corrective action workflows must work without connectivity and synchronize when connectivity returns.

### Mobile-first

Field workflows should be optimized for Android devices and rapid use in operational environments.

### Low-friction

Reporting a hazard, near miss or incident should be fast enough for frontline adoption. Standard submissions should take approximately 1-2 minutes when no complex investigation is required.

### Workflow-driven

The product should not only collect forms. It must support the full safety loop:

Identify risk -> capture -> triage -> assign action -> resolve -> verify -> visualize.

### Enterprise-compatible

The data model, status values and API boundaries should allow integration with existing corporate systems.

## 4. Target Users

### Worker / Field Agent

Needs to:

- report hazards, unsafe acts, unsafe conditions and near misses;
- report incidents and attach evidence;
- add photos and location details;
- use voice input where appropriate;
- receive relevant safety information and follow-up notifications.

### Supervisor

Needs to:

- review observations and submitted reports;
- conduct inspections;
- assign corrective actions;
- follow up on outstanding and overdue actions;
- confirm completion and closure evidence.

### HSE Manager

Needs to:

- monitor HSE performance across sites, teams and contractors;
- identify recurring hazards and risk themes;
- monitor corrective action completion;
- review incidents and investigation status;
- generate reports for management and compliance.

### Mine / Country Manager

Needs high-level visibility into:

- major risks;
- incidents and serious near misses;
- overdue corrective actions;
- HSE trends;
- site and contractor performance.

## 5. Product Modules

The long-term product contains six core modules. The MVP should focus on the modules needed to prove the complete frontline HSE loop.

### Module 1: Safety Observations

Purpose: capture everyday HSE observations from the field and route them for action when needed.

Observation types:

- unsafe condition;
- unsafe act;
- hazard;
- positive safety observation.

Core fields:

- observation ID;
- observation type;
- site;
- location or GPS point;
- date and time;
- reporter;
- worker or contractor involved, if applicable;
- category;
- severity;
- description;
- photos or attachments;
- immediate action taken;
- whether corrective action is required;
- linked corrective action ID, if created.

Categories:

- PPE;
- vehicles;
- electrical;
- working at height;
- machinery;
- excavation;
- fire;
- chemicals;
- housekeeping;
- environmental;
- other.

Expected workflow:

1. Worker or supervisor submits observation.
2. Supervisor or HSE manager reviews and classifies the observation.
3. If action is required, the reviewer creates or assigns a corrective action.
4. Observation appears in dashboard analytics by site, category, severity and trend.

### Module 2: Incident And Near-Miss Management

Purpose: capture and manage incidents, near misses, injuries, environmental events and equipment/property damage through investigation and closure.

Event types:

- incident;
- near miss;
- injury;
- environmental incident;
- property or equipment damage.

Core fields:

- case ID;
- event type;
- site;
- location or GPS point;
- date and time of event;
- date and time reported;
- reporter;
- people involved;
- contractor involved, if applicable;
- description;
- immediate response;
- severity or potential severity;
- injury details, if applicable;
- equipment or property affected;
- environmental impact details, if applicable;
- attachments and photos;
- investigation owner;
- investigation status;
- root cause;
- linked corrective actions;
- closure summary;
- closure date.

Workflow:

Report -> Triage -> Investigation -> Corrective Action -> Closure.

Status values:

- Reported;
- Under Review;
- Investigation Open;
- Actions Assigned;
- Pending Closure;
- Closed.

### Module 3: Inspections

Purpose: enable supervisors and HSE teams to conduct digital inspections and automatically generate actions for failed checklist items.

Inspection types:

- work area inspection;
- vehicle inspection;
- equipment inspection;
- PPE inspection;
- contractor site inspection;
- environmental control inspection.

Core fields:

- inspection ID;
- inspection type;
- site;
- area or asset inspected;
- inspector;
- date and time;
- checklist responses;
- failed items;
- photos or evidence;
- comments;
- generated corrective action IDs;
- overall result;
- completion status.

Expected workflow:

1. Supervisor starts inspection from a checklist.
2. Each item is marked compliant, non-compliant, not applicable or requires follow-up.
3. Failed items can create corrective actions.
4. Inspection completion contributes to dashboard KPIs.

### Module 4: Corrective Action Management

Purpose: track actions from observations, incidents, near misses and inspections through closure and verification.

Core fields:

- action ID;
- source type;
- source record ID;
- issue summary;
- severity;
- responsible person;
- responsible team or contractor;
- due date;
- status;
- evidence or photo;
- completion notes;
- closure date;
- verifier;
- verification result;
- verification notes.

Status values:

Open -> Assigned -> In Progress -> Completed -> Verified.

Business rules:

- Every action must have an owner and due date before it can move to Assigned.
- Completed actions require completion evidence or notes.
- Verified actions require supervisor or HSE manager confirmation.
- Overdue actions should be highlighted in dashboards and notifications.

### Module 5: Training And Certification

Purpose: track training compliance for employees and contractors.

This module can be phased after the MVP unless training compliance is needed for the demo.

Core fields:

- person ID;
- employee or contractor status;
- role;
- required training;
- completed training;
- certification;
- issue date;
- expiration date;
- refresher requirement;
- compliance status.

Future functionality:

- toolbox talks;
- digital learning content;
- acknowledgement tracking;
- training reminders;
- integration with HR or learning management systems.

### Module 6: HSE Dashboard

Purpose: give supervisors, HSE managers and leadership a clear view of safety performance, outstanding risk and workflow health.

Top KPIs:

- incidents;
- near misses;
- safety observations;
- inspections completed;
- open corrective actions;
- overdue corrective actions;
- training compliance;
- serious events;
- action closure rate.

Analytics views:

- incidents by category;
- hazards by location;
- observations by type;
- trends over time;
- corrective action aging;
- closure performance by team;
- highest-risk sites;
- contractor comparison;
- recurring root causes.

Filters:

- date range;
- site;
- department;
- contractor;
- severity;
- category;
- module;
- status;
- owner.

Dashboard roles:

- Supervisor dashboard: assigned actions, team observations, upcoming inspections and overdue items.
- HSE Manager dashboard: cross-site KPIs, trends, recurring hazards, incidents and action closure.
- Mine / Country Manager dashboard: high-level risk, serious incidents, overdue actions and site ranking.

## 6. MVP Scope

The MVP should prove the end-to-end HSE workflow rather than implement every long-term module in full detail.

### In Scope

- safety observation capture;
- incident and near-miss capture;
- corrective action creation, assignment, completion and verification;
- basic inspection checklist workflow;
- management dashboard with KPI cards, trend charts and overdue action list;
- offline capture and sync behavior for field submissions;
- photo attachments;
- basic role-based views;
- basic AI-assisted classification and summary features.

### Out Of Scope For MVP

- full training and certification management;
- advanced regulatory reporting;
- complex root-cause analysis templates;
- enterprise SSO beyond demo-level authentication;
- deep ERP or HR writeback;
- predictive risk scoring unless using simple demonstration logic.

## 7. AI And Automation

AI should support the frontline workflow without becoming the system of record.

MVP AI features:

- suggest category and severity from report description;
- summarize incident or observation details for supervisors;
- detect duplicate or similar hazards;
- suggest corrective action wording;
- generate management-ready summaries from dashboard data.

Future AI features:

- voice-to-structured-report conversion;
- image-assisted hazard identification;
- recurring hazard pattern detection;
- multilingual report translation;
- automated toolbox talk recommendations.

AI governance requirements:

- AI suggestions must be editable by users.
- Final classifications must be auditable.
- The system should distinguish user-entered fields from AI-suggested fields.
- Sensitive data should not be sent to external AI services without approved controls.

## 8. Integration Requirements

Integration should be API-first and designed to exchange structured HSE records with corporate systems.

Potential integrations:

- corporate HSE system for incident and action records;
- ERP or asset system for equipment references;
- HR system for employee and role data;
- contractor management system for contractor profiles;
- GIS platform for site and location context;
- BI platform for reporting and analytics.

Integration principles:

- CommCare remains the frontline operational capture and workflow layer.
- Corporate systems may remain the master for employees, assets, contractors and official reporting.
- Each integration should define source of truth, sync direction, frequency and conflict behavior.

## 9. Core Data Entities

### Person

- person ID;
- name;
- role;
- employee or contractor type;
- team;
- site;
- supervisor;
- active status.

### Site

- site ID;
- site name;
- country;
- region;
- mine;
- active status.

### Observation

- observation ID;
- type;
- category;
- severity;
- description;
- location;
- reporter;
- date and time;
- attachments;
- corrective action required;
- status.

### Incident Case

- case ID;
- event type;
- severity;
- description;
- location;
- reporter;
- people involved;
- investigation owner;
- status;
- root cause;
- closure summary.

### Inspection

- inspection ID;
- type;
- checklist;
- site;
- inspector;
- date and time;
- result;
- failed items;
- status.

### Corrective Action

- action ID;
- source type;
- source ID;
- issue;
- owner;
- due date;
- severity;
- status;
- completion evidence;
- verifier;
- verification result.

## 10. Role-Based Access

### Worker / Field Agent

Can:

- submit observations;
- submit incidents and near misses;
- add photos and notes;
- view personal submissions and safety messages.

Cannot:

- close investigations;
- verify corrective actions;
- view sensitive cross-site incident details unless authorized.

### Supervisor

Can:

- review team submissions;
- conduct inspections;
- assign actions;
- mark actions complete;
- review overdue actions for their team.

### HSE Manager

Can:

- view and manage HSE records across assigned sites;
- manage investigations;
- verify closures;
- view dashboards and analytics;
- export reports.

### Mine / Country Manager

Can:

- view management dashboards;
- view major incidents and high-risk trends;
- review overdue corrective actions;
- export leadership summaries.

## 11. Notifications

Notification triggers:

- new high-severity incident submitted;
- corrective action assigned;
- corrective action approaching due date;
- corrective action overdue;
- completed action awaiting verification;
- serious event closed;
- inspection overdue or missed.

Channels:

- in-app notifications;
- email where available;
- SMS or WhatsApp for future consideration;
- push notifications for mobile app where supported.

## 12. Reporting

Standard reports:

- incident register;
- near-miss register;
- observation register;
- corrective action register;
- overdue corrective actions;
- inspection completion report;
- site performance summary;
- monthly HSE management report.

Export formats:

- CSV;
- Excel;
- PDF summary;
- API feed for BI tools.

## 13. Demo Scenario

Recommended end-to-end demo:

1. A worker submits a hazard observation with a photo.
2. AI suggests the category as Vehicles and severity as High.
3. A supervisor reviews the observation and creates a corrective action.
4. The action is assigned to a responsible person with a due date.
5. The responsible person marks the action completed and adds evidence.
6. The supervisor verifies closure.
7. The dashboard updates KPIs, trend charts and action status.
8. A manager views overdue actions and site-level risk trends.

## 14. MVP Backlog

### Must Have

- mobile-friendly observation form;
- incident and near-miss form;
- corrective action workflow;
- action assignment and due dates;
- status tracking;
- dashboard KPI cards;
- overdue action view;
- site, category and severity filters;
- photo attachment support;
- offline submission queue;
- basic role-based navigation.

### Should Have

- inspection checklist form;
- AI category and severity suggestion;
- AI summary of incident reports;
- exportable registers;
- notification rules;
- contractor filter;
- action verification step.

### Could Have

- voice input;
- map view of hazards;
- recurring hazard detection;
- training compliance widget;
- management PDF report;
- multilingual support.

### Not In MVP

- full learning management;
- advanced regulatory forms;
- real-time predictive analytics;
- complex integration orchestration;
- automated official incident filing.

## 15. Success Metrics

Adoption:

- number of observations submitted;
- percentage of active supervisors using inspections;
- number of workers submitting reports.

Workflow performance:

- average time from submission to review;
- corrective action closure rate;
- overdue corrective action percentage;
- average time to verify completed actions.

Safety intelligence:

- top recurring categories;
- high-risk locations identified;
- incident and near-miss trend visibility;
- percentage of records with complete classification.

Demo success:

- user can submit a field report in under two minutes;
- supervisor can assign and close the action flow end to end;
- dashboard reflects operational changes clearly;
- AI assistance improves speed without blocking manual control.

## 16. Open Decisions

- Which corporate systems need first integration: HSE, ERP, HR, GIS or BI?
- Is the first demo expected to run in CommCare, a web dashboard, or both?
- Which mining site, country and language should be used for sample data?
- What severity model should be used: simple Low/Medium/High/Critical or a corporate risk matrix?
- Should contractor users authenticate separately from employees?
- Is training compliance required for the August demo or can it remain a roadmap module?

