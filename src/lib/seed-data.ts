import { QHSENode } from '@/types/qhse';

const now = () => new Date().toISOString();

const leaf = (
  id: string,
  parentId: string,
  title: string,
  extra: Partial<QHSENode> = {},
): QHSENode => ({
  id,
  parentId,
  title,
  status: 'draft',
  updatedAt: now(),
  children: [],
  ...extra,
});

export const SEED_TREE: QHSENode = {
  id: 'root',
  parentId: null,
  title: 'Project QHSE Plan - KEZAD Mamourah',
  description:
    'Quality, Health, Safety & Environment plan for the KEZAD Mamourah External Facilities Management (FM) services contract.',
  owner: 'QHSE Manager',
  status: 'active',
  updatedAt: now(),
  children: [
    {
      id: 'intro',
      parentId: 'root',
      title: 'Introduction and Scope',
      status: 'active',
      updatedAt: now(),
      children: [
        leaf('intro-1', 'intro', 'Mission and Commitment'),
        leaf('intro-2', 'intro', 'External FM Services Scope'),
        leaf('intro-3', 'intro', 'Project Deliverables'),
        leaf('intro-4', 'intro', 'Regulatory Compliance'),
      ],
    },
    {
      id: 'qhse',
      parentId: 'root',
      title: 'QHSE Management System',
      status: 'active',
      updatedAt: now(),
      children: [
        leaf('qhse-1', 'qhse', 'Four-Level Documentation Hierarchy'),
        leaf('qhse-2', 'qhse', 'Leadership and Commitment'),
        leaf('qhse-3', 'qhse', 'QHSE Objectives and Targets'),
        leaf('qhse-4', 'qhse', 'Document Control and Recording'),
      ],
    },
    {
      id: 'roles',
      parentId: 'root',
      title: 'Roles and Responsibilities',
      status: 'active',
      updatedAt: now(),
      children: [
        leaf('roles-1', 'roles', 'Management (General, Facility, Compliance)'),
        leaf('roles-2', 'roles', 'Technical (Facility Engineer, Supervisor)'),
        leaf('roles-3', 'roles', 'All Employees and Subcontractors'),
        leaf('roles-4', 'roles', 'First Aider and Fire Warden'),
      ],
    },
    {
      id: 'comms',
      parentId: 'root',
      title: 'Communication and Training',
      status: 'active',
      updatedAt: now(),
      children: [
        leaf('comms-1', 'comms', 'Daily Briefings and Weekly Toolbox Talks'),
        leaf('comms-2', 'comms', 'Site and Subcontractor QHSE Meetings'),
        leaf('comms-3', 'comms', 'QHSE Induction and Competency Matrix'),
        leaf('comms-4', 'comms', 'Notice Boards and Safety Alerts'),
      ],
    },
    {
      id: 'planning',
      parentId: 'root',
      title: 'Planning and Risk Management',
      status: 'active',
      updatedAt: now(),
      children: [
        leaf('plan-1', 'planning', 'Risk and Aspect/Impact Assessment'),
        leaf('plan-2', 'planning', 'Legal Register'),
        leaf('plan-3', 'planning', 'Statutory Inspection Programme'),
        leaf('plan-4', 'planning', 'Emergency Management Plan'),
      ],
    },
    {
      id: 'impl',
      parentId: 'root',
      title: 'Implementation and Operations',
      status: 'active',
      updatedAt: now(),
      children: [
        leaf('impl-1', 'impl', 'Permit To Work (PTW) System'),
        leaf('impl-2', 'impl', 'Safety Arrangements (Height, Confined Space, LOTO)'),
        leaf('impl-3', 'impl', 'Occupational Health and Medical Requirements'),
        leaf('impl-4', 'impl', 'Environmental and Waste Management'),
        leaf('impl-5', 'impl', 'Quality Controls and Maintenance (PPM/Reactive)'),
      ],
    },
    {
      id: 'monitor',
      parentId: 'root',
      title: 'Monitoring and Review',
      status: 'active',
      updatedAt: now(),
      children: [
        leaf('mon-1', 'monitor', 'Site Inspections (L10 Weekly and L4 Monthly)'),
        leaf('mon-2', 'monitor', 'Incident Reporting and Investigation (L15/L15a)'),
        leaf('mon-3', 'monitor', 'HSE Performance Monitoring (Active/Reactive)'),
        leaf('mon-4', 'monitor', 'SLAs and KPI Reporting'),
      ],
    },
  ],
};

export default SEED_TREE;
